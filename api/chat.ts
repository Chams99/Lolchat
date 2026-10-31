// POST /api/chat: streams a champion's reply as plain text.
// The browser sends only the champion id and the conversation; the persona
// instructions, model and limits are fixed here, so the OpenRouter key
// cannot be used for anything else.
import { findChampion, systemPrompt, type Champion } from "../shared/champions.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4.1-mini";
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 2000;
const MAX_TOTAL_CHARS = 24000;
const MAX_REPLY_TOKENS = 500;
// Time allowed for OpenRouter to start answering, then for the whole reply.
const CONNECT_TIMEOUT_MS = 20_000;
const TOTAL_TIMEOUT_MS = 60_000;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatErrorCode = "invalid_request" | "not_configured" | "busy" | "timeout" | "upstream_error";

function errorResponse(status: number, error: ChatErrorCode | "method_not_allowed", headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

/** Validates the request body. Returns null for anything malformed or oversized. */
export function parseChatRequest(body: unknown): { champion: Champion; messages: ChatMessage[] } | null {
  if (!body || typeof body !== "object") return null;
  const { champion: championId, messages } = body as { champion?: unknown; messages?: unknown };
  if (typeof championId !== "string") return null;
  const champion = findChampion(championId);
  if (!champion) return null;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;

  let total = 0;
  const clean: ChatMessage[] = [];
  for (const message of messages) {
    if (!message || typeof message !== "object") return null;
    const { role, content } = message as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim();
    if (!text || text.length > MAX_MESSAGE_CHARS) return null;
    total += text.length;
    clean.push({ role, content: text });
  }
  if (total > MAX_TOTAL_CHARS || clean[clean.length - 1].role !== "user") return null;
  return { champion, messages: clean };
}

/** Turns OpenRouter's server-sent events into the reply text alone. */
function eventsToText(): TransformStream<string, string> {
  let buffer = "";
  const handleLine = (line: string, controller: TransformStreamDefaultController<string>) => {
    if (!line.startsWith("data:")) return; // comments such as ": OPENROUTER PROCESSING"
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    let event: { error?: unknown; choices?: { delta?: { content?: unknown } }[] };
    try {
      event = JSON.parse(data);
    } catch {
      return;
    }
    if (event.error) {
      controller.error(new Error("upstream_error"));
      return;
    }
    const text = event.choices?.[0]?.delta?.content;
    if (typeof text === "string" && text) controller.enqueue(text);
  };
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) handleLine(line.trimEnd(), controller);
    },
    flush(controller) {
      if (buffer) handleLine(buffer.trimEnd(), controller);
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return errorResponse(503, "not_configured");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "invalid_request");
  }
  const parsed = parseChatRequest(body);
  if (!parsed) return errorResponse(400, "invalid_request");

  const controller = new AbortController();
  const connectTimer = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lolchat.vercel.app",
        "X-Title": "LolChat",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        stream: true,
        temperature: 0.8,
        max_tokens: MAX_REPLY_TOKENS,
        messages: [{ role: "system", content: systemPrompt(parsed.champion) }, ...parsed.messages],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    console.error(timedOut ? "OpenRouter did not respond in time" : "OpenRouter request error");
    return errorResponse(timedOut ? 504 : 502, timedOut ? "timeout" : "upstream_error");
  } finally {
    clearTimeout(connectTimer);
  }

  if (!upstream.ok || !upstream.body) {
    console.error("OpenRouter request failed with status", upstream.status);
    return upstream.status === 429 ? errorResponse(429, "busy", { "Retry-After": "20" }) : errorResponse(502, "upstream_error");
  }

  const totalTimer = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);
  const stopTimer = new TransformStream<string, string>({ flush: () => clearTimeout(totalTimer) });
  const text = upstream.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(eventsToText())
    .pipeThrough(stopTimer)
    .pipeThrough(new TextEncoderStream());

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function GET(): Response {
  return errorResponse(405, "method_not_allowed", { Allow: "POST" });
}

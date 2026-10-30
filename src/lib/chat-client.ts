// Sends a conversation to /api/chat and hands the reply over piece by piece as it streams in.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatErrorCode = "not_configured" | "invalid_request" | "busy" | "timeout" | "upstream_error" | "network" | "empty";

export class ChatError extends Error {
  constructor(public readonly code: ChatErrorCode) {
    super(code);
  }
}

const KNOWN_CODES: ChatErrorCode[] = ["not_configured", "invalid_request", "busy", "timeout", "upstream_error"];

export async function streamReply(
  champion: string,
  messages: ChatMessage[],
  onText: (text: string) => void,
  signal: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ champion, messages }),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ChatError("network");
  }

  if (!response.ok || !response.body) {
    let code: ChatErrorCode = "upstream_error";
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error && (KNOWN_CODES as string[]).includes(body.error)) code = body.error as ChatErrorCode;
    } catch {
      // Not a JSON error body; keep the generic code.
    }
    throw new ChatError(code);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let received = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        received += value.length;
        onText(value);
      }
    }
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ChatError(received ? "upstream_error" : "network");
  }
  if (!received) throw new ChatError("empty");
}

export function errorMessage(code: ChatErrorCode, championName: string): string {
  switch (code) {
    case "not_configured":
      return "The chat isn't connected to a language model on this server yet.";
    case "busy":
      return "Too many conversations at once. Give it a few seconds.";
    case "timeout":
      return `${championName} took too long to answer.`;
    case "network":
      return "You seem to be offline. Check your connection.";
    case "invalid_request":
      return "That message couldn't be sent. Try a shorter one, or start a new conversation.";
    default:
      return `${championName} couldn't answer this time.`;
  }
}

// Chat endpoint, used by Vercel and by the local Express server.
// It forwards a champion conversation to OpenRouter with a fixed model and fixed limits,
// so the API key cannot be used for other models or unbounded requests.

const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
const MAX_TOKENS = 1000;
const MAX_MESSAGES = 60;
const MAX_MESSAGE_CHARS = 8000;
const MAX_TOTAL_CHARS = 60000;
// The page gives up after 15 seconds, so answer before that.
const TIMEOUT_MS = 14000;
const ROLES = new Set(['system', 'user', 'assistant']);

function parseBody(body) {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function cleanMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  let total = 0;
  const clean = [];
  for (const message of messages) {
    if (!message || !ROLES.has(message.role) || typeof message.content !== 'string') return null;
    if (message.content.length > MAX_MESSAGE_CHARS) return null;
    total += message.content.length;
    clean.push({ role: message.role, content: message.content });
  }
  return total <= MAX_TOTAL_CHARS ? clean : null;
}

module.exports = async function chat(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'The chat is not configured' });
  }

  const body = parseBody(req.body);
  const messages = cleanMessages(body && body.messages);
  if (!messages) {
    return res.status(400).json({ error: 'Invalid messages' });
  }
  const temperature = typeof body.temperature === 'number' ? Math.min(Math.max(body.temperature, 0), 1.2) : 0.7;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lolchat.vercel.app',
        'X-Title': 'League Chatbot',
      },
      body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: MAX_TOKENS }),
      signal: controller.signal,
    });
    if (!upstream.ok) {
      console.error('OpenRouter request failed with status', upstream.status);
      return res.status(502).json({ error: 'The chat service is unavailable' });
    }
    const data = await upstream.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (typeof content !== 'string') {
      return res.status(502).json({ error: 'The chat service is unavailable' });
    }
    return res.status(200).json({ choices: [{ message: { role: 'assistant', content } }] });
  } catch (error) {
    const timedOut = error && error.name === 'AbortError';
    console.error(timedOut ? 'OpenRouter request timed out' : 'OpenRouter request error');
    return res.status(timedOut ? 504 : 502).json({ error: 'The chat service is unavailable' });
  } finally {
    clearTimeout(timer);
  }
};

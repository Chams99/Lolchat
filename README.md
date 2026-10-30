# League Chatbot

Chat with twelve League of Legends champions, each answering in their own voice, with a themed interface per champion and typed-out replies. Live at [lolchat.vercel.app](https://lolchat.vercel.app).

Champions: Kayle, Ahri, Yasuo, Lux, Garen, Darius, Jhin, Shaco, Swain, Sett, Viego and Evelynn.

## How it works

- `index.html` is the whole interface: plain HTML, CSS and JavaScript.
- `api/chat.js` forwards the conversation to [OpenRouter](https://openrouter.ai). The model, reply length and input size are fixed on the server, so the API key cannot be used for other models or oversized requests.
- `api/health.js` returns `{ "status": "ok" }`.

On Vercel the files in `api/` run as serverless functions. Locally, `server.js` serves the page and the same two handlers with Express.

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | yes | OpenRouter key used by the chat endpoint |
| `OPENROUTER_MODEL` | no | Model to use, `openai/gpt-3.5-turbo` by default |

On Vercel, set them under Project Settings → Environment Variables. Locally, copy `.env.example` to `.env`.

## Local development

Requires Node.js 18 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deployment

Deployed on Vercel from the `main` branch, with no build step. `vercel.json` sets security headers.

## Disclaimer

This is a fan project and is not affiliated with or endorsed by Riot Games. League of Legends™ is a trademark of Riot Games, Inc.

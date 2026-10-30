# LolChat

Chat with twelve League of Legends champions, each answering in their own voice. Pick a champion, ask anything, and the reply streams in as they speak. Live at [lolchat.vercel.app](https://lolchat.vercel.app).

Champions: Kayle, Ahri, Yasuo, Lux, Garen, Darius, Jhin, Shaco, Swain, Sett, Viego and Evelynn.

## Features

- Replies stream word by word, with a Stop button
- Each champion keeps their own conversation, saved in the browser
- Suggested questions to start each conversation
- Champion art and accent colours change with the selected champion
- Works with a keyboard and screen readers, on phones and desktops, and respects reduced-motion settings

## How it works

- `src/` is the React interface.
- `shared/champions.ts` holds each champion's title, greeting, personality and suggested questions.
- `api/chat.ts` receives only the champion and the conversation, builds the character instructions on the server, and streams the reply from [OpenRouter](https://openrouter.ai). The model, reply length and input size are fixed on the server, so the API key cannot be used for anything else, and provider errors are never shown to visitors.
- `api/health.ts` returns `{ "status": "ok" }`.

On Vercel, the files in `api/` run as functions. During development, the Vite dev server runs the same handlers.

## Stack

React 19, TypeScript, Vite, plain CSS, Vitest. Fonts are self-hosted through Fontsource; champion images come from Riot's Data Dragon.

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | yes | OpenRouter key used by the chat endpoint |
| `OPENROUTER_MODEL` | no | Model to use, `openai/gpt-4.1-mini` by default |

On Vercel, set them under Project Settings → Environment Variables. Locally, copy `.env.example` to `.env`. Setting a spending limit on the key in OpenRouter is recommended for a public demo.

## Development

Requires Node.js 20 or later.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # endpoint tests, with OpenRouter mocked
npm run build      # type check and production build
```

## Disclaimer

LolChat isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

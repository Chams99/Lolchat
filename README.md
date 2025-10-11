# League of Legends Chatbot

An interactive chatbot featuring League of Legends champions with AI-powered responses and dynamic visual effects.

## 🌟 Features

- Chat with 12 different League of Legends champions
- Each champion has unique personality and speaking style
- Beautiful champion-themed UI with particle effects
- Typing animation for AI responses
- Mobile-responsive design

## 🚀 Deployment

### Cloudflare Pages (Recommended)

1. **Prerequisites:**
   - A Cloudflare account
   - An OpenRouter API key ([get one here](https://openrouter.ai/))

2. **Deploy via Git:**
   - Push your code to a GitHub/GitLab repository
   - Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
   - Click "Create a project" > "Connect to Git"
   - Select your repository
   - Configure build settings:
     - **Build command:** (leave empty)
     - **Build output directory:** `.`
     - **Root directory:** (leave empty)
   - Click "Save and Deploy"

3. **Set Environment Variables:**
   - In your Cloudflare Pages project settings
   - Go to "Settings" > "Environment variables"
   - Add: `OPENROUTER_API_KEY` with your API key
   - Deploy to both Production and Preview environments

4. **Deploy via Wrangler CLI (Alternative):**
   ```bash
   # Install Wrangler
   npm install -g wrangler
   
   # Login to Cloudflare
   wrangler login
   
   # Deploy
   wrangler pages deploy . --project-name=lolchat
   ```

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Create a `.dev.vars` file (copy from `.dev.vars.example`)
   - Add your OpenRouter API key

3. **Run locally with Wrangler:**
   ```bash
   npx wrangler pages dev . --port 3000
   ```
   
   Or use the Express server:
   ```bash
   npm start
   ```

4. **Open in browser:**
   - Navigate to `http://localhost:3000`

## 📁 Project Structure

```
lolchat/
├── index.html              # Main HTML file with UI and JavaScript
├── server.js              # Express server (for local dev)
├── functions/             # Cloudflare Pages Functions
│   └── api/
│       ├── chat.js       # Chat API endpoint
│       └── health.js     # Health check endpoint
├── wrangler.toml         # Cloudflare configuration
├── package.json          # Dependencies
└── README.md            # This file
```

## 🎮 Available Champions

- Kayle - The Righteous
- Ahri - The Nine-Tailed Fox
- Yasuo - The Unforgiven
- Lux - The Lady of Luminosity
- Garen - The Might of Demacia
- Darius - The Hand of Noxus
- Jhin - The Virtuoso
- Shaco - The Demon Jester
- Swain - The Noxian Grand General
- Sett - The Boss
- Viego - The Ruined King
- Evelynn - Agony's Embrace

## 🔧 Configuration

### Environment Variables

- `OPENROUTER_API_KEY`: Your OpenRouter API key (required)

### API Settings

You can modify the AI model and parameters in the `index.html` file:
- Model: `openai/gpt-3.5-turbo` (default)
- Temperature: `0.7`
- Max tokens: `1000`

## ⚠️ Disclaimer

This is a fan project and is not affiliated with or endorsed by Riot Games. League of Legends™ is a trademark of Riot Games, Inc.

## 📝 License

MIT License - See LICENSE file for details


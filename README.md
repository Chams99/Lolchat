# League of Legends Chatbot

An interactive chatbot that lets you chat with League of Legends champions using AI. Each champion has their own personality, voice, and theme.

## ⚠️ Security Notice

**IMPORTANT**: This project now uses a secure backend to protect API keys. The API key is no longer exposed in the frontend code.

## Features

- 🎭 **Champion Personalities**: Each champion responds with their unique personality and lore
- 🎨 **Dynamic Themes**: Visual themes change based on the selected champion
- ✨ **Particle Effects**: Beautiful animated backgrounds
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔒 **Secure API Handling**: Backend proxy protects your API keys

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp env.example .env

# Edit .env and add your OpenRouter API key
OPENROUTER_API_KEY=your_actual_api_key_here
```

### 3. Get an API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up and get your API key
3. Add it to your `.env` file

### 4. Run the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## Security Features

- ✅ API key stored in environment variables
- ✅ Backend proxy prevents client-side exposure
- ✅ CORS protection
- ✅ Input validation
- ✅ Error handling

## Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Set up your environment variables on your hosting platform
2. Run `npm start`
3. Ensure your hosting platform supports Node.js

### Environment Variables for Production
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `PORT`: Server port (optional, defaults to 3000)

## File Structure

```
lolchat/
├── index.html          # Frontend application
├── server.js           # Backend server
├── package.json        # Dependencies
├── .env               # Environment variables (create this)
├── env.example        # Example environment file
└── README.md          # This file
```

## API Usage

The backend provides a secure proxy to the OpenRouter API:

- `POST /api/chat` - Send chat messages
- `GET /api/health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

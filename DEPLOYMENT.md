# Vercel Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab Account**: Your code should be in a Git repository
3. **OpenRouter API Key**: Get one from [openrouter.ai](https://openrouter.ai)

### Step 1: Prepare Your Repository
1. Push your code to GitHub/GitLab
2. Make sure all files are committed:
   - `index.html`
   - `server.js`
   - `package.json`
   - `vercel.json`
   - `.gitignore`

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect it's a Node.js project

### Step 3: Set Environment Variables
In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: Your OpenRouter API key
   - **Environment**: Production, Preview, Development
3. Click **Save**

### Step 4: Deploy
1. Vercel will automatically deploy your project
2. Your app will be available at: `https://your-project-name.vercel.app`

## 🔧 Troubleshooting

### Common Issues:
- **API Key Not Working**: Make sure environment variable is set correctly
- **Build Errors**: Check that all dependencies are in `package.json`
- **404 Errors**: Ensure `vercel.json` routing is correct

### Environment Variables Check:
```bash
# In Vercel dashboard, verify these are set:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
NODE_ENV=production
```

## 📝 Important Notes

- ✅ **Copyright Disclaimer**: Added to protect against legal issues
- ✅ **Secure API Handling**: Backend proxy protects your API key
- ✅ **Automatic HTTPS**: Vercel provides SSL certificates
- ✅ **Global CDN**: Fast loading worldwide

## 🔒 Security Features

- API key stored in Vercel environment variables
- Backend proxy prevents client-side exposure
- CORS protection enabled
- Input validation and error handling

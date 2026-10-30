// Local development server. On Vercel, the files in api/ run as functions instead.
const path = require('path');
const express = require('express');
require('dotenv').config();

const chat = require('./api/chat');
const health = require('./api/health');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100kb' }));
app.post('/api/chat', chat);
app.get('/api/health', health);
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use(express.static(__dirname, { index: false }));

app.listen(PORT, () => {
  console.log(`League Chatbot running at http://localhost:${PORT}`);
});

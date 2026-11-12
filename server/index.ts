import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleGenerate } from './routes/generate.js';
import { handleSuggest } from './routes/suggest.js';
import { rateLimiter } from './lib/rateLimit.js';
import { isGeminiConfigured } from './lib/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching origin
    if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '500kb' }));

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: isGeminiConfigured(),
    timestamp: Date.now(),
  });
});

// API Routes with rate limiter
app.post(['/api/suggest', '/suggest'], rateLimiter, handleSuggest);
app.post(['/api/generate', '/generate'], rateLimiter, handleGenerate);

// In production, serve the client build if present
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Content Generator API is running. Client not built yet.');
    }
  });
});

export { app };
export default app;

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Gemini API configured: ${isGeminiConfigured()}`);
  });
}

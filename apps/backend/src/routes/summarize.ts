import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimit';
import { callGeminiAPI } from '../utils/gemini';

export const summarizeRouter = Router();

summarizeRouter.post('/', apiLimiter, async (req, res) => {
  try {
    const { prompt } = req.body as { prompt?: string };

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Invalid request: prompt is required' });
      return;
    }

    const text = await callGeminiAPI(prompt);
    res.json({ text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Summarize error:', error);
    res.status(500).json({ error: message });
  }
});

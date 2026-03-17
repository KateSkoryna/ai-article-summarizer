import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { summarizeRouter } from './routes/summarize';
import { vocabularyRouter } from './routes/vocabulary';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/summarize', summarizeRouter);
app.use('/vocabulary', vocabularyRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

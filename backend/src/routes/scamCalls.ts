import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { classifyTranscript, classifyRealtime, getKeywordList, getKeywordCategories } from '../services/scamClassifierAgent';

const router = Router();
const dataPath = path.join(__dirname, '../../data/scamTranscripts.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// GET /api/scam-call/transcripts — return all available transcripts
router.get('/transcripts', (_req, res) => {
  try {
    const summaries = data.transcripts.map((t: any) => ({
      id: t.id,
      title: t.title,
      riskLevel: t.riskLevel,
      wordCount: t.words.length,
    }));
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load transcripts' });
  }
});

// GET /api/scam-call/transcript/:id — return a specific transcript's words
router.get('/transcript/:id', (req, res) => {
  try {
    const transcript = data.transcripts.find((t: any) => t.id === req.params.id);
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }
    res.json(transcript);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load transcript' });
  }
});

// POST /api/scam-call/classify — classify a full transcript
router.post('/classify', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text field is required' });
    }
    const result = await classifyTranscript(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Classification failed' });
  }
});

// POST /api/scam-call/classify-realtime — classify words processed so far
router.post('/classify-realtime', async (req, res) => {
  try {
    const { words } = req.body;
    if (!Array.isArray(words)) {
      return res.status(400).json({ error: 'Words array is required' });
    }
    const result = await classifyRealtime(words);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Realtime classification failed' });
  }
});

// GET /api/scam-call/keywords — return keyword categories
router.get('/keywords', (_req, res) => {
  try {
    const categories = getKeywordCategories();
    const keywords = getKeywordList();
    res.json({ categories, keywords });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load keywords' });
  }
});

export { router as scamRoutes };

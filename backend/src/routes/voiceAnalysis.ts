import { Router } from 'express';
import { analyzeVoice } from '../services/voiceSpoofAgent';

const router = Router();

// POST /api/voice/analyze — analyze an uploaded audio file
router.post('/analyze', (req, res) => {
  try {
    const { fileName, fileSize } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }
    // Simulate processing delay
    const result = analyzeVoice(fileName, fileSize || 0);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Voice analysis failed' });
  }
});

export { router as voiceRoutes };

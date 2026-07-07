import { Router } from 'express';
import { analyzeMessage } from '../services/chatAdvisorAgent';

const router = Router();

// POST /api/chat/analyze — analyze a citizen's message for fraud indicators
router.post('/analyze', async (req, res) => {
  try {
    const { message, lang } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message field is required' });
    }
    const result = await analyzeMessage(message, lang || 'en');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Chat analysis failed' });
  }
});

export { router as chatRoutes };

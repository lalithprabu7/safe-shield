import { Router } from 'express';
import { analyzeCurrency } from '../services/currencyAnalyzerAgent';

const router = Router();

// POST /api/currency/analyze — analyze a currency note image
router.post('/analyze', (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }
    const result = analyzeCurrency(fileName);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Currency analysis failed' });
  }
});

export { router as currencyRoutes };

import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const dataPath = path.join(__dirname, '../../data/heatmapData.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// GET /api/heatmap/data — return heatmap city data
router.get('/data', (_req, res) => {
  try {
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load heatmap data' });
  }
});

export { router as heatmapRoutes };

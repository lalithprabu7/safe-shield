import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { generateEvidenceReport } from '../services/evidenceReportAgent';

const router = Router();
const casesPath = path.join(__dirname, '../../data/sampleCases.json');
const casesData = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

// GET /api/evidence/cases — return available cases
router.get('/cases', (_req, res) => {
  try {
    res.json(casesData.cases);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load cases' });
  }
});

// POST /api/evidence/generate — generate an evidence report
router.post('/generate', (req, res) => {
  try {
    const caseData = req.body;
    const report = generateEvidenceReport(caseData);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate evidence report' });
  }
});

export { router as evidenceRoutes };

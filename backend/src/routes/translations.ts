import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const dataPath = path.join(__dirname, '../../data/translations.json');
const translations = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// GET /api/translations/:lang — return translations for a language
router.get('/:lang', (req, res) => {
  try {
    const lang = req.params.lang;
    const validLangs = ['en', 'hi', 'ta', 'te', 'kn', 'bn', 'mr', 'gu', 'ml', 'or', 'pa', 'as'];
    if (!validLangs.includes(lang)) {
      return res.status(400).json({ error: `Invalid language. Valid: ${validLangs.join(', ')}` });
    }
    res.json(translations[lang]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load translations' });
  }
});

// GET /api/translations — return all translations
router.get('/', (_req, res) => {
  try {
    res.json(translations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load translations' });
  }
});

export { router as translationRoutes };

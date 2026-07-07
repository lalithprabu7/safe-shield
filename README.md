# DigitalShield AI

**AI-powered Digital Public Safety Intelligence Platform** for detecting and preventing digital arrest scams, fraud, and counterfeit currency.

## Problem Statement

Digital arrest scams, voice deepfakes, and counterfeit currency fraud are rapidly growing threats to Indian citizens, costing thousands of crores annually. Victims — often senior citizens and professionals — are manipulated through sophisticated impersonation of law enforcement officers, fake arrest warrants, and demands to transfer funds to "safe accounts." **DigitalShield AI** combats these threats with a multi-agent AI platform that classifies scam calls in real-time, detects voice deepfakes, analyzes fraud networks, verifies currency authenticity, and generates court-ready evidence reports — all in a single unified command center.

## Quick Start

```bash
# Install all dependencies (root + backend + frontend)
npm install

# Start both servers
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

> No API keys, no database setup, no external services required. Everything runs locally.

## Architecture

```
Frontend (React 18 + TypeScript + Vite + Tailwind CSS)
    │
    ├── API Gateway (Express + TypeScript, port 3001)
    │       │
    │       ├── Scam Classifier Agent    — keyword/pattern-based call analysis
    │       ├── Voice Spoof Agent        — simulated deepfake detection
    │       ├── Currency Analyzer Agent  — counterfeit feature detection
    │       ├── Chat Advisor Agent       — citizen fraud advisory
    │       └── Evidence Report Agent    — case data assembly
    │
    └── Mock Data Store (/backend/data/*.json — loaded in-memory)
```

## Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | Live Scam Call Classifier | Real-time transcript analysis with animated risk scoring |
| 2 | Voice Deepfake Detector | Audio file analysis for synthetic voice detection |
| 3 | Citizen Fraud Shield | Chat-based fraud advisory for citizens |
| 4 | Counterfeit Note Scanner | Currency note authenticity verification with annotated overlay |
| 5 | Fraud Network Graph | Interactive force-directed fraud network visualization |
| 6 | Digital Arrest Demo Mode ⭐ | Guided walkthrough of the full detection pipeline |
| 7 | Multi-Language Advisory | Advisory content in 6 Indian languages |
| 8 | Evidence Report Generator | PDF evidence reports with case details |
| 9 | False-Positive Dashboard | ML precision/recall metrics monitoring |
| 10 | Geospatial Fraud Heatmap | India-wide fraud density visualization |
| 11 | Impact Calculator | Real-time animated impact metrics |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Charts**: Recharts
- **Graph Visualization**: react-force-graph-2d
- **Maps**: Leaflet + react-leaflet (OpenStreetMap tiles, no API key)
- **Backend**: Node.js, Express, TypeScript
- **PDF Generation**: jsPDF (client-side)
- **Data**: Local JSON files (no database required)

## Notes

- All AI agents use deterministic keyword/pattern scoring with realistic confidence scores — no external model API keys required
- Map tiles require internet connectivity (OpenStreetMap CDN) but no API key
- All other features work fully offline
- Sample currency note images are included for instant demo of the counterfeit scanner

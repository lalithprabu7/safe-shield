import express from 'express';
import cors from 'cors';
import path from 'path';
import { scamRoutes } from './routes/scamCalls';
import { voiceRoutes } from './routes/voiceAnalysis';
import { chatRoutes } from './routes/chatAdvisor';
import { currencyRoutes } from './routes/currency';
import { fraudGraphRoutes } from './routes/fraudGraph';
import { metricsRoutes } from './routes/metrics';
import { heatmapRoutes } from './routes/heatmap';
import { evidenceRoutes } from './routes/evidence';
import { translationRoutes } from './routes/translations';
import { authRoutes } from './routes/auth';
import { voipRoutes } from './routes/voipGateway';
import { initNLPModel } from './services/chatAdvisorAgent';
import { initVoiceNLPModel } from './services/scamClassifierAgent';

import { seedDatabase } from './seed';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = 3001;

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Export io so it can be used in routes
export { io };

// API Routes
app.use('/api/scam-call', scamRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/fraud-graph', fraudGraphRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/voip', voipRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'DigitalShield AI Backend' });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

httpServer.listen(PORT, async () => {
  console.log(`\n🛡️  DigitalShield AI Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  
  // Initialize Database
  await seedDatabase();
  
  // Initialize AI Models
  await initNLPModel();
  await initVoiceNLPModel();
});

import express from 'express';
import { io } from '../index';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Trigger a mock SIP/VoIP incoming call intercept
router.post('/intercept', async (req, res) => {
  const { phone, details } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // 1. Save intercept to database
    const intercept = await prisma.voIPIntercept.create({
      data: {
        phone,
        status: 'Intercepted',
        details: details ? JSON.stringify(details) : null
      }
    });

    // 2. Broadcast alert to all connected dashboards via WebSockets
    io.emit('voip_alert', {
      id: intercept.id,
      phone: intercept.phone,
      status: intercept.status,
      timeReceived: intercept.timeReceived,
      message: `Suspicious VoIP call intercepted from ${phone}`
    });

    res.status(200).json({ success: true, intercept });
  } catch (error) {
    console.error('VoIP Intercept Error:', error);
    res.status(500).json({ error: 'Failed to process VoIP intercept' });
  }
});

// Simulated webhook for Department of Telecommunications (DoT) SIM auto-blocking
router.post('/block-sim', async (req, res) => {
  const { phone, reason } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // In a real system, this would call TAFCOP/DoT APIs to disable the SIM.
  console.log(`[MOCK TELECOM WEBHOOK] SIM Block request sent for ${phone}. Reason: ${reason || 'Suspicious Activity'}`);

  // Push notification that SIM blocking was initiated
  io.emit('sim_blocked', {
    phone,
    reason: reason || 'Suspicious Activity',
    status: 'Block Requested'
  });

  res.status(200).json({ success: true, message: 'SIM block request submitted successfully' });
});

export { router as voipRoutes };

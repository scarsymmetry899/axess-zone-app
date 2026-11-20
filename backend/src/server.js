import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from './config.js';
import { initDb } from './db.js';
import { initSocketService } from './services/socketService.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import tierRoutes from './routes/tierRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import gateRoutes from './routes/gateRoutes.js';
import promoterRoutes from './routes/promoterRoutes.js';
import sponsorRoutes from './routes/sponsorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

// Initialize Database
initDb();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with permissive CORS for development & production
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

initSocketService(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    console.log(`[HTTP] ${req.method} ${req.path}`);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Axess Live Event & Ticketing Engine',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tiers', tierRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/gate', gateRoutes);
app.use('/api/promoters', promoterRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Error] Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`
======================================================
  AXESS PLATFORM SERVER RUNNING
  HTTP API:        http://localhost:${PORT}
  WebSocket PubSub: ws://localhost:${PORT}
  Environment:     Development (Monochromatic Dark)
======================================================
  `);
});

// AEGIS Backend — Main Server Entry Point
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initSocketServer } = require('./socket/socketServer');

// Routes
const authRoutes = require('./routes/auth');
const violationRoutes = require('./routes/violations');
const studentRoutes = require('./routes/students');

// ─────────────────────────────────────────────
// EXPRESS SETUP
// ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────
// SOCKET.IO SETUP
// ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [process.env.CORS_ORIGIN || 'http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Attach io to app for use in controllers
app.set('io', io);
initSocketServer(io);

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3001',
    'chrome-extension://*'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-AEGIS-Extension']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api', studentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'AEGIS Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[AEGIS Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║      AEGIS Backend — Online           ║
║  Port: ${PORT}                            ║
║  DB:   MongoDB Connected              ║
║  WS:   Socket.io Ready                ║
╚═══════════════════════════════════════╝
    `);
  });
}

start();

module.exports = { app, io };

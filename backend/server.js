// backend/server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require('multer');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

// Import routes
const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agents');
const planRoutes = require('./routes/plans');
const clientRoutes = require('./routes/clients');
const userRoutes = require('./routes/users');
const referralRoutes = require('./routes/referrals');
const elevenLabsRoutes = require('./routes/elevenlabs');
const emailRoutes = require('./routes/email');
const debugRoutes = require('./routes/debug');
const uploadRoutes = require('./routes/upload');
const salesRoutes = require('./routes/sales');
const knowledgeBaseRoutes = require('./routes/knowledgeBase');
const languagesRoutes = require('./routes/languages');
const campaignsRoutes = require('./routes/campaigns');
const adminRoutes = require('./routes/admin');
const adminRolesRoutes = require('./routes/adminRoles');
const clientUsersRoutes = require('./routes/clientUsers');
const clientRolesRoutes = require('./routes/clientRoles');
const assignedPlansRoutes = require('./routes/assignedPlans');
const secretsRoutes = require('./routes/secrets');
const mcpRoutes = require('./routes/mcp');

// Import middleware
const { authenticateJWT } = require('./middleware/auth');

// Import database configuration
const db = require('./config/database');

console.log("🟡 Starting backend server...");

const app = express();

// Trust first proxy so secure cookies work correctly behind tunnels/proxies
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://aicaller.codecafelab.in',
      'https://2nq68jpg-3000.inc1.devtunnels.ms'
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin matches ngrok patterns
    if (origin.match(/^https:\/\/.*\.ngrok-free\.app$/) ||
        origin.match(/^https:\/\/.*\.ngrok\.io$/) ||
        origin.match(/^https:\/\/.*\.ngrok\.app$/) ||
        origin.match(/^https:\/\/.*\.devtunnels\.ms$/) ||
        origin.match(/^https:\/\/.*\.tunnel\.app$/)) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

app.use(express.json());
app.use(cookieParser());

// Test API route
app.get("/", (req, res) => {
  res.send("🟢 Backend is running!");
});

// Database is already initialized in database.js

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/languages', languagesRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/assigned-plans', assignedPlansRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin_users', adminRoutes);
app.use('/api/admin_roles', adminRolesRoutes);
app.use('/api/client-users', clientUsersRoutes);
app.use('/api/client-roles', clientRolesRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/elevenlabs', elevenLabsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/sales-persons', salesRoutes);
app.use('/api/workspace-secrets', secretsRoutes);
app.use('/api/mcp-servers', mcpRoutes);
app.use('/api/campaigns', campaignsRoutes);

// Fallback direct route for agents under campaigns (ensures availability even if sub-router order changes)
app.get('/api/campaigns/agents', (req, res) => {
  try {
    const clientId = req.query.client_id;
    // Select agent_id (ElevenLabs ID) instead of local id
    const sql = clientId ? 'SELECT agent_id as id, name, client_id FROM agents WHERE client_id = ?' : 'SELECT agent_id as id, name, client_id FROM agents';
    db.query(sql, clientId ? [clientId] : [], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to fetch agents', error: err.message });
      res.json({ success: true, data: rows });
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch agents', error: e.message });
  }
});

// ElevenLabs Voices Proxy Endpoint
app.get('/api/voices', async (req, res) => {
  try {
    console.log('ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY);
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to fetch voices from ElevenLabs', details: errorText });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching voices:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve uploads folder statically
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:3000`);
  console.log(`🔧 Backend: http://localhost:${PORT}`);
});

module.exports = app;


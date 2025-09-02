// backend/routes/debug.js
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const db = require('../config/database');

// GET /api/debug/health - Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/debug/status - Server status information
router.get('/status', authenticateJWT, (req, res) => {
  const status = {
    success: true,
    server: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,
      databaseHost: process.env.DB_HOST || 'localhost',
      databaseName: process.env.DB_NAME || 'ai-caller'
    }
  };

  res.json(status);
});

// GET /api/debug/database - Database connection test
router.get('/database', authenticateJWT, (req, res) => {
  db.query('SELECT 1 as test', (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection failed', 
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      test: results[0]
    });
  });
});

// GET /api/debug/tables - List all database tables
router.get('/tables', authenticateJWT, (req, res) => {
  db.query('SHOW TABLES', (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch tables', 
        error: err.message 
      });
    }
    
    const tables = results.map(row => {
      const key = Object.keys(row)[0];
      return row[key];
    });
    
    res.json({ 
      success: true, 
      data: tables,
      count: tables.length
    });
  });
});

// GET /api/debug/table/:tableName - Get table structure
router.get('/table/:tableName', authenticateJWT, (req, res) => {
  const tableName = req.params.tableName;
  
  db.query('DESCRIBE ??', [tableName], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to describe table ${tableName}`, 
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      tableName,
      structure: results
    });
  });
});

// GET /api/debug/table/:tableName/data - Get sample data from table
router.get('/table/:tableName/data', authenticateJWT, (req, res) => {
  const tableName = req.params.tableName;
  const limit = parseInt(req.query.limit) || 10;
  
  db.query('SELECT * FROM ?? LIMIT ?', [tableName, limit], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to fetch data from table ${tableName}`, 
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      tableName,
      limit,
      count: results.length,
      data: results
    });
  });
});

// GET /api/debug/query - Execute custom SQL query (for debugging only)
router.get('/query', authenticateJWT, (req, res) => {
  const { sql } = req.query;
  
  if (!sql) {
    return res.status(400).json({ 
      success: false, 
      message: 'SQL query parameter is required' 
    });
  }

  // Only allow SELECT queries for security
  if (!sql.trim().toLowerCase().startsWith('select')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Only SELECT queries are allowed for security reasons' 
    });
  }

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Query execution failed', 
        error: err.message,
        sql
      });
    }
    
    res.json({ 
      success: true, 
      sql,
      count: Array.isArray(results) ? results.length : 0,
      results
    });
  });
});

// GET /api/debug/logs - Get recent server logs (if available)
router.get('/logs', authenticateJWT, (req, res) => {
  // This is a placeholder - in a real implementation you might want to
  // read from log files or a logging service
  res.json({ 
    success: true, 
    message: 'Log retrieval not implemented',
    note: 'Consider implementing a proper logging solution like Winston or Bunyan'
  });
});

// GET /api/debug/environment - Get environment variables (filtered)
router.get('/environment', authenticateJWT, (req, res) => {
  const env = {};
  const allowedKeys = [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'JWT_SECRET',
    'ELEVENLABS_API_KEY'
  ];

  allowedKeys.forEach(key => {
    if (process.env[key]) {
      // Mask sensitive values
      if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')) {
        env[key] = '***MASKED***';
      } else {
        env[key] = process.env[key];
      }
    }
  });

  res.json({ 
    success: true, 
    environment: env
  });
});

// POST /api/debug/error - Simulate an error for testing error handling
router.post('/error', authenticateJWT, (req, res) => {
  const { errorType } = req.body;
  
  switch (errorType) {
    case 'database':
      return res.status(500).json({ 
        success: false, 
        message: 'Simulated database error',
        error: 'Connection timeout'
      });
    
    case 'validation':
      return res.status(400).json({ 
        success: false, 
        message: 'Simulated validation error',
        errors: ['Field is required', 'Invalid format']
      });
    
    case 'auth':
      return res.status(401).json({ 
        success: false, 
        message: 'Simulated authentication error',
        error: 'Invalid token'
      });
    
    default:
      return res.status(500).json({ 
        success: false, 
        message: 'Simulated generic error',
        error: 'Something went wrong'
      });
  }
});

module.exports = router;

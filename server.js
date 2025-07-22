//server.js
require('dotenv').config();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require('bcrypt');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const cookieParser = require('cookie-parser');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const axios = require('axios');
const { execFile } = require('child_process');

console.log("🟡 Starting backend server...");

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://2nq68jpg-3000.inc1.devtunnels.ms' // <-- Add your tunnel URL here
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = 'your-very-secret-key'; // Use env variable in production!

// DB config
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "ai-caller",
  multipleStatements: true // Allow multiple statements
});

// Connect to DB
db.connect(err => {
  if (err) {
    console.error("❌ Database connection failed:", err.stack);
    // Try to create database and table if they don't exist
    const tempDb = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: ""
    });

    tempDb.connect(err => {
      if (err) {
        console.error("Failed to create temporary connection:", err);
        return;
      }

      // Create database if it doesn't exist
      tempDb.query("CREATE DATABASE IF NOT EXISTS `ai-caller`", (err) => {
        if (err) {
          console.error("Failed to create database:", err);
          return;
        }

        // Create plans table if it doesn't exist
        const createTable = `
          USE \`ai-caller\`;
          CREATE TABLE IF NOT EXISTS plans (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            priceMonthly DECIMAL(10,2),
            priceAnnual DECIMAL(10,2),
            currency VARCHAR(10) NOT NULL,
            durationDays INT,
            totalCallsAllowedPerMonth VARCHAR(64),
            callDurationPerCallMaxMinutes INT,
            numberOfAgents INT,
            agentsAllowed INT,
            voicebotUsageCap VARCHAR(64),
            apiAccess BOOLEAN,
            customAgents BOOLEAN,
            reportingAnalytics BOOLEAN,
            liveCallMonitor BOOLEAN,
            overagesAllowed BOOLEAN,
            overageChargesPer100Calls DECIMAL(10,2),
            trialEligible BOOLEAN,
            status ENUM('Active','Draft','Archived') NOT NULL
          );
        `;

        tempDb.query(createTable, (err) => {
          if (err) {
            console.error("Failed to create table:", err);
            return;
          }
          console.log("✅ Database and table created successfully");
          tempDb.end();
          
          // Reconnect to the main database
          db.connect(err => {
            if (err) {
              console.error("Still failed to connect to database:", err);
              return;
            }
            console.log("✅ Successfully connected to database");
          });
        });

        // After creating the plans table, add:
        const createClientsTable = `
          CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            companyName VARCHAR(255) NOT NULL,
            companyEmail VARCHAR(255) NOT NULL,
            phoneNumber VARCHAR(32) NOT NULL,
            address TEXT,
            contactPersonName VARCHAR(255) NOT NULL,
            domainSubdomain VARCHAR(255),
            plan_id INT NOT NULL,
            apiAccess BOOLEAN NOT NULL DEFAULT FALSE,
            trialMode BOOLEAN NOT NULL DEFAULT FALSE,
            trialDuration INT,
            trialCallLimit INT,
            adminPassword VARCHAR(255) NOT NULL,
            autoSendLoginEmail BOOLEAN NOT NULL DEFAULT TRUE,
            avatar_url VARCHAR(255) NULL,
            bio TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (plan_id) REFERENCES plans(id)
          );
        `;

        tempDb.query(createClientsTable, (err) => {
          if (err) {
            console.error("Failed to create clients table:", err);
            return;
          }
          console.log("✅ Clients table created successfully");
        });

        // --- LANGUAGES TABLE CREATION ---
        const createLanguagesTable = `
          CREATE TABLE IF NOT EXISTS languages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(20) NOT NULL,
            country_code VARCHAR(5) NOT NULL,
            calling_code VARCHAR(10) NOT NULL,
            enabled BOOLEAN DEFAULT TRUE
          );
        `;
        tempDb.query(createLanguagesTable, (err) => {
          if (err) {
            console.error("Failed to create languages table:", err);
          } else {
            console.log("✅ Languages table ready");
          }
        });

        // --- KNOWLEDGE BASE TABLE CREATION ---
        const createKnowledgeBaseTable = `
          CREATE TABLE IF NOT EXISTS knowledge_base (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_id INT,
            type VARCHAR(32) NOT NULL,
            name VARCHAR(255) NOT NULL,
            url TEXT,
            file_path VARCHAR(255),
            text_content TEXT,
            size VARCHAR(32),
            created_by VARCHAR(255),
            created_at DATETIME,
            updated_at DATETIME
          );
        `;
        tempDb.query(createKnowledgeBaseTable, (err) => {
          if (err) {
            console.error("Failed to create knowledge base table:", err);
          } else {
            console.log("✅ Knowledge base table ready");
          }
        });

        const createCriteriaTable = `
         CREATE TABLE IF NOT EXISTS agent_analysis_criteria (
          id INT AUTO_INCREMENT PRIMARY KEY,
          agent_id VARCHAR(64) NOT NULL,
          name VARCHAR(255) NOT NULL,
          prompt TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      db.query(createCriteriaTable);

      const createDataCollectionTable = `
        CREATE TABLE IF NOT EXISTS agent_analysis_data_collection (
          id INT AUTO_INCREMENT PRIMARY KEY,
          agent_id VARCHAR(64) NOT NULL,
          data_type VARCHAR(32) NOT NULL,
          identifier VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      db.query(createDataCollectionTable);

        // --- AGENTS TABLE MIGRATION: Add language_code and additional_languages columns if not exist ---
        db.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS language_code VARCHAR(20)`, () => {});
        db.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS additional_languages TEXT`, () => {});
        db.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Published' AFTER updated_at`, () => {});
      });
    });
    return;
  }
  console.log("✅ MySQL Connected");
});

// Add error handler for lost connections
db.on('error', function(err) {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Attempting to reconnect to database...');
    db.connect(err => {
      if (err) {
        console.error("Failed to reconnect:", err);
        return;
      }
      console.log("✅ Reconnected to database");
    });
  } else {
    throw err;
  }
});

// Test API route
app.get("/", (req, res) => {
  res.send("🟢 Backend is running!");
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

// POST /api/elevenlabs/create-agent
app.post('/api/elevenlabs/create-agent', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    const payload = req.body;

    // 1. Create agent in ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to create agent', details: data });
    }

    // 2. Fetch full agent details from ElevenLabs
    const agentId = data.agent_id;
    const agentDetailsRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'GET',
      headers,
    });
    const agent = await agentDetailsRes.json();
    if (!agentDetailsRes.ok) {
      return res.status(agentDetailsRes.status).json({ error: 'Failed to fetch agent details', details: agent });
    }

    // Ensure client_id from frontend is set on the agent object for local DB
    agent.client_id = payload.client_id || null;

    // 2.1 Map language code to local language_id
    let languageId = null;
    const languageCode = agent.language || 'en';
    db.query('SELECT id FROM languages WHERE code = ? LIMIT 1', [languageCode], (err, rows) => {
      if (err) {
        console.error('Failed to lookup language_id:', err);
        languageId = null;
      } else if (rows.length > 0) {
        languageId = rows[0].id;
      } else {
        // fallback: use first language in table
        db.query('SELECT id FROM languages LIMIT 1', [], (err2, rows2) => {
          if (err2 || rows2.length === 0) {
            languageId = null;
          } else {
            languageId = rows2[0].id;
          }
          insertAgent(payload.client_id || null);
        });
        return;
      }
      insertAgent(payload.client_id || null);
    });

    function insertAgent(clientId) {
      console.log('Payload received:', payload);
      // Ensure clientId is an integer or null
      let safeClientId = clientId !== undefined && clientId !== null && clientId !== '' ? parseInt(clientId, 10) : null;
      if (isNaN(safeClientId)) safeClientId = null;
      console.log('client_id to insert:', safeClientId, typeof safeClientId);
      const insertValues = [
        agent.agent_id,
        safeClientId,
        agent.name || '',
        agent.description || '',
        agent.first_message || '',
        agent.system_prompt || '',
        languageId,
        agent.voice_id || null,
        agent.model || '',
        JSON.stringify(agent.tags || []),
        JSON.stringify(agent.platform_settings || {}),
        agent.language_code || '',
        JSON.stringify(agent.additional_languages || []),
        agent.custom_llm_url || '',
        agent.custom_llm_model_id || '',
        agent.custom_llm_api_key || '',
        JSON.stringify(agent.custom_llm_headers || []),
        agent.llm || '',
        agent.temperature || null
      ];
      console.log('Insert values:', insertValues);
      const insertSql = `
        INSERT INTO agents (
          agent_id, client_id, name, description, first_message, system_prompt, language_id, voice_id, model, tags, platform_settings, created_at, updated_at, language_code, additional_languages, custom_llm_url, custom_llm_model_id, custom_llm_api_key, custom_llm_headers, llm, temperature
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name=VALUES(name), description=VALUES(description), first_message=VALUES(first_message),
          system_prompt=VALUES(system_prompt), language_id=VALUES(language_id), voice_id=VALUES(voice_id),
          model=VALUES(model), tags=VALUES(tags), platform_settings=VALUES(platform_settings), updated_at=NOW(),
          language_code=VALUES(language_code), additional_languages=VALUES(additional_languages),
          custom_llm_url=VALUES(custom_llm_url), custom_llm_model_id=VALUES(custom_llm_model_id),
          custom_llm_api_key=VALUES(custom_llm_api_key), custom_llm_headers=VALUES(custom_llm_headers),
          llm=VALUES(llm), temperature=VALUES(temperature)
      `;
      db.query(
        insertSql,
        insertValues,
        (err) => {
          if (err) {
            console.error('Failed to insert agent into local DB:', err);
            // Still return success for ElevenLabs, but log error
          }
          res.status(200).json({ agent_id: agentId });
        }
      );
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// GET /api/agents - return all agents from local DB with language name/code
app.get('/api/agents', (req, res) => {
  const sql = `
    SELECT a.*, l.name AS language_name, l.code AS language_code
    FROM agents a
    LEFT JOIN languages l ON a.language_id = l.id
  `;
  console.log('[API] /api/agents SQL:', sql);
  db.query(sql, (err, results) => {
    if (err) {
      console.error('[API] /api/agents ERROR:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch agents', error: err });
    }
    console.log(`[API] /api/agents returned ${results.length} agents`);
    if (results.length > 0) {
      console.log('[API] /api/agents first agent:', results[0]);
    }
    res.json({ success: true, data: results });
  });
});

// GET /api/agents/:id/details - Get agent details from both local DB and ElevenLabs
app.get('/api/agents/:id/details', async (req, res) => {
  const agentId = req.params.id;
  db.query('SELECT * FROM agents WHERE agent_id = ?', [agentId], async (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    const localAgent = results[0] || {};
    // Parse additional_languages if present
    if (localAgent.additional_languages) {
      try {
        localAgent.additional_languages = JSON.parse(localAgent.additional_languages);
      } catch {
        localAgent.additional_languages = [];
      }
    }
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = { 'xi-api-key': apiKey, 'Content-Type': 'application/json' };
    let elevenLabsAgent = {};
    try {
      const elevenLabsRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, { headers });
      elevenLabsAgent = await elevenLabsRes.json();
    } catch (e) {
      elevenLabsAgent = {};
    }
    res.json({ local: localAgent, elevenlabs: elevenLabsAgent });
  });
});

// PATCH /api/agents/:id/details - Update agent details in both local DB and ElevenLabs
app.patch('/api/agents/:id/details', async (req, res) => {
  const agentId = req.params.id;
  const { local, elevenlabs } = req.body;
  console.log('[PATCH /api/agents/:id/details] Incoming payload:', JSON.stringify(req.body, null, 2));
  try {
    // 1. Update local DB
    if (local || (elevenlabs && elevenlabs.conversation_config && elevenlabs.conversation_config.agent)) {
      const updateFields = [];
      const updateValues = [];
      if (local) {
        Object.keys(local).filter(k => k !== 'agent_id').forEach(k => {
          let value = local[k];
          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            value = JSON.stringify(value);
          }
          updateFields.push(`${k} = ?`);
          updateValues.push(value);
        });
      }
      // Persist language_code and additional_languages from ElevenLabs agent config if present
      if (elevenlabs && elevenlabs.conversation_config && elevenlabs.conversation_config.agent) {
        const agent = elevenlabs.conversation_config.agent;
        if (agent.language) {
          updateFields.push(`language_code = ?`);
          updateValues.push(agent.language);
        }
        if (agent.additional_languages) {
          updateFields.push(`additional_languages = ?`);
          updateValues.push(JSON.stringify(agent.additional_languages));
        }
      }
      if (updateFields.length > 0) {
        const sql = `UPDATE agents SET ${updateFields.join(', ')} WHERE agent_id = ?`;
        console.log('[PATCH /api/agents/:id/details] SQL:', sql);
        console.log('[PATCH /api/agents/:id/details] SQL values:', [...updateValues, agentId]);
        await new Promise((resolve, reject) => {
          db.query(sql, [...updateValues, agentId], (err, result) => {
            if (err) {
              console.error('[PATCH /api/agents/:id/details] DB error:', err);
              return reject(err);
            }
            resolve(result);
          });
        });
      }
    }
    // 2. Update ElevenLabs
    if (elevenlabs) {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      const headers = { 'xi-api-key': apiKey, 'Content-Type': 'application/json' };
      const url = `https://api.elevenlabs.io/v1/convai/agents/${agentId}`;
      console.log('[PATCH /api/agents/:id/details] PATCH to ElevenLabs:', url);
      const resp = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(elevenlabs),
      });
      const respData = await resp.json();
      console.log('[PATCH /api/agents/:id/details] ElevenLabs response:', resp.status, respData);
      if (!resp.ok) {
        throw new Error(`Failed to update ElevenLabs: ${JSON.stringify(respData)}`);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/agents/:id/details] ERROR:', err);
    res.status(500).json({ error: err.message || 'Failed to update agent details.' });
  }
});

// PATCH /api/agents/:id/status - Update agent status
app.patch('/api/agents/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.query('UPDATE agents SET status = ? WHERE agent_id = ?', [status, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true });
  });
});

// ElevenLabs Get Agent Details Endpoint
app.get('/api/elevenlabs/agent/:id', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${req.params.id}`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch agent', details: data });
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ElevenLabs Update Agent Details Endpoint
app.patch('/api/elevenlabs/agent/:id', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${req.params.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to update agent', details: data });
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- ElevenLabs Agent Tab Endpoints ---

// Settings (Agent tab)
app.get('/api/elevenlabs/agent/:id/settings', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    const response = await fetch(`https://api.elevenlabs.io/v1/agents/${req.params.id}/settings`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch agent settings', details: data });
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.patch('/api/elevenlabs/agent/:id/settings', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    const response = await fetch(`https://api.elevenlabs.io/v1/agents/${req.params.id}/widget-config`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to update widget config', details: data });
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Widget Config
app.get('/api/elevenlabs/agent/:id/widget-config', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    const response = await fetch(`https://api.elevenlabs.io/v1/agents/${req.params.id}/widget-config`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch widget config', details: data });
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.patch('/api/elevenlabs/agent/:id/widget-config', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    const response = await fetch(`https://api.elevenlabs.io/v1/agents/${req.params.id}/widget-config`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to update widget config', details: data });
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Voice Config (stub, as ElevenLabs may not support this directly)
app.get('/api/elevenlabs/agent/:id/voice', (req, res) => {
  res.status(200).json({ stub: true, message: 'Voice config endpoint not implemented in ElevenLabs API yet.' });
});
app.patch('/api/elevenlabs/agent/:id/voice', (req, res) => {
  res.status(501).json({ error: 'Voice config update not implemented in ElevenLabs API yet.' });
});

// Security Config (stub)
app.get('/api/elevenlabs/agent/:id/security', (req, res) => {
  res.status(200).json({ stub: true, message: 'Security config endpoint not implemented in ElevenLabs API yet.' });
});
app.patch('/api/elevenlabs/agent/:id/security', (req, res) => {
  res.status(501).json({ error: 'Security config update not implemented in ElevenLabs API yet.' });
});

// Advanced Config (stub)
app.get('/api/elevenlabs/agent/:id/advanced', (req, res) => {
  res.status(200).json({ stub: true, message: 'Advanced config endpoint not implemented in ElevenLabs API yet.' });
});
app.patch('/api/elevenlabs/agent/:id/advanced', (req, res) => {
  res.status(501).json({ error: 'Advanced config update not implemented in ElevenLabs API yet.' });
});

// Analysis Config (stub)
app.get('/api/elevenlabs/agent/:id/analysis', (req, res) => {
  res.status(200).json({ stub: true, message: 'Analysis config endpoint not implemented in ElevenLabs API yet.' });
});
app.patch('/api/elevenlabs/agent/:id/analysis', (req, res) => {
  res.status(501).json({ error: 'Analysis config update not implemented in ElevenLabs API yet.' });
});

// ElevenLabs Get All Agents Endpoint
app.get('/api/elevenlabs/agents', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    // You can pass query params for pagination/filtering if needed
    const query = req.query ? '?' + new URLSearchParams(req.query).toString() : '';
    const response = await fetch(`https://api.elevenlabs.io/v1/agents${query}`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch agents', details: data });
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//GET /api/agents/:id/analysis - Get analysis criteria and data collection for an agent
app.get('/api/agents/:id/analysis', (req, res) => {
  const agentId = req.params.id;
  db.query('SELECT * FROM agent_analysis_criteria WHERE agent_id = ?', [agentId], (err, criteria) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query('SELECT * FROM agent_analysis_data_collection WHERE agent_id = ?', [agentId], (err2, dataCollection) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ criteria, data_collection: dataCollection });
    });
  });
});

//POST /api/agents/:id/analysis - Save analysis criteria and data collection for an agent
app.post('/api/agents/:id/analysis', async (req, res) => {
  const agentId = req.params.id;
  const { criteria, data_collection, elevenlabs } = req.body;

  // Save criteria
  if (Array.isArray(criteria)) {
    for (const c of criteria) {
      db.query(
        `INSERT INTO agent_analysis_criteria (agent_id, name, prompt) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE prompt = VALUES(prompt)`,
        [agentId, c.name, c.prompt]
      );
    }
  }
  // Save data_collection
  if (Array.isArray(data_collection)) {
    for (const d of data_collection) {
      db.query(
        `INSERT INTO agent_analysis_data_collection (agent_id, data_type, identifier, description) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE data_type = VALUES(data_type), description = VALUES(description)`,
        [agentId, d.data_type, d.identifier, d.description]
      );
    }
  }
  // Patch ElevenLabs
  if (elevenlabs) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = { 'xi-api-key': apiKey, 'Content-Type': 'application/json' };
    await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(elevenlabs),
    });
  }
  res.json({ success: true });
});

// CRUD API for Plans

// Get all plans
app.get("/api/plans", (req, res) => {
  db.query("SELECT * FROM plans", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch plans", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get a single plan by id
app.get("/api/plans/:id", (req, res) => {
  db.query("SELECT * FROM plans WHERE id = ?", [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch plan", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    res.json({ success: true, data: results[0] });
  });
});

// Create a new plan
app.post("/api/plans", (req, res) => {
  const plan = req.body;
  // Remove id if present
  delete plan.id;
  db.query("INSERT INTO plans SET ?", plan, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to create plan", error: err });
    }
    // Fetch and return the created plan
    db.query("SELECT * FROM plans WHERE id = ?", [result.insertId], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Plan created but failed to fetch", error: err });
      }
      res.status(201).json({ success: true, message: "Plan created", data: results[0] });
    });
  });
});

// Update a plan
// Update a plan by fetching current data and updating in the plans table
app.put("/api/plans/:id", (req, res) => {
  const planId = Number(req.params.id);
  const updatedPlan = req.body;

  // First, fetch the current plan data
  db.query("SELECT * FROM plans WHERE id = ?", [planId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch current plan data", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    // Merge current data with updated fields
    const currentPlan = results[0];
    const updateFields = {
      name: updatedPlan.name !== undefined ? updatedPlan.name : currentPlan.name,
      description: updatedPlan.description !== undefined ? updatedPlan.description : currentPlan.description,
      priceMonthly: updatedPlan.priceMonthly !== undefined ? updatedPlan.priceMonthly : currentPlan.priceMonthly,
      priceAnnual: updatedPlan.priceAnnual !== undefined ? updatedPlan.priceAnnual : currentPlan.priceAnnual,
      currency: updatedPlan.currency !== undefined ? updatedPlan.currency : currentPlan.currency,
      durationDays: updatedPlan.durationDays !== undefined ? updatedPlan.durationDays : currentPlan.durationDays,
      totalCallsAllowedPerMonth: updatedPlan.totalCallsAllowedPerMonth !== undefined ? updatedPlan.totalCallsAllowedPerMonth : currentPlan.totalCallsAllowedPerMonth,
      callDurationPerCallMaxMinutes: updatedPlan.callDurationPerCallMaxMinutes !== undefined ? updatedPlan.callDurationPerCallMaxMinutes : currentPlan.callDurationPerCallMaxMinutes,
      numberOfAgents: updatedPlan.numberOfAgents !== undefined ? updatedPlan.numberOfAgents : currentPlan.numberOfAgents,
      agentsAllowed: updatedPlan.agentsAllowed !== undefined ? updatedPlan.agentsAllowed : currentPlan.agentsAllowed,
      voicebotUsageCap: updatedPlan.voicebotUsageCap !== undefined ? updatedPlan.voicebotUsageCap : currentPlan.voicebotUsageCap,
      apiAccess: updatedPlan.apiAccess !== undefined ? updatedPlan.apiAccess : currentPlan.apiAccess,
      customAgents: updatedPlan.customAgents !== undefined ? updatedPlan.customAgents : currentPlan.customAgents,
      reportingAnalytics: updatedPlan.reportingAnalytics !== undefined ? updatedPlan.reportingAnalytics : currentPlan.reportingAnalytics,
      liveCallMonitor: updatedPlan.liveCallMonitor !== undefined ? updatedPlan.liveCallMonitor : currentPlan.liveCallMonitor,
      overagesAllowed: updatedPlan.overagesAllowed !== undefined ? updatedPlan.overagesAllowed : currentPlan.overagesAllowed,
      overageChargesPer100Calls: updatedPlan.overageChargesPer100Calls !== undefined ? updatedPlan.overageChargesPer100Calls : currentPlan.overageChargesPer100Calls,
      trialEligible: updatedPlan.trialEligible !== undefined ? updatedPlan.trialEligible : currentPlan.trialEligible,
      status: updatedPlan.status !== undefined ? updatedPlan.status : currentPlan.status,
    };

    // Update the plan in the database
    db.query(
      "UPDATE plans SET ? WHERE id = ?",
      [updateFields, planId],
      (err, result) => {
        if (err) {
          console.error("Database error updating plan:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to update plan",
            error: err.message,
          });
        }
        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Plan not found" });
        }
        // Fetch and return the updated plan
        db.query(
          "SELECT * FROM plans WHERE id = ?",
          [planId],
          (err, results) => {
            if (err) {
              console.error("Error fetching updated plan:", err);
              return res.status(500).json({
                success: false,
                message: "Plan updated but failed to fetch updated data",
                error: err.message,
              });
            }
            res.json({
              success: true,
              message: "Plan updated successfully",
              data: results[0],
            });
          }
        );
      }
    );
  });
});

// Delete a plan
app.delete("/api/plans/:id", (req, res) => {
  db.query("DELETE FROM plans WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete plan", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    res.json({ success: true, message: "Plan deleted" });
  });
});

// Get all clients (show latest assigned plan)
app.get("/api/clients", (req, res) => {
  // Join with assigned_plans to get the most recent plan assignment for each client
  const sql = `
    SELECT c.*, p.name AS planName
    FROM clients c
    LEFT JOIN (
      SELECT ap1.* FROM assigned_plans ap1
      INNER JOIN (
        SELECT client_id, MAX(start_date) AS max_start_date
        FROM assigned_plans
        GROUP BY client_id
      ) ap2 ON ap1.client_id = ap2.client_id AND ap1.start_date = ap2.max_start_date
    ) ap ON c.id = ap.client_id
    LEFT JOIN plans p ON ap.plan_id = p.id
  `;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch clients", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get a single client by id
app.get("/api/clients/:id", (req, res) => {
  db.query(
    `SELECT clients.*, plans.name AS planName FROM clients LEFT JOIN plans ON clients.plan_id = plans.id WHERE clients.id = ?`,
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch client", error: err });
      }
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
      res.json({ success: true, data: results[0] });
    }
  );
});

// Create a new client
app.post("/api/clients", async (req, res) => {
  try {
    const client = req.body;
    delete client.id;
    delete client.confirmAdminPassword;

    // Hash the adminPassword before saving
    if (client.adminPassword) {
      client.adminPassword = await bcrypt.hash(client.adminPassword, 10);
    }

    db.query("INSERT INTO clients SET ?", client, (err, result) => {
      if (err) {
        console.error("Failed to create client:", err);
        return res.status(500).json({ success: false, message: "Failed to create client", error: err });
      }
      db.query("SELECT * FROM clients WHERE id = ?", [result.insertId], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Client created but failed to fetch", error: err });
        }
        res.status(201).json({ success: true, message: "Client created", data: results[0] });
      });
    });
  } catch (err) {
    console.error("Error hashing password or creating client:", err);
    res.status(500).json({ success: false, message: "Failed to create client", error: err.message });
  }
});

// Update a client
app.put("/api/clients/:id", (req, res) => {
  const client = req.body;
  const clientId = Number(req.params.id);

  // Log the incoming request body for debugging
  console.log("[PUT /api/clients/:id] Incoming body:", client);

  // Remove undefined fields
  Object.keys(client).forEach((key) => {
    if (client[key] === undefined) {
      delete client[key];
    }
  });

  db.query(
    "UPDATE clients SET ? WHERE id = ?",
    [client, clientId],
    (err, result) => {
      if (err) {
        // Log the MySQL error for debugging
        console.error("[PUT /api/clients/:id] MySQL error:", err);
        return res.status(500).json({ success: false, message: "Failed to update client", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
      db.query("SELECT * FROM clients WHERE id = ?", [clientId], (err, results) => {
        if (err) {
          // Log the MySQL error for debugging
          console.error("[PUT /api/clients/:id] MySQL error (fetch after update):", err);
          return res.status(500).json({ success: false, message: "Client updated but failed to fetch", error: err });
        }
        res.json({ success: true, message: "Client updated successfully", data: results[0] });
      });
    }
  );
});

// Delete a client
app.delete("/api/clients/:id", (req, res) => {
  db.query("DELETE FROM clients WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete client", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    res.json({ success: true, message: "Client deleted" });
  });
});

// User Roles API
// Get all user roles
app.get("/api/user-roles", (req, res) => {
  db.query("SELECT * FROM user_roles", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch user roles", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Create a new user role
app.post("/api/user-roles", (req, res) => {
  const { role_name, description, permissions_summary, status } = req.body;
  if (!role_name || !description || !permissions_summary || !status) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  db.query(
    "INSERT INTO user_roles (role_name, description, permissions_summary, status) VALUES (?, ?, ?, ?)",
    [role_name, description, permissions_summary, status],
    (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to create user role", error: err });
      }
      db.query("SELECT * FROM user_roles WHERE id = ?", [result.insertId], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "User role created but failed to fetch", error: err });
        }
        res.status(201).json({ success: true, message: "User role created", data: results[0] });
      });
    }
  );
});

// Get a single user role by id
app.get("/api/user-roles/:id", (req, res) => {
  db.query("SELECT * FROM user_roles WHERE id = ?", [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch user role", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User role not found" });
    }
    res.json({ success: true, data: results[0] });
  });
});

// Update a user role by id
app.put("/api/user-roles/:id", (req, res) => {
  const { role_name, description, permissions_summary, status } = req.body;
  db.query(
    "UPDATE user_roles SET role_name = ?, description = ?, permissions_summary = ?, status = ? WHERE id = ?",
    [role_name, description, permissions_summary, status, req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to update user role", error: err });
      }
      db.query("SELECT * FROM user_roles WHERE id = ?", [req.params.id], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "User role updated but failed to fetch", error: err });
        }
        res.json({ success: true, message: "User role updated", data: results[0] });
      });
    }
  );
});

// CRUD for client_users
// Get all client users with role name
app.get("/api/client-users", authenticateJWT, (req, res) => {
  if (req.user.type === 'client') {
    db.query(
      `SELECT cu.*, ur.role_name 
       FROM client_users cu 
       LEFT JOIN user_roles ur ON cu.role_id = ur.id
       WHERE cu.client_id = ?`,
      [req.user.id],
      (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, data: results });
      }
    );
  } else {
    db.query(
      `SELECT cu.*, ur.role_name 
       FROM client_users cu 
       LEFT JOIN user_roles ur ON cu.role_id = ur.id`,
      (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, data: results });
      }
    );
  }
});

// Get a single client user
app.get("/api/client-users/:id", (req, res) => {
  db.query(
    `SELECT cu.*, ur.role_name 
     FROM client_users cu 
     LEFT JOIN user_roles ur ON cu.role_id = ur.id
     WHERE cu.id = ?`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err });
      if (results.length === 0) return res.status(404).json({ success: false, message: "User not found" });
      res.json({ success: true, data: results[0] });
    }
  );
});

// Create a new client user
app.post("/api/client-users", (req, res) => {
  const { full_name, email, phone, role_id, status, last_login, client_id } = req.body;
  const payload = { ...req.body, client_id: Number(client_id) };
  db.query(
    "INSERT INTO client_users (full_name, email, phone, role_id, status, last_login, client_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [full_name, email, phone, role_id, status, last_login, client_id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      db.query(
        `SELECT cu.*, ur.role_name 
         FROM client_users cu 
         LEFT JOIN user_roles ur ON cu.role_id = ur.id
         WHERE cu.id = ?`,
        [result.insertId],
        (err, results) => {
          if (err) return res.status(500).json({ success: false, error: err });
          res.status(201).json({ success: true, data: results[0] });
        }
      );
    }
  );
});

// Update a client user
app.put("/api/client-users/:id", (req, res) => {
  const { full_name, email, phone, role_id, status, last_login, client_id } = req.body;
  db.query(
    "UPDATE client_users SET full_name=?, email=?, phone=?, role_id=?, status=?, last_login=?, client_id=? WHERE id=?",
    [full_name, email, phone, role_id, status, last_login, client_id, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err });
      db.query(
        `SELECT cu.*, ur.role_name 
         FROM client_users cu 
         LEFT JOIN user_roles ur ON cu.role_id = ur.id
         WHERE cu.id = ?`,
        [req.params.id],
        (err, results) => {
          if (err) return res.status(500).json({ success: false, error: err });
          res.json({ success: true, data: results[0] });
        }
      );
    }
  );
});

// Delete a client user
app.delete("/api/client-users/:id", (req, res) => {
  db.query("DELETE FROM client_users WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  });
});

// Reset a client user's password
app.post("/api/client-users/:id/reset-password", (req, res) => {
  const userId = req.params.id;
  const { oldPassword, password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'New password is required' });
  }

  db.query('SELECT password FROM client_users WHERE id = ?', [userId], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const hashedPassword = results[0].password;

    // Only check oldPassword if both oldPassword and hashedPassword are present and non-empty
    if (oldPassword && hashedPassword) {
      const match = await bcrypt.compare(oldPassword, hashedPassword);
      if (!match) {
        return res.status(400).json({ success: false, message: 'Old password is incorrect' });
      }
    } else if (oldPassword && !hashedPassword) {
      return res.status(400).json({ success: false, message: 'No password set for user' });
    }

    const newHashedPassword = await bcrypt.hash(password, 10);
    db.query('UPDATE client_users SET password = ? WHERE id = ?', [newHashedPassword, userId], (err2) => {
      if (err2) {
        return res.status(500).json({ success: false, message: 'Failed to update password' });
      }
      res.json({ success: true, message: 'Password updated successfully' });
    });
  });
});

// Activate or deactivate a client user (only updates status)
app.put("/api/client-users/:id/status", (req, res) => {
  const { status } = req.body;
  if (!status || !["Active", "Suspended", "Pending"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid or missing status" });
  }
  db.query(
    "UPDATE client_users SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "User not found" });
      res.json({ success: true, message: `User status updated to ${status}` });
    }
  );
});

// --- Admin Roles API ---
// GET all admin roles
app.get('/api/admin_roles', (req, res) => {
  db.query('SELECT * FROM admin_roles ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results });
  });
});

// POST new admin role
app.post('/api/admin_roles', (req, res) => {
  const { name, description, permission_summary, status } = req.body;
  db.query(
    'INSERT INTO admin_roles (name, description, permission_summary, status) VALUES (?, ?, ?, ?)',
    [name, description, permission_summary, status],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      db.query('SELECT * FROM admin_roles WHERE id = ?', [result.insertId], (err2, rows) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message });
        res.json({ success: true, data: rows[0] });
      });
    }
  );
});

// PUT update an admin role
app.put('/api/admin_roles/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, permission_summary, status } = req.body;
  console.log('[PUT /api/admin_roles/:id] Incoming body:', req.body);
  db.query(
    'UPDATE admin_roles SET name = ?, description = ?, permission_summary = ?, status = ? WHERE id = ?',
    [name, description, permission_summary, status, id],
    (err, result) => {
      if (err) {
        console.error('[PUT /api/admin_roles/:id] MySQL error:', err);
        return res.status(500).json({ success: false, message: err.message });
      }
      db.query('SELECT * FROM admin_roles WHERE id = ?', [id], (err2, rows) => {
        if (err2) {
          console.error('[PUT /api/admin_roles/:id] MySQL error (fetch after update):', err2);
          return res.status(500).json({ success: false, message: err2.message });
        }
        console.log('[PUT /api/admin_roles/:id] Updated role:', rows[0]);
        res.json({ success: true, data: rows[0] });
      });
    }
  );
});

// DELETE an admin role
app.delete('/api/admin_roles/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM admin_roles WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Role deleted successfully' });
  });
});

// GET a single admin role by id
app.get('/api/admin_roles/:id', (req, res) => {
  db.query('SELECT * FROM admin_roles WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0) return res.status(404).json({ success: false, message: "Role not found" });
    res.json({ success: true, data: results[0] });
  });
});

// Assign a plan to a client (insert into assigned_plans and update clients.plan_id)
app.post("/api/assigned-plans", (req, res) => {
  console.log("Assign Plan Request Body:", req.body);
  const {
    client_id,
    plan_id,
    start_date,
    duration_override_days,
    is_trial,
    discount_type,
    discount_value,
    notes,
    auto_send_notifications
  } = req.body;

  const sql = `
    INSERT INTO assigned_plans
    (client_id, plan_id, start_date, duration_override_days, is_trial, discount_type, discount_value, notes, auto_send_notifications)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      client_id,
      plan_id,
      start_date ? new Date(start_date) : null,
      duration_override_days || null,
      is_trial || false,
      discount_type || null,
      discount_value || null,
      notes || null,
      auto_send_notifications || false
    ],
    (err, result) => {
      if (err) {
        console.error("Failed to assign plan:", err);
        return res.status(500).json({ success: false, message: "Failed to assign plan", error: err });
      }
      // Also update the client's plan_id
      db.query(
        "UPDATE clients SET plan_id = ? WHERE id = ?",
        [plan_id, client_id],
        (err2) => {
          if (err2) {
            console.error("Failed to update client's plan_id:", err2);
            return res.status(500).json({ success: false, message: "Plan assigned but failed to update client", error: err2 });
          }
          res.status(201).json({ success: true, message: "Plan assigned successfully" });
        }
      );
    }
  );
});

// --- Admin Users API ---
// Get all admin users
app.get('/api/admin_users', (req, res) => {
  db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results });
  });
});

// Get current admin user's profile
app.get('/api/admin_users/me', authenticateJWT, async (req, res) => {
  console.log('Getting current user profile for:', req.user);

  // If user is a client admin
  if (req.user.type === 'client') {
    db.query('SELECT * FROM clients WHERE id = ?', [req.user.id], (err, results) => {
      if (err) {
        console.error('Error fetching client profile:', err);
        return res.status(500).json({ success: false, message: 'DB error', error: err });
      }
      if (!results.length) {
        console.error('Client not found:', req.user.id);
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      const client = results[0];
      return res.json({ 
        success: true, 
        data: {
          id: client.id,
          email: client.companyEmail,
          name: client.companyName,
          role: 'client_admin',
          type: 'client',
          companyName: client.companyName,
          avatar_url: client.avatar_url || '',
          bio: client.bio || ''
        }
      });
    });
    return;
  }

  // If user is an admin
  db.query('SELECT * FROM admin_users WHERE id = ?', [req.user.id], (err, results) => {
    if (err) {
      console.error('Error fetching admin profile:', err);
      return res.status(500).json({ success: false, message: 'DB error', error: err });
    }
    if (!results.length) {
      console.error('Admin not found:', req.user.id);
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }
    res.json({ success: true, data: results[0] });
  });
});

// Get a single admin user by id
app.get('/api/admin_users/:id', (req, res) => {
  db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Admin user not found' });
    res.json({ success: true, data: results[0] });
  });
});

// Create a new admin user
app.post('/api/admin_users', async (req, res) => {
  try {
    const { name, email, roleName, password, lastLogin, status } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO admin_users (name, email, roleName, password, lastLogin, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, roleName, hashedPassword, lastLogin, status],
      (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [result.insertId], (err2, rows) => {
          if (err2) return res.status(500).json({ success: false, message: err2.message });
          res.status(201).json({ success: true, data: rows[0] });
        });
      }
    );
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update an admin user
app.put('/api/admin_users/:id', async (req, res) => {
  try {
    const { name, email, roleName, password, lastLogin, status } = req.body;
    console.log('[PUT /api/admin_users/:id] Incoming body:', req.body);
    let updateFields = [name, email, roleName, lastLogin, status, req.params.id];
    let query = 'UPDATE admin_users SET name = ?, email = ?, roleName = ?, lastLogin = ?, status = ? WHERE id = ?';
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE admin_users SET name = ?, email = ?, roleName = ?, password = ?, lastLogin = ?, status = ? WHERE id = ?';
      updateFields = [name, email, roleName, hashedPassword, lastLogin, status, req.params.id];
    }
    db.query(query, updateFields, (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [req.params.id], (err2, rows) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message });
        console.log('[PUT /api/admin_users/:id] Updated user:', rows[0]);
        res.json({ success: true, data: rows[0] });
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete an admin user
app.delete('/api/admin_users/:id', (req, res) => {
  db.query('DELETE FROM admin_users WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Admin user not found' });
    res.json({ success: true, message: 'Admin user deleted successfully' });
  });
});

// Force logout an admin user
app.post('/api/admin_users/:id/force-logout', (req, res) => {
  // Implement session/token invalidation here if needed
  res.json({ success: true, message: 'User has been forced to log out.' });
});

// Reset an admin user's password
app.post('/api/admin_users/:id/reset-password', (req, res) => {
  const userId = req.params.id;
  const { oldPassword, password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'New password is required' });
  }

  db.query('SELECT password FROM admin_users WHERE id = ?', [userId], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const hashedPassword = results[0].password;

    // Only check oldPassword if provided
    if (oldPassword) {
      if (!hashedPassword) {
        return res.status(400).json({ success: false, message: 'No password set for user' });
      }
      const match = await bcrypt.compare(oldPassword, hashedPassword);
      if (!match) {
        return res.status(400).json({ success: false, message: 'Old password is incorrect' });
      }
    }

    const newHashedPassword = await bcrypt.hash(password, 10);
    db.query('UPDATE admin_users SET password = ? WHERE id = ?', [newHashedPassword, userId], (err2) => {
      if (err2) {
        return res.status(500).json({ success: false, message: 'Failed to update password' });
      }
      res.json({ success: true, message: 'Password updated successfully' });
    });
  });
});

// Update current admin user's profile
app.patch('/api/admin_users/me', authenticateJWT, (req, res) => {
  const { name, avatar_url, bio } = req.body;
  db.query('UPDATE admin_users SET name = ?, avatar_url = ?, bio = ? WHERE id = ?', [name, avatar_url, bio, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error', error: err });
    res.json({ success: true });
  });
});

// Upload profile picture
app.post('/api/admin_users/me/avatar_url', authenticateJWT, upload.single('profile_picture'), (req, res) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Missing user ID' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const filePath = `/uploads/${req.file.filename}`;
  db.query('UPDATE admin_users SET avatar_url = ? WHERE id = ?', [filePath, userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, avatar_url: filePath });
  });
});

// Delete profile picture
app.delete('/api/admin_users/me/avatar_url', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Missing user ID' });
  db.query('UPDATE admin_users SET avatar_url = NULL WHERE id = ?', [userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true });
  });
});

// Combined Login endpoint for both admins and clients
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);

  // First try admin login
  db.query('SELECT * FROM admin_users WHERE email = ?', [email], async (err, adminResults) => {
    if (err) {
      console.error('Admin lookup error:', err);
      return res.status(500).json({ success: false, message: 'DB error', error: err });
    }

    // If found in admin_users table
    if (adminResults.length > 0) {
      console.log('Found user in admin_users');
      const user = adminResults[0];
      try {
        const valid = await bcryptjs.compare(password, user.password);
        if (!valid) {
          console.log('Admin password invalid');
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Update lastLogin to now
        db.query('UPDATE admin_users SET lastLogin = NOW() WHERE id = ?', [user.id]);

        const token = jwt.sign(
          { id: user.id, name: user.name, email: user.email, role: user.roleName, type: 'admin' },
          JWT_SECRET,
          { expiresIn: '1d' }
        );

        res.cookie('token', token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 24*60*60*1000
        });

        return res.json({ 
          success: true, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.roleName,
            type: 'admin'
          } 
        });
      } catch (err) {
        console.error('Error in admin authentication:', err);
        return res.status(500).json({ success: false, message: 'Authentication error' });
      }
    }

    // If not found in admin_users, try client login
    console.log('Not found in admin_users, trying clients table');
    db.query('SELECT * FROM clients WHERE companyEmail = ?', [email], async (err, clientResults) => {
      if (err) {
        console.error('Client lookup error:', err);
        return res.status(500).json({ success: false, message: 'DB error', error: err });
      }
      if (!clientResults.length) {
        console.log('Email not found in clients table');
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const client = clientResults[0];
      console.log('Found client:', { id: client.id, email: client.companyEmail });
      
      try {
        let isValidPassword = false;

        // First try bcrypt comparison (for hashed passwords)
        try {
          console.log('Trying bcrypt comparison');
          // Check if the stored password looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
          if (client.adminPassword && client.adminPassword.startsWith('$2')) {
            isValidPassword = await bcryptjs.compare(password, client.adminPassword);
            console.log('Bcrypt comparison result:', isValidPassword);
          } else {
            // If not a bcrypt hash, do plain text comparison
            console.log('Stored password is not a bcrypt hash, trying plain-text comparison');
            isValidPassword = (password === client.adminPassword);
            console.log('Plain-text comparison result:', isValidPassword);

            // If plain-text password is correct, upgrade it to hashed
            if (isValidPassword) {
              console.log('Plain-text password matched. Upgrading to hashed password...');
              const hashedPassword = await bcryptjs.hash(password, 10);
              db.query(
                'UPDATE clients SET adminPassword = ? WHERE id = ?',
                [hashedPassword, client.id],
                (updateErr) => {
                  if (updateErr) {
                    console.error('Failed to upgrade password to hash:', updateErr);
                  } else {
                    console.log('Successfully upgraded password to hash');
                  }
                }
              );
            }
          }
        } catch (hashError) {
          console.error('Error during password comparison:', hashError);
          // If any error occurs during bcrypt comparison, try plain text
          console.log('Error in password comparison, falling back to plain-text');
          isValidPassword = (password === client.adminPassword);
          console.log('Plain-text comparison result:', isValidPassword);

          // If plain-text password is correct, upgrade it to hashed
          if (isValidPassword) {
            console.log('Plain-text password matched. Upgrading to hashed password...');
            const hashedPassword = await bcryptjs.hash(password, 10);
            db.query(
              'UPDATE clients SET adminPassword = ? WHERE id = ?',
              [hashedPassword, client.id],
              (updateErr) => {
                if (updateErr) {
                  console.error('Failed to upgrade password to hash:', updateErr);
                } else {
                  console.log('Successfully upgraded password to hash');
                }
              }
            );
          }
        }

        if (!isValidPassword) {
          console.log('Client password invalid');
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('Client password valid, creating token');
        const token = jwt.sign(
          { 
            id: client.id, 
            email: client.companyEmail, 
            role: 'client_admin',
            type: 'client',
            companyName: client.companyName 
          },
          JWT_SECRET,
          { expiresIn: '1d' }
        );

        res.cookie('token', token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 24*60*60*1000
        });

        return res.json({ 
          success: true, 
          user: { 
            id: client.id, 
            email: client.companyEmail, 
            role: 'client_admin',
            type: 'client',
            companyName: client.companyName 
          } 
        });
      } catch (err) {
        console.error('Error in client authentication:', err);
        return res.status(500).json({ success: false, message: 'Authentication error' });
      }
    });
  });
});

// JWT middleware
function authenticateJWT(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Serve uploads folder statically
app.use('/uploads', express.static('uploads'));

// --- LANGUAGES API ---
// Get all languages
app.get("/api/languages", (req, res) => {
  db.query("SELECT * FROM languages ORDER BY name ASC", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch languages", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Add a new language
app.post("/api/languages", (req, res) => {
  const { name, code, country_code, calling_code, enabled } = req.body;
  db.query(
    "INSERT INTO languages (name, code, country_code, calling_code, enabled) VALUES (?, ?, ?, ?, ?)",
    [name, code, country_code, calling_code, enabled],
    (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to add language", error: err });
      }
      db.query("SELECT * FROM languages WHERE id = ?", [result.insertId], (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).json({ success: false, message: "Language added but failed to fetch", error: err });
        }
        res.status(201).json({ success: true, data: results[0] });
      });
    }
  );
});

// Update (enable/disable) a language
app.patch("/api/languages/:id", (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  db.query(
    "UPDATE languages SET enabled = ? WHERE id = ?",
    [enabled, id],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to update language", error: err });
      }
      db.query("SELECT * FROM languages WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).json({ success: false, message: "Language updated but failed to fetch", error: err });
        }
        res.json({ success: true, data: results[0] });
      });
    }
  );
});

// Delete a language
app.delete("/api/languages/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM languages WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete language", error: err });
    }
    res.json({ success: true });
  });
});

// POST /api/knowledge-base
app.post('/api/knowledge-base', authenticateJWT, async (req, res) => {
  const { client_id, type, name, url, file_path, text_content, size } = req.body;
  let extractedText = text_content;

  if (type === 'url' && url) {
    try {
      const { extract } = await import('@extractus/article-extractor');
      const article = await extract(url, {
        fetch: (input, init) => fetch(input, {
          ...init,
          headers: {
            ...(init?.headers || {}),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        })
      });
      extractedText = article?.content?.replace(/<[^>]+>/g, '') || '';
      // Fallback: if still empty, try cheerio to get visible text from <body>
      if (!extractedText) {
        const cheerio = (await import('cheerio')).default;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        extractedText = $('body').text().replace(/\s+/g, ' ').trim();
      }
      // Final fallback: Puppeteer for JS-rendered sites
      if (!extractedText) {
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        extractedText = await page.evaluate(() => document.body.innerText.trim());
        await browser.close();
      }
      // Remove extra spacing between paragraphs (replace multiple newlines or blank lines with a single space)
      if (extractedText) {
        extractedText = extractedText.replace(/\n{2,}/g, ' ').replace(/\s{2,}/g, ' ').trim();
      }
    } catch (e) {
      // Fallback: try cheerio if article-extractor fails
      try {
        const cheerio = (await import('cheerio')).default;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        extractedText = $('body').text().replace(/\s+/g, ' ').trim();
        // Final fallback: Puppeteer for JS-rendered sites
        if (!extractedText) {
          const puppeteer = await import('puppeteer');
          const browser = await puppeteer.launch({ headless: 'new' });
          const page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
          extractedText = await page.evaluate(() => document.body.innerText.trim());
          await browser.close();
        }
        // Remove extra spacing between paragraphs (replace multiple newlines or blank lines with a single space)
        if (extractedText) {
          extractedText = extractedText.replace(/\n{2,}/g, ' ').replace(/\s{2,}/g, ' ').trim();
        }
      } catch (err) {
        extractedText = '';
      }
    }
  }

  const created_by = req.user.name || req.user.email || 'Unknown';
  const created_at = new Date();
  const updated_at = new Date();
  const query = `INSERT INTO knowledge_base (client_id, type, name, url, file_path, text_content, size, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(query, [client_id, type, name, url, file_path, extractedText, size, created_by, created_at, updated_at], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    db.query('SELECT * FROM knowledge_base WHERE id = ?', [result.insertId], (err2, rows) => {
      if (err2) return res.status(500).json({ success: false, message: err2.message });
      res.status(201).json({ success: true, data: rows[0] });
    });
  });
});

// DELETE /api/knowledge-base/:id
app.delete('/api/knowledge-base/:id', authenticateJWT, (req, res) => {
  db.query('DELETE FROM knowledge_base WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  });
});

// GET all knowledge base entries
app.get('/api/knowledge-base', authenticateJWT, (req, res) => {
  db.query('SELECT * FROM knowledge_base', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results });
  });
});

// File upload endpoint
app.post('/api/upload', authenticateJWT, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, file_path: `/uploads/${req.file.filename}` });
});

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});

// Client Admin Login endpoint
app.post('/api/client-admin/login', async (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM clients WHERE companyEmail = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error', error: err });
    if (!results.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
    const client = results[0];
    try {
      let isValidPassword = false;

      // First try bcrypt comparison (for hashed passwords)
      try {
        isValidPassword = await bcrypt.compare(password, client.adminPassword);
      } catch (hashError) {
        // If bcrypt.compare fails, it might be a plain-text password
        console.log('Hash comparison failed, trying plain-text comparison');
        isValidPassword = (password === client.adminPassword);

        // If plain-text password is correct, upgrade it to hashed
        if (isValidPassword) {
          console.log('Plain-text password matched. Upgrading to hashed password...');
          const hashedPassword = await bcrypt.hash(password, 10);
          db.query(
            'UPDATE clients SET adminPassword = ? WHERE id = ?',
            [hashedPassword, client.id],
            (updateErr) => {
              if (updateErr) {
                console.error('Failed to upgrade password to hash:', updateErr);
                // Continue anyway since login is successful
              } else {
                console.log('Successfully upgraded password to hash');
              }
            }
          );
        }
      }

      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Create JWT token for client admin
      const token = jwt.sign(
        { 
          id: client.id, 
          email: client.companyEmail, 
          role: 'client_admin',
          companyName: client.companyName 
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 24*60*60*1000
      });

      res.json({ 
        success: true, 
        user: { 
          id: client.id, 
          email: client.companyEmail, 
          role: 'client_admin',
          companyName: client.companyName 
        } 
      });
    } catch (err) {
      console.error('Error in authentication:', err);
      res.status(500).json({ success: false, message: 'Authentication error' });
    }
  });
});

// Reset client admin password
app.post('/api/clients/:id/reset-password', async (req, res) => {
  const clientId = req.params.id;
  const { oldPassword, newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ success: false, message: 'New password is required' });
  }

  try {
    // First get the current password hash
    db.query('SELECT adminPassword FROM clients WHERE id = ?', [clientId], async (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }

      const currentHashedPassword = results[0].adminPassword;

      // If oldPassword is provided, verify it
      if (oldPassword) {
        try {
          const isValid = await bcrypt.compare(oldPassword, currentHashedPassword);
          if (!isValid) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
          }
        } catch (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).json({ success: false, message: 'Error verifying current password' });
        }
      }

      // Hash the new password
      const newHashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password in the database
      db.query(
        'UPDATE clients SET adminPassword = ? WHERE id = ?',
        [newHashedPassword, clientId],
        (updateErr) => {
          if (updateErr) {
            console.error('Error updating password:', updateErr);
            return res.status(500).json({ success: false, message: 'Failed to update password' });
          }
          res.json({ success: true, message: 'Password updated successfully' });
        }
      );
    });
  } catch (err) {
    console.error('Error in password reset:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add new endpoints for client profile management after the existing client endpoints

// Update client profile
app.put('/api/clients/:id/profile', authenticateJWT, async (req, res) => {
  const { name, avatar_url, bio } = req.body;
  const clientId = req.params.id;

  // Verify the client belongs to the authenticated user
  if (req.user.type !== 'client' || req.user.id !== parseInt(clientId)) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  db.query(
    'UPDATE clients SET companyName = ?, avatar_url = ?, bio = ? WHERE id = ?',
    [name, avatar_url, bio, clientId],
    (err) => {
      if (err) {
        console.error('Error updating client profile:', err);
        return res.status(500).json({ success: false, message: 'Failed to update profile' });
      }
      res.json({ success: true, message: 'Profile updated successfully' });
    }
  );
});

// Upload client profile picture
app.post('/api/clients/:id/avatar', authenticateJWT, upload.single('profile_picture'), (req, res) => {
  const clientId = req.params.id;

  // Verify the client belongs to the authenticated user
  if (req.user.type !== 'client' || req.user.id !== parseInt(clientId)) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const filePath = `/uploads/${req.file.filename}`;
  db.query(
    'UPDATE clients SET avatar_url = ? WHERE id = ?',
    [filePath, clientId],
    (err) => {
      if (err) {
        console.error('Error updating client avatar:', err);
        return res.status(500).json({ success: false, message: 'Failed to update avatar' });
      }
      res.json({ success: true, avatar_url: filePath });
    }
  );
});

// Delete client profile picture
app.delete('/api/clients/:id/avatar', authenticateJWT, (req, res) => {
  const clientId = req.params.id;

  // Verify the client belongs to the authenticated user
  if (req.user.type !== 'client' || req.user.id !== parseInt(clientId)) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  db.query(
    'UPDATE clients SET avatar_url = NULL WHERE id = ?',
    [clientId],
    (err) => {
      if (err) {
        console.error('Error deleting client avatar:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete avatar' });
      }
      res.json({ success: true, message: 'Avatar deleted successfully' });
    }
  );
});

// 1. SQL for the new table (to be run in your DB):
// CREATE TABLE agent_voice_settings (
//   agent_id VARCHAR(64) PRIMARY KEY,
//   model_id VARCHAR(64),
//   voice_id VARCHAR(64),
//   tts_output_format VARCHAR(32),
//   optimize_streaming_latency INT,
//   stability FLOAT,
//   speed FLOAT,
//   similarity_boost FLOAT,
//   pronunciation_dictionary_locators JSON,
//   multi_voice_ids JSON
// );

// 2. Add endpoints to save and fetch voice settings
app.get('/api/agents/:agentId/voice-settings', async (req, res) => {
  const { agentId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM agent_voice_settings WHERE agent_id = ?', [agentId]);
    if (rows.length > 0) {
      res.json({ success: true, data: rows[0] });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/agents/:agentId/voice-settings', async (req, res) => {
  const { agentId } = req.params;
  const {
    model_id,
    voice_id,
    tts_output_format,
    optimize_streaming_latency,
    stability,
    speed,
    similarity_boost,
    pronunciation_dictionary_locators,
    multi_voice_ids
  } = req.body;
  try {
    await db.query(
      `INSERT INTO agent_voice_settings (agent_id, model_id, voice_id, tts_output_format, optimize_streaming_latency, stability, speed, similarity_boost, pronunciation_dictionary_locators, multi_voice_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         model_id = VALUES(model_id),
         voice_id = VALUES(voice_id),
         tts_output_format = VALUES(tts_output_format),
         optimize_streaming_latency = VALUES(optimize_streaming_latency),
         stability = VALUES(stability),
         speed = VALUES(speed),
         similarity_boost = VALUES(similarity_boost),
         pronunciation_dictionary_locators = VALUES(pronunciation_dictionary_locators),
         multi_voice_ids = VALUES(multi_voice_ids)
      `,
      [
        agentId,
        model_id,
        voice_id,
        tts_output_format,
        optimize_streaming_latency,
        stability,
        speed,
        similarity_boost,
        JSON.stringify(pronunciation_dictionary_locators || []),
        JSON.stringify(multi_voice_ids || [])
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/elevenlabs/pronunciation-dictionary', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const name = req.body.name || req.file.originalname;
  execFile('python3', ['upload_dict.py', filePath, name], (err, stdout, stderr) => {
    if (err) {
      console.error('Python script error:', stderr);
      return res.status(500).json({ error: stderr });
    }
    try {
      const result = JSON.parse(stdout);
      res.json(result); // { pronunciation_dictionary_id, version_id }
    } catch (e) {
      console.error('Failed to parse Python script output:', stdout);
      res.status(500).json({ error: 'Failed to parse SDK output' });
    }
  });
});

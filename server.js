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
    'https://2nq68jpg-3000.inc1.devtunnels.ms', // <-- Add your tunnel URL here
    /^https:\/\/.*\.ngrok-free\.app$/, // Allow all ngrok-free.app subdomains
    /^https:\/\/.*\.ngrok\.io$/, // Allow all ngrok.io subdomains
    /^https:\/\/.*\.ngrok\.app$/ // Allow all ngrok.app subdomains
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
            referralCode VARCHAR(64) NULL,
            plan_id INT NOT NULL,
            apiAccess BOOLEAN NOT NULL DEFAULT FALSE,
            trialMode BOOLEAN NOT NULL DEFAULT FALSE,
            trialDuration INT,
            trialCallLimit INT,
            trialEndsAt DATETIME NULL,
            totalCallsMade INT NOT NULL DEFAULT 0,
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

          // Ensure new columns/indexes exist for evolving schema
          // 1) referralCode column (optional)
          tempDb.query(
            "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ai-caller' AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'referralCode'",
            (e1, r1) => {
              if (!e1 && (!Array.isArray(r1) || r1.length === 0)) {
                tempDb.query(
                  "ALTER TABLE clients ADD COLUMN referralCode VARCHAR(64) NULL AFTER domainSubdomain",
                  (e1a) => {
                    if (e1a) console.error("Failed to add clients.referralCode column:", e1a);
                    else console.log("✅ Added clients.referralCode column");
                  }
                );
              }
            }
          );

          // 2) trialEndsAt column (optional) used for auto-logout/banner
          tempDb.query(
            "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ai-caller' AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'trialEndsAt'",
            (e2, r2) => {
              if (!e2 && (!Array.isArray(r2) || r2.length === 0)) {
                tempDb.query(
                  "ALTER TABLE clients ADD COLUMN trialEndsAt DATETIME NULL AFTER trialCallLimit",
                  (e2a) => {
                    if (e2a) console.error("Failed to add clients.trialEndsAt column:", e2a);
                    else console.log("✅ Added clients.trialEndsAt column");
                  }
                );
              }
            }
          );

          // 3) Unique index on companyEmail to enforce uniqueness
          tempDb.query(
            "SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='ai-caller' AND TABLE_NAME='clients' AND INDEX_NAME='unique_companyEmail'",
            (e3, r3) => {
              if (!e3 && (!Array.isArray(r3) || r3.length === 0)) {
                tempDb.query(
                  "ALTER TABLE clients ADD UNIQUE KEY unique_companyEmail (companyEmail)",
                  (e3a) => {
                    if (e3a) console.error("Failed to add unique index on clients.companyEmail:", e3a);
                    else console.log("✅ Added unique index clients.unique_companyEmail");
                  }
                );
              }
            }
          );

          // 4) totalCallsMade column for real-time call tracking
          tempDb.query(
            "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ai-caller' AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'totalCallsMade'",
            (e4, r4) => {
              if (!e4 && (!Array.isArray(r4) || r4.length === 0)) {
                tempDb.query(
                  "ALTER TABLE clients ADD COLUMN totalCallsMade INT NOT NULL DEFAULT 0 AFTER trialEndsAt",
                  (e4a) => {
                    if (e4a) console.error("Failed to add clients.totalCallsMade column:", e4a);
                    else console.log("✅ Added clients.totalCallsMade column");
                  }
                );
              }
            }
          );
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

        // Create agent knowledge base mapping table (drop if exists to avoid foreign key issues)
        const dropAgentKnowledgeBaseTable = `DROP TABLE IF EXISTS agent_knowledge_base`;
        const createAgentKnowledgeBaseTable = `
          CREATE TABLE IF NOT EXISTS agent_knowledge_base (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agent_id VARCHAR(255) NOT NULL UNIQUE,
            knowledge_base_items JSON NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_agent_id (agent_id)
          ) ENGINE=InnoDB;
        `;
        
        // Drop and recreate to ensure clean schema
        tempDb.query(dropAgentKnowledgeBaseTable, (dropErr) => {
          if (dropErr) {
            console.error("Failed to drop agent knowledge base table:", dropErr);
          } else {
            console.log("✅ Dropped existing agent knowledge base table");
          }
          
          // Also try to drop any foreign key constraints that might exist
          tempDb.query('SET FOREIGN_KEY_CHECKS = 0', (fkErr) => {
            if (fkErr) {
              console.error("Failed to disable foreign key checks:", fkErr);
            } else {
              console.log("✅ Disabled foreign key checks");
            }
            
            tempDb.query(createAgentKnowledgeBaseTable, (createErr) => {
              if (createErr) {
                console.error("Failed to create agent knowledge base table:", createErr);
              } else {
                console.log("✅ Agent knowledge base table ready");
              }
              
              // Re-enable foreign key checks
              tempDb.query('SET FOREIGN_KEY_CHECKS = 1', (fkErr2) => {
                if (fkErr2) {
                  console.error("Failed to re-enable foreign key checks:", fkErr2);
                } else {
                  console.log("✅ Re-enabled foreign key checks");
                }
              });
            });
          });
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

      // Create widget settings table
      const createWidgetSettingsTable = `
        CREATE TABLE IF NOT EXISTS agent_widget_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          agent_id VARCHAR(64) NOT NULL UNIQUE,
          feedback_mode ENUM('none', 'during', 'end') DEFAULT 'during',
          embed_code TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_agent_id (agent_id)
        );
      `;
      db.query(createWidgetSettingsTable, (err) => {
        if (err) {
          console.error('Failed to create widget settings table:', err);
        } else {
          console.log('✅ Widget settings table ready');
        }
      });

        // --- AGENTS TABLE MIGRATION: Add language_code and additional_languages columns if not exist ---
        db.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS language_code VARCHAR(20)`, () => {});
        db.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS additional_languages TEXT`, () => {});
        db.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Published' AFTER updated_at`, () => {});
        db.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS created_by INT`, () => {});
        db.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255)`, () => {});
        db.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20)`, () => {});
      });
    });
    return;
  }
  console.log("✅ MySQL Connected");
  
  // Create workspace secrets table
  const createWorkspaceSecretsTable = `
    CREATE TABLE IF NOT EXISTS workspace_secrets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      secret_id VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'new',
      used_by JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_secret_id (secret_id),
      INDEX idx_name (name)
    );
  `;
  
  db.query(createWorkspaceSecretsTable, (err) => {
    if (err) {
      console.error("Failed to create workspace secrets table:", err);
    } else {
      console.log("✅ Workspace secrets table ready");
      
      // Removed sample workspace secrets auto-insert
    }
  });

  // Create MCP Servers table (local mirror/metadata)
  const createMcpServersTable = `
    CREATE TABLE IF NOT EXISTS mcp_servers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mcp_server_id VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      server_type VARCHAR(32) NULL,
      url TEXT,
      secret_id VARCHAR(255) NULL,
      headers JSON NULL,
      approval_mode VARCHAR(32) DEFAULT 'always',
      trusted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  db.query(createMcpServersTable, (err) => {
    if (err) {
      console.error('Failed to create mcp_servers table:', err);
    } else {
      console.log('✅ MCP servers table ready');
    }
  });
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
app.post('/api/elevenlabs/create-agent', authenticateJWT, async (req, res) => {
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
        agent.temperature || null,
        // single selection: pick primary MCP server id from ElevenLabs payload if present
        JSON.stringify(Array.isArray(agent.prompt?.mcp_server_ids) ? agent.prompt.mcp_server_ids : (agent.mcp_server_ids || [])),
        req.user.id,
        (req.user.name || req.user.companyName || req.user.email || 'Unknown'),
        (req.user.type === 'client' ? 'client' : 'admin')
      ];
      console.log('Insert values:', insertValues);
      const insertSql = `
        INSERT INTO agents (
          agent_id, client_id, name, description, first_message, system_prompt, language_id, voice_id, model, tags, platform_settings, created_at, updated_at, language_code, additional_languages, custom_llm_url, custom_llm_model_id, custom_llm_api_key, custom_llm_headers, llm, temperature, mcp_server_ids, created_by, created_by_name, created_by_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name=VALUES(name), description=VALUES(description), first_message=VALUES(first_message),
          system_prompt=VALUES(system_prompt), language_id=VALUES(language_id), voice_id=VALUES(voice_id),
          model=VALUES(model), tags=VALUES(tags), platform_settings=VALUES(platform_settings), updated_at=NOW(),
          language_code=VALUES(language_code), additional_languages=VALUES(additional_languages),
          custom_llm_url=VALUES(custom_llm_url), custom_llm_model_id=VALUES(custom_llm_model_id),
          custom_llm_api_key=VALUES(custom_llm_api_key), custom_llm_headers=VALUES(custom_llm_headers),
          llm=VALUES(llm), temperature=VALUES(temperature), mcp_server_ids=VALUES(mcp_server_ids), created_by=VALUES(created_by), created_by_name=VALUES(created_by_name), created_by_type=VALUES(created_by_type)
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
app.get('/api/agents', authenticateJWT, (req, res) => {
  const sql = `
    SELECT
      a.*,
      l.name AS language_name,
      l.code AS language_code,
      COALESCE(a.created_by_name, au.name, cu.companyName, ?) AS creator_name
    FROM agents a
    LEFT JOIN languages l ON a.language_id = l.id
    LEFT JOIN admin_users au ON a.created_by = au.id
    LEFT JOIN clients cu ON a.created_by = cu.id
  `;
  console.log('[API] /api/agents SQL:', sql);
  const fallbackName = (req.user?.name || req.user?.companyName || req.user?.email || 'Unknown');
  db.query(sql, [fallbackName], (err, results) => {
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
    // Normalize MCP server info from ElevenLabs and set into localAgent for UI binding
    try {
      const mcpIds = elevenLabsAgent?.conversation_config?.agent?.prompt?.mcp_server_ids || [];
      localAgent.mcp_server_ids = Array.isArray(mcpIds) ? mcpIds : [];
    } catch {}
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
          // Special handling for MCP arrays (normalize to mcp_server_ids JSON column)
          if (k === 'mcp_server_ids' || k === 'mcp_server_id') {
            const arr = Array.isArray(local.mcp_server_ids)
              ? local.mcp_server_ids
              : (local.mcp_server_id ? [local.mcp_server_id] : []);
            updateFields.push(`mcp_server_ids = ?`);
            updateValues.push(JSON.stringify(arr));
            return;
          }
          let value = local[k];
          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            value = JSON.stringify(value);
          }
          updateFields.push(`${k} = ?`);
          updateValues.push(value);
        });
      }
      // Persist language_code and additional_languages from ElevenLabs agent config if present
      if (elevenlabs && elevenlabs.conversation_config) {
        const agent = elevenlabs.conversation_config.agent;
        if (agent && agent.language) {
          updateFields.push(`language_code = ?`);
          updateValues.push(agent.language);
        }
        // Extract additional languages from language_presets
        if (elevenlabs.conversation_config.language_presets) {
          const additional_languages = Object.keys(elevenlabs.conversation_config.language_presets);
          if (additional_languages.length > 0) {
            updateFields.push(`additional_languages = ?`);
            updateValues.push(JSON.stringify(additional_languages));
          }
        }
        // Persist MCP server IDs as array if present in ElevenLabs response
        const mcpIdsFromEl = elevenlabs.conversation_config?.agent?.prompt?.mcp_server_ids;
        if (Array.isArray(mcpIdsFromEl)) {
          updateFields.push(`mcp_server_ids = ?`);
          updateValues.push(JSON.stringify(mcpIdsFromEl));
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

        // After ElevenLabs update, persist mcp_server_ids locally (array)
        try {
          const mcpIds = respData?.conversation_config?.agent?.prompt?.mcp_server_ids || elevenlabs?.conversation_config?.agent?.prompt?.mcp_server_ids || [];
          if (Array.isArray(mcpIds)) {
            await new Promise((resolve, reject) => {
              db.query('UPDATE agents SET mcp_server_ids = ? WHERE agent_id = ?', [JSON.stringify(mcpIds), agentId], (err) => {
                if (err) return reject(err);
                resolve(null);
              });
            });
          }
        } catch (e) {
          console.warn('[PATCH /api/agents/:id/details] Warning persisting mcp_server_ids:', e);
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
app.get('/api/agents/:id/analysis', async (req, res) => {
  const agentId = req.params.id;
  db.query(
    'SELECT name, prompt FROM agent_analysis_criteria WHERE agent_id = ?',
    [agentId],
    (err, criteriaRows) => {
      if (err) return res.status(500).json({ error: 'DB error (criteria)' });
      db.query(
        'SELECT data_type, identifier, description FROM agent_analysis_data_collection WHERE agent_id = ?',
        [agentId],
        (err2, dataRows) => {
          if (err2) return res.status(500).json({ error: 'DB error (data_collection)' });
          res.json({
            criteria: criteriaRows,
            data_collection: dataRows
          });
        }
      );
    }
  );
});

//POST /api/agents/:id/analysis - Save analysis criteria and data collection for an agent
app.post('/api/agents/:id/analysis', async (req, res) => {
  const agentId = req.params.id;
  const { criteria, data_collection } = req.body;

  // Save criteria (deduplicate by name)
  if (Array.isArray(criteria)) {
    const seen = new Set();
    for (const c of criteria) {
      if (seen.has(c.name)) continue;
      seen.add(c.name);
      db.query(
        `INSERT INTO agent_analysis_criteria (agent_id, name, prompt) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE prompt = VALUES(prompt)`,
        [agentId, c.name, c.prompt],
        (err, result) => {
          if (err) {
            console.error('[POST /api/agents/:id/analysis] Error inserting criteria:', err, c);
          }
        }
      );
    }
  }
  // Save data_collection (deduplicate by identifier)
  if (Array.isArray(data_collection)) {
    const seen = new Set();
    for (const d of data_collection) {
      if (seen.has(d.identifier)) continue;
      seen.add(d.identifier);
      db.query(
        `INSERT INTO agent_analysis_data_collection (agent_id, identifier, data_type, description) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE data_type = VALUES(data_type), description = VALUES(description)`,
        [agentId, d.identifier, d.type || d.data_type, d.description],
        (err, result) => {
          if (err) {
            console.error('[POST /api/agents/:id/analysis] Error inserting data_collection:', err, d);
          }
        }
      );
    }
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

    // If trialMode with duration is provided and no trialEndsAt, set it now
    if (client.trialMode && client.trialDuration && !client.trialEndsAt) {
      const ends = new Date(Date.now() + Number(client.trialDuration) * 24 * 60 * 60 * 1000);
      client.trialEndsAt = ends;
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

  // If frontend updates trialMode/trialDuration without explicit trialEndsAt, recompute
  if (client.trialMode && client.trialDuration && !client.trialEndsAt) {
    const ends = new Date(Date.now() + Number(client.trialDuration) * 24 * 60 * 60 * 1000);
    client.trialEndsAt = ends;
  }

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

// Import email service
const { sendEmail, testEmailConfig } = require('./emailService');

// Send welcome email to client
app.post("/api/clients/:id/send-welcome-email", async (req, res) => {
  try {
    const clientId = req.params.id;
    
    // Get client details
    db.query("SELECT * FROM clients WHERE id = ?", [clientId], async (err, results) => {
      if (err) {
        console.error("Failed to fetch client for welcome email:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch client details" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
      
      const client = results[0];
      
      try {
        // Send actual welcome email
        const emailResult = await sendEmail(client.companyEmail, 'welcomeEmail', client);
        
        console.log(`📧 Welcome email sent successfully to: ${client.companyEmail}`);
        console.log(`📧 Company: ${client.companyName}`);
        console.log(`📧 Contact Person: ${client.contactPersonName}`);
        console.log(`📧 Email Message ID: ${emailResult.messageId}`);
        
        res.json({ 
          success: true, 
          message: "Welcome email sent successfully",
          email: client.companyEmail,
          companyName: client.companyName,
          messageId: emailResult.messageId
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        
        // Fallback: Log the email details for manual sending
        console.log(`📧 Welcome email details (manual sending required):`);
        console.log(`📧 To: ${client.companyEmail}`);
        console.log(`📧 Company: ${client.companyName}`);
        console.log(`📧 Contact Person: ${client.contactPersonName}`);
        
        res.json({ 
          success: false, 
          message: "Welcome email failed to send, but client was created successfully",
          email: client.companyEmail,
          companyName: client.companyName,
          error: emailError.message
        });
      }
    });
  } catch (error) {
    console.error("Error in welcome email endpoint:", error);
    res.status(500).json({ success: false, message: "Failed to process welcome email request", error: error.message });
  }
});

// Increment call count for a client (for real-time usage tracking)
app.post("/api/clients/:id/increment-call", (req, res) => {
  const clientId = req.params.id;
  
  db.query(
    "UPDATE clients SET totalCallsMade = totalCallsMade + 1 WHERE id = ?",
    [clientId],
    (err, result) => {
      if (err) {
        console.error("Failed to increment call count:", err);
        return res.status(500).json({ success: false, message: "Failed to increment call count", error: err });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
      
      // Get updated call count
      db.query(
        "SELECT totalCallsMade FROM clients WHERE id = ?",
        [clientId],
        (err2, results) => {
          if (err2) {
            console.error("Failed to fetch updated call count:", err2);
            return res.status(500).json({ success: false, message: "Call count incremented but failed to fetch updated count" });
          }
          
          res.json({ 
            success: true, 
            message: "Call count incremented successfully",
            totalCallsMade: results[0].totalCallsMade
          });
        }
      );
    }
  );
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
          
          // Automatically turn off trial mode when a paid plan is assigned
          db.query(
            "UPDATE clients SET trialMode = FALSE, trialDuration = NULL, trialCallLimit = NULL, trialEndsAt = NULL WHERE id = ?",
            [client_id],
            (err3) => {
              if (err3) {
                console.error("Failed to turn off trial mode:", err3);
                // Don't fail the request, just log the error
              } else {
                console.log(`✅ Trial mode automatically turned off for client ${client_id} after plan assignment`);
              }
              res.status(201).json({ success: true, message: "Plan assigned successfully and trial mode turned off" });
            }
          );
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

// --- WIDGET SETTINGS API ENDPOINTS ---
app.get('/api/agents/:agentId/widget-settings', async (req, res) => {
  const { agentId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM agent_widget_settings WHERE agent_id = ?', [agentId]);
    if (rows.length > 0) {
      res.json({ success: true, data: rows[0] });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/agents/:agentId/widget-settings', async (req, res) => {
  const { agentId } = req.params;
  const { feedback_mode, embed_code } = req.body;
  try {
    await db.query(
      `INSERT INTO agent_widget_settings (agent_id, feedback_mode, embed_code)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         feedback_mode = VALUES(feedback_mode),
         embed_code = VALUES(embed_code),
         updated_at = NOW()
      `,
      [agentId, feedback_mode, embed_code]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/agents/:agentId/widget-settings', async (req, res) => {
  const { agentId } = req.params;
  const { feedback_mode, embed_code } = req.body;
  try {
    await db.query(
      `UPDATE agent_widget_settings 
       SET feedback_mode = ?, embed_code = ?, updated_at = NOW()
       WHERE agent_id = ?
      `,
      [feedback_mode, embed_code, agentId]
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

// --- Analysis Criteria/Data Item DELETE Endpoints ---
app.delete('/api/agents/:agentId/analysis/criteria', (req, res) => {
  const { agentId } = req.params;
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing criteria name' });
  db.query('DELETE FROM agent_analysis_criteria WHERE agent_id = ? AND name = ?', [agentId, name], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Criteria not found' });
    res.json({ success: true });
  });
});

app.delete('/api/agents/:agentId/analysis/data-item', (req, res) => {
  const { agentId } = req.params;
  const { identifier } = req.query;
  if (!identifier) return res.status(400).json({ error: 'Missing data item identifier' });
  db.query('DELETE FROM agent_analysis_data_collection WHERE agent_id = ? AND identifier = ?', [agentId, identifier], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Data item not found' });
    res.json({ success: true });
  });
});

// PATCH proxy for ElevenLabs API (if not already present)
app.patch('/v1/convai/agents/:agentId', async (req, res) => {
  const { agentId } = req.params;
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to proxy PATCH to ElevenLabs', details: err.message });
  }
});

// --- AGENT ADVANCED SETTINGS TABLE CREATION ---
const createAgentAdvancedSettingsTable = `
  CREATE TABLE IF NOT EXISTS agent_advanced_settings (
    agent_id VARCHAR(64) PRIMARY KEY,
    turn_timeout INT,
    silence_end_call_timeout INT,
    max_conversation_duration INT,
    keywords TEXT,
    text_only BOOLEAN,
    user_input_audio_format VARCHAR(64),
    client_events TEXT,
    privacy_settings JSON,
    conversations_retention_period INT,
    delete_transcript_and_derived_fields BOOLEAN,
    delete_audio BOOLEAN,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;
db.query(createAgentAdvancedSettingsTable, (err) => {
  if (err) {
    console.error("Failed to create agent_advanced_settings table:", err);
  } else {
    console.log("✅ agent_advanced_settings table ready");
  }
});
// ... existing code ...
// --- AGENT ADVANCED SETTINGS ENDPOINTS ---
// Save advanced settings (POST or PUT)
app.post('/api/agents/:agentId/advanced-settings', async (req, res) => {
  const { agentId } = req.params;
  const {
    turn_timeout,
    silence_end_call_timeout,
    max_conversation_duration,
    keywords,
    text_only,
    user_input_audio_format,
    client_events,
    privacy_settings,
    conversations_retention_period,
    delete_transcript_and_derived_fields,
    delete_audio
  } = req.body;
  try {
    await db.query(
      `INSERT INTO agent_advanced_settings (
        agent_id, turn_timeout, silence_end_call_timeout, max_conversation_duration, keywords, text_only, user_input_audio_format, client_events, privacy_settings, conversations_retention_period, delete_transcript_and_derived_fields, delete_audio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        turn_timeout = VALUES(turn_timeout),
        silence_end_call_timeout = VALUES(silence_end_call_timeout),
        max_conversation_duration = VALUES(max_conversation_duration),
        keywords = VALUES(keywords),
        text_only = VALUES(text_only),
        user_input_audio_format = VALUES(user_input_audio_format),
        client_events = VALUES(client_events),
        privacy_settings = VALUES(privacy_settings),
        conversations_retention_period = VALUES(conversations_retention_period),
        delete_transcript_and_derived_fields = VALUES(delete_transcript_and_derived_fields),
        delete_audio = VALUES(delete_audio)
      `,
      [
        agentId,
        turn_timeout,
        silence_end_call_timeout,
        max_conversation_duration,
        Array.isArray(keywords) ? keywords.join(',') : keywords,
        text_only,
        user_input_audio_format,
        Array.isArray(client_events) ? client_events.join(',') : client_events,
        privacy_settings ? JSON.stringify(privacy_settings) : null,
        conversations_retention_period,
        delete_transcript_and_derived_fields,
        delete_audio
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// ... existing code ...

// Duplicate agent in local DB and ElevenLabs
app.post('/api/agents/:agentId/duplicate', authenticateJWT, async (req, res) => {
  const agentId = req.params.agentId;
  const { client_id } = req.body || {}; // Get client_id from request body, default to empty object
  
  try {
    if (process.env.ELEVENLABS_API_KEY) {
      // Duplicate in ElevenLabs
      const duplicateRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}/duplicate`, {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      const duplicateData = await duplicateRes.json();
      if (duplicateRes.ok && duplicateData.agent_id) {
        // Fetch full agent details from ElevenLabs for the new agent
        const detailsRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${duplicateData.agent_id}`, {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        const details = await detailsRes.json();
        // Look up language_id from languages table
        const languageCode = details.conversation_config?.agent?.language || '';
        db.query('SELECT id FROM languages WHERE code = ? LIMIT 1', [languageCode], (langErr, langRows) => {
          let language_id = null;
          if (!langErr && langRows && langRows.length > 0) {
            language_id = langRows[0].id;
          } else {
            language_id = 1; // fallback to 1 (likely English)
          }
          const newAgent = {
            agent_id: details.agent_id,
            client_id: client_id || null, // Use provided client_id or null
            name: (details.name || '') + ' (Copy)',
            description: details.description || '',
            first_message: details.conversation_config?.agent?.first_message || '',
            system_prompt: details.conversation_config?.agent?.prompt?.prompt || '',
            language_id,
            voice_id: details.conversation_config?.tts?.voice_id || '',
            model: details.model || '',
            tags: JSON.stringify(details.tags || []),
            platform_settings: JSON.stringify(details.platform_settings || {}),
            language_code: languageCode,
            additional_languages: JSON.stringify(details.conversation_config?.agent?.additional_languages || []),
            custom_llm_url: details.conversation_config?.agent?.prompt?.custom_llm_url || '',
            custom_llm_model_id: details.conversation_config?.agent?.prompt?.custom_llm_model_id || '',
            custom_llm_api_key: details.conversation_config?.agent?.prompt?.custom_llm_api_key || '',
            custom_llm_headers: JSON.stringify(details.conversation_config?.agent?.prompt?.custom_llm_headers || []),
            llm: details.conversation_config?.agent?.prompt?.llm || '',
            temperature: details.conversation_config?.agent?.prompt?.temperature || 0.5,
            created_by: req.user.id,
            created_by_name: (req.user.name || req.user.companyName || req.user.email || 'Unknown'),
            created_by_type: (req.user.type === 'client' ? 'client' : 'admin')
          };
          db.query('INSERT INTO agents SET ?', newAgent, (err2, result) => {
            if (err2) {
              console.error('DB insert error:', err2, newAgent);
              return res.status(500).json({ success: false, message: err2.message });
            }
            res.json({ success: true, data: { ...newAgent, id: result.insertId } });
          });
        });
        return;
      }
    }
    // If ElevenLabs duplication fails, fallback to local duplication (optional)
    db.query('SELECT * FROM agents WHERE agent_id = ?', [agentId], (err, rows) => {
      if (err || !rows.length) return res.status(404).json({ success: false, message: 'Agent not found' });
      const agent = rows[0];
      const newAgent = { ...agent };
      newAgent.agent_id = `local_${Date.now()}`;
      newAgent.name = agent.name + ' (Copy)';
      newAgent.client_id = client_id || agent.client_id; // Use provided client_id or keep original
      newAgent.created_by = req.user.id;
      newAgent.created_by_name = (req.user.name || req.user.companyName || req.user.email || 'Unknown');
      newAgent.created_by_type = (req.user.type === 'client' ? 'client' : 'admin');
      delete newAgent.id;
      db.query('INSERT INTO agents SET ?', newAgent, (err2, result) => {
        if (err2) {
          console.error('DB insert error:', err2, newAgent);
          return res.status(500).json({ success: false, message: err2.message });
        }
        res.json({ success: true, data: { ...newAgent, id: result.insertId } });
      });
    });
  } catch (err) {
    console.error('Duplicate agent error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Improved DELETE: always try both ElevenLabs and local DB, return success if either works
app.delete('/api/agents/:agentId', authenticateJWT, async (req, res) => {
  const agentId = req.params.agentId;
  let deletedFromElevenLabs = false;
  let deletedFromLocal = false;
  try {
    // Try to delete from ElevenLabs
    if (process.env.ELEVENLABS_API_KEY) {
      const elevenRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      if (elevenRes.ok) deletedFromElevenLabs = true;
    }
    // Try to delete from local DB
    db.query('DELETE FROM agents WHERE agent_id = ?', [agentId], (err2, result) => {
      if (!err2 && result.affectedRows > 0) deletedFromLocal = true;
      if (deletedFromElevenLabs || deletedFromLocal) {
        return res.json({ success: true, deletedFromElevenLabs, deletedFromLocal });
      } else {
        return res.status(404).json({ success: false, message: 'Agent not found in ElevenLabs or local DB' });
      }
    });
  } catch (err) {
    console.error('Delete agent error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- AGENT KNOWLEDGE BASE API ENDPOINTS ---

// POST /api/agents/:agentId/knowledge-base-db - Save knowledge base mappings to database
app.post('/api/agents/:agentId/knowledge-base-db', async (req, res) => {
  const agentId = req.params.agentId;
  const { knowledgeBaseItems } = req.body;
  
  console.log(`[API] Saving knowledge base to database for agent ID: ${agentId}`, {
    agentId,
    requestBody: req.body,
    timestamp: new Date().toISOString()
  });

  try {
    if (!Array.isArray(knowledgeBaseItems)) {
      return res.status(400).json({
        success: false,
        error: 'knowledgeBaseItems must be an array',
        timestamp: new Date().toISOString()
      });
    }

    // Check if the agent exists in the agents table
    console.log(`[API] Checking if agent ${agentId} exists in agents table`);
    db.query('SELECT agent_id FROM agents WHERE agent_id = ?', [agentId], (checkErr, checkRows) => {
      if (checkErr) {
        console.error(`[API] Error checking if agent exists:`, checkErr);
        return res.status(500).json({
          success: false,
          agentId,
          error: 'Failed to check if agent exists',
          timestamp: new Date().toISOString()
        });
      }
      
      if (checkRows.length === 0) {
        console.error(`[API] Agent ${agentId} not found in agents table`);
        return res.status(404).json({
          success: false,
          agentId,
          error: `Agent ${agentId} not found in agents table`,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`[API] Agent ${agentId} found in agents table, proceeding with knowledge base update`);
      
      // Prepare knowledge base items as JSON array
      const knowledgeBaseItemsJson = knowledgeBaseItems.map(item => ({
        id: String(item.id),
        name: item.name,
        type: item.type,
        url: item.url,
        usage_mode: item.usage_mode || 'auto',
        rag_enabled: item.usage_mode === 'auto'
      }));
      
      console.log(`[API] Preparing to save knowledge base items for agent ${agentId}:`, {
        agentId,
        itemCount: knowledgeBaseItemsJson.length,
        items: knowledgeBaseItemsJson,
        timestamp: new Date().toISOString()
      });
      
      // Insert or update the single row for this agent
      const insertOrUpdateSQL = `
        INSERT INTO agent_knowledge_base (agent_id, knowledge_base_items) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE 
          knowledge_base_items = VALUES(knowledge_base_items),
          updated_at = NOW()
      `;
      
      db.query(insertOrUpdateSQL, [agentId, JSON.stringify(knowledgeBaseItemsJson)], (insertErr) => {
        if (insertErr) {
          console.error(`[API] Error saving knowledge base items for agent ${agentId}:`, insertErr);
          console.error(`[API] Insert values:`, [agentId, JSON.stringify(knowledgeBaseItemsJson)]);
          return res.status(500).json({
            success: false,
            agentId,
            error: insertErr.message || 'Failed to save knowledge base items',
            timestamp: new Date().toISOString()
          });
        }
        
        console.log(`[API] Successfully saved knowledge base items for agent ${agentId}`, {
          agentId,
          itemCount: knowledgeBaseItemsJson.length,
          items: knowledgeBaseItemsJson.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            usage_mode: item.usage_mode
          })),
          timestamp: new Date().toISOString()
        });

        res.json({
          success: true,
          agentId,
          message: `Successfully saved ${knowledgeBaseItemsJson.length} knowledge base items`,
          timestamp: new Date().toISOString()
        });
      });
    });
  } catch (error) {
    console.error(`[API] Error in knowledge base save operation for agent ${agentId}:`, {
      agentId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      agentId,
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/agents/:agentId/knowledge-base-db - Get knowledge base mappings from database
app.get('/api/agents/:agentId/knowledge-base-db', async (req, res) => {
  const agentId = req.params.agentId;
  
  console.log(`[API] Fetching knowledge base from database for agent ID: ${agentId}`, {
    agentId,
    timestamp: new Date().toISOString()
  });

  try {
    db.query('SELECT * FROM agent_knowledge_base WHERE agent_id = ?', [agentId], (err, rows) => {
      if (err) {
        console.error(`[API] Error fetching knowledge base items for agent ${agentId}:`, {
          agentId,
          error: err.message,
          timestamp: new Date().toISOString()
        });

        return res.status(500).json({
          success: false,
          agentId,
          error: err.message || 'Failed to fetch knowledge base items',
          timestamp: new Date().toISOString()
        });
      }
      
      let knowledgeBaseItems = [];
      if (rows.length > 0 && rows[0].knowledge_base_items) {
        try {
          knowledgeBaseItems = JSON.parse(rows[0].knowledge_base_items);
        } catch (parseErr) {
          console.error(`[API] Error parsing knowledge base items JSON for agent ${agentId}:`, parseErr);
          knowledgeBaseItems = [];
        }
      }
      
      console.log(`[API] Found knowledge base items for agent ${agentId}:`, {
        agentId,
        itemCount: knowledgeBaseItems.length,
        items: knowledgeBaseItems,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        agentId,
        knowledgeBaseItems: knowledgeBaseItems,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error(`[API] Error in knowledge base fetch operation for agent ${agentId}:`, {
      agentId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      agentId,
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// --- ElevenLabs Secrets Proxy Endpoints ---

// GET /api/workspace-secrets/local - Get secrets from local database
app.get('/api/workspace-secrets/local', (req, res) => {
  try {
    console.log('[DEBUG] Fetching workspace secrets from local database...');
    const query = 'SELECT * FROM workspace_secrets ORDER BY created_at DESC';
    db.query(query, (err, rows) => {
      if (err) {
        console.error('Error fetching secrets from local database:', err);
        return res.status(500).json({ error: 'Failed to fetch secrets from local database' });
      }
      
      console.log('[DEBUG] Raw database rows:', rows);
      
      // Parse used_by JSON for each secret
      const secrets = rows.map(row => ({
        ...row,
        used_by: row.used_by ? JSON.parse(row.used_by) : null
      }));
      
      console.log('[DEBUG] Processed secrets:', secrets);
      console.log('[DEBUG] Sending response with secrets count:', secrets.length);
      
      res.json({ secrets });
    });
  } catch (error) {
    console.error('Error in local secrets endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/elevenlabs/secrets - Get all workspace secrets
app.get('/api/elevenlabs/secrets', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    console.log('Fetching secrets from ElevenLabs...');
    
    // Try different possible endpoints
    const endpoints = [
      'https://api.elevenlabs.io/v1/convai/secrets',
      'https://api.elevenlabs.io/v1/secrets',
      'https://api.elevenlabs.io/v1/workspace/secrets'
    ];

    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying GET endpoint: ${endpoint}`);
        response = await fetch(endpoint, {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        console.log(`GET endpoint ${endpoint} response status:`, response.status);
        
        if (response.ok) {
          console.log(`GET success with endpoint: ${endpoint}`);
          break;
        } else {
          const errorText = await response.text();
          console.log(`GET endpoint ${endpoint} failed:`, response.status, errorText);
          lastError = { status: response.status, text: errorText };
        }
      } catch (error) {
        console.log(`GET endpoint ${endpoint} error:`, error.message);
        lastError = { error: error.message };
      }
    }

    if (!response || !response.ok) {
      console.error('All GET endpoints failed. Last error:', lastError);
      return res.status(lastError?.status || 500).json({ 
        error: 'Failed to fetch secrets from ElevenLabs', 
        details: lastError?.text || lastError?.error || 'All endpoints failed'
      });
    }

    console.log('ElevenLabs secrets response status:', response.status);
    console.log('ElevenLabs secrets response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs secrets API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch secrets from ElevenLabs', 
        details: errorText 
      });
    }

    const secrets = await response.json();
    console.log('ElevenLabs secrets response:', JSON.stringify(secrets, null, 2));
    
    // Sync secrets with local database
    try {
      const secretsArray = secrets.secrets || secrets.data || (Array.isArray(secrets) ? secrets : []);
      
      for (const secret of secretsArray) {
        const insertQuery = `
          INSERT INTO workspace_secrets (secret_id, name, type, used_by) 
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          name = VALUES(name), 
          type = VALUES(type), 
          used_by = VALUES(used_by),
          updated_at = CURRENT_TIMESTAMP
        `;
        
        const usedByJson = secret.used_by ? JSON.stringify(secret.used_by) : null;
        
        db.query(insertQuery, [
          secret.secret_id || secret.id,
          secret.name,
          secret.type || 'new',
          usedByJson
        ], (dbErr, result) => {
          if (dbErr) {
            console.error('Failed to sync secret to local database:', dbErr);
          }
        });
      }
      
      console.log('Secrets synced with local database');
    } catch (dbError) {
      console.error('Error syncing secrets with local database:', dbError);
    }
    
    res.json(secrets);
  } catch (error) {
    console.error('Error fetching secrets:', error);
    res.status(500).json({ error: 'Failed to fetch secrets', details: error.message });
  }
});

// MCP Servers - proxy to ElevenLabs and sync minimal metadata locally
app.get('/api/mcp-servers', authenticateJWT, async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = { 'xi-api-key': apiKey, 'Content-Type': 'application/json' };
    const resp = await fetch('https://api.elevenlabs.io/v1/convai/mcp-servers', { headers });
    const data = await resp.json();
    
    console.log('[DEBUG] ElevenLabs MCP servers response status:', resp.status);
    console.log('[DEBUG] ElevenLabs MCP servers raw data:', data);
    
    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: data });
    }
    
    const list = Array.isArray(data)
      ? data
      : (Array.isArray(data?.items) ? data.items
        : (Array.isArray(data?.servers) ? data.servers
          : (Array.isArray(data?.mcp_servers) ? data.mcp_servers : [])));
    
    console.log('[DEBUG] Normalized MCP servers list:', list);
    if (list.length > 0) {
      console.log('[DEBUG] First MCP server properties:', Object.keys(list[0]));
      console.log('[DEBUG] First MCP server data:', list[0]);
    }
    
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('[DEBUG] Error in MCP servers endpoint:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.get('/api/mcp-servers/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = { 'xi-api-key': apiKey, 'Content-Type': 'application/json' };
    const resp = await fetch(`https://api.elevenlabs.io/v1/convai/mcp-servers/${id}`, { headers });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: data });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.post('/api/mcp-servers', authenticateJWT, async (req, res) => {
  try {
    const payload = req.body;
    console.log('[DEBUG] MCP server creation request payload:', payload);
    
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('[DEBUG] ElevenLabs API key not configured');
      return res.status(500).json({ success: false, error: 'ElevenLabs API key not configured' });
    }
    
    const headers = { 'xi-api-key': apiKey, 'Content-Type': 'application/json' };
    
    const transportMap = {
      sse: 'SSE',
      streamable: 'STREAMABLE_HTTP',
    };
    const approvalMap = {
      always: 'require_approval_all',
      fine: 'require_approval_per_tool',
      none: 'auto_approve_all',
    };

    // Normalize incoming fields
    const normalized = {
      name: payload.name,
      description: payload.description,
      type: payload.type || 'streamable',
      url: payload.url,
      trusted: !!payload.trusted,
      approval_mode: payload.approval_mode,
      secret_id: payload?.secret?.secret_id && payload?.secret?.secret_id !== 'none' ? payload.secret.secret_id : null,
      headers: Array.isArray(payload.headers) ? payload.headers : [],
    };

    const headersArray = (normalized.headers || [])
      .filter(h => h?.name && h?.value)
      .map(h => ({ name: h.name, type: h.type || 'text', value: h.value }));

    const headersObject = headersArray.reduce((acc, h) => {
      if (h.type === 'text') {
        acc[h.name] = h.value;
      }
      return acc;
    }, {});

    // Create multiple candidate payloads to maximize compatibility
    const candidatePayloads = [
      {
        id: 'shape:type_url',
        body: {
          name: normalized.name,
          description: normalized.description,
          type: normalized.type,
          url: normalized.url,
          trusted: normalized.trusted,
          ...(normalized.secret_id ? { secret: { type: 'workspace_secret', secret_id: normalized.secret_id } } : {}),
          ...(headersArray.length ? { headers: headersArray } : {}),
          // do not send approval_mode here
        },
      },
      {
        id: 'shape:transport_url',
        body: {
          name: normalized.name,
          description: normalized.description,
          transport: transportMap[normalized.type] || 'STREAMABLE_HTTP',
          url: normalized.url,
          trusted: normalized.trusted,
          ...(normalized.secret_id ? { secret: { type: 'workspace_secret', secret_id: normalized.secret_id } } : {}),
          ...(headersArray.length ? { headers: headersArray } : {}),
        },
      },
      {
        id: 'shape:config_object',
        body: {
          config: {
            name: normalized.name,
            description: normalized.description,
            url: normalized.url,
            transport: transportMap[normalized.type] || 'STREAMABLE_HTTP',
            ...(normalized.approval_mode ? { approval_policy: approvalMap[normalized.approval_mode] || undefined } : {}),
            ...(normalized.secret_id ? { secret_token: { secret_id: normalized.secret_id } } : {}),
            ...(Object.keys(headersObject).length ? { request_headers: headersObject } : {}),
          },
        },
      },
    ];

    let succeeded = null;
    const attempts = [];
    for (const candidate of candidatePayloads) {
      try {
        console.log(`[DEBUG] Trying ElevenLabs payload ${candidate.id}:`, JSON.stringify(candidate.body));
        const resp = await fetch('https://api.elevenlabs.io/v1/convai/mcp-servers', {
          method: 'POST',
          headers,
          body: JSON.stringify(candidate.body),
        });
        const text = await resp.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        console.log(`[DEBUG] Response for ${candidate.id}: status=${resp.status}`, data);
        
        attempts.push({ id: candidate.id, status: resp.status, body: data });
        if (resp.ok) {
          succeeded = { status: resp.status, data };
          break;
        }
        
        if (resp.status >= 500) {
          // server-side error; no point in trying other shapes
          break;
        }
      } catch (err) {
        console.warn(`[DEBUG] Error while trying payload ${candidate.id}:`, err);
        attempts.push({ id: candidate.id, error: String(err) });
      }
    }

    if (!succeeded) {
      console.error('[DEBUG] All payload shapes failed. Attempts summary:', attempts);
      return res.status(422).json({ success: false, error: attempts });
    }

    // Successfully created on ElevenLabs, now save minimal metadata locally
    try {
      const { id: mcp_server_id, name, description } = succeeded.data || {};
      if (mcp_server_id) {
        const insert = `
          INSERT INTO mcp_servers (mcp_server_id, name, description, server_type, url, secret_id, headers, approval_mode, trusted)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            name = VALUES(name), 
            description = VALUES(description), 
            server_type = VALUES(server_type),
            url = VALUES(url),
            secret_id = VALUES(secret_id),
            headers = VALUES(headers),
            approval_mode = VALUES(approval_mode),
            trusted = VALUES(trusted),
            updated_at = CURRENT_TIMESTAMP
        `;
        
        const headersJson = headersArray.length ? JSON.stringify(headersArray) : null;
        db.query(insert, [
          mcp_server_id, 
          name || normalized.name || null, 
          description || normalized.description || null,
          normalized.type || null,
          normalized.url || null,
          normalized.secret_id,
          headersJson,
          normalized.approval_mode || 'always',
          normalized.trusted
        ], (dbErr) => {
          if (dbErr) {
            console.error('[DEBUG] Failed to upsert MCP server locally:', dbErr);
          } else {
            console.log('[DEBUG] MCP server metadata saved locally successfully');
          }
        });
      }
    } catch (dbErr) {
      console.warn('[DEBUG] Failed to upsert MCP server locally:', dbErr);
    }

    console.log('[DEBUG] MCP server created successfully on ElevenLabs and locally');
    res.status(201).json({ success: true, data: succeeded.data });
  } catch (err) {
    console.error('[DEBUG] Error in MCP server creation endpoint:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

// POST /api/elevenlabs/secrets - Create a new secret
app.post('/api/elevenlabs/secrets', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const { name, value } = req.body;
    console.log('Creating secret with:', { name, value: value ? '[HIDDEN]' : 'undefined' });
    
    if (!name || !value) {
      return res.status(400).json({ error: 'Name and value are required' });
    }

    const requestBody = { name, value, type: 'new' };
    console.log('Request body:', { name, value: '[HIDDEN]', type: 'new' });

    // Try different possible endpoints
    const endpoints = [
      'https://api.elevenlabs.io/v1/convai/secrets',
      'https://api.elevenlabs.io/v1/secrets',
      'https://api.elevenlabs.io/v1/workspace/secrets'
    ];

    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log(`Endpoint ${endpoint} response status:`, response.status);
        
        if (response.ok) {
          console.log(`Success with endpoint: ${endpoint}`);
          break;
        } else {
          const errorText = await response.text();
          console.log(`Endpoint ${endpoint} failed:`, response.status, errorText);
          lastError = { status: response.status, text: errorText };
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} error:`, error.message);
        lastError = { error: error.message };
      }
    }

    if (!response || !response.ok) {
      console.error('All endpoints failed. Last error:', lastError);
      return res.status(lastError?.status || 500).json({ 
        error: 'Failed to create secret in ElevenLabs', 
        details: lastError?.text || lastError?.error || 'All endpoints failed'
      });
    }

    console.log('ElevenLabs response status:', response.status);
    console.log('ElevenLabs response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs create secret API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to create secret in ElevenLabs', 
        details: errorText 
      });
    }

    const secret = await response.json();
    console.log('Successfully created secret:', secret);
    
    // Save secret to local database
    try {
      const insertQuery = `
        INSERT INTO workspace_secrets (secret_id, name, type, used_by) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        type = VALUES(type), 
        used_by = VALUES(used_by),
        updated_at = CURRENT_TIMESTAMP
      `;
      
      const usedByJson = secret.used_by ? JSON.stringify(secret.used_by) : null;
      
      db.query(insertQuery, [
        secret.secret_id || secret.id,
        secret.name,
        secret.type || 'new',
        usedByJson
      ], (dbErr, result) => {
        if (dbErr) {
          console.error('Failed to save secret to local database:', dbErr);
          // Still return success since ElevenLabs creation was successful
        } else {
          console.log('Secret saved to local database successfully');
        }
      });
    } catch (dbError) {
      console.error('Error saving secret to local database:', dbError);
      // Still return success since ElevenLabs creation was successful
    }
    
    res.json(secret);
  } catch (error) {
    console.error('Error creating secret:', error);
    res.status(500).json({ error: 'Failed to create secret', details: error.message });
  }
});

// DELETE /api/elevenlabs/secrets/:secret_id - Delete a secret
app.delete('/api/elevenlabs/secrets/:secret_id', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const { secret_id } = req.params;
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/secrets/${encodeURIComponent(secret_id)}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs delete secret API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to delete secret from ElevenLabs', 
        details: errorText 
      });
    }

    // Delete secret from local database
    try {
      const deleteQuery = 'DELETE FROM workspace_secrets WHERE secret_id = ?';
      db.query(deleteQuery, [secret_id], (dbErr, result) => {
        if (dbErr) {
          console.error('Failed to delete secret from local database:', dbErr);
          // Still return success since ElevenLabs deletion was successful
        } else {
          console.log('Secret deleted from local database successfully');
        }
      });
    } catch (dbError) {
      console.error('Error deleting secret from local database:', dbError);
      // Still return success since ElevenLabs deletion was successful
    }

    res.json({ success: true, message: 'Secret deleted successfully' });
  } catch (error) {
    console.error('Error deleting secret:', error);
    res.status(500).json({ error: 'Failed to delete secret', details: error.message });
  }
});

// PATCH /api/elevenlabs/secrets/:secret_id - Update a secret
app.patch('/api/elevenlabs/secrets/:secret_id', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const { secret_id } = req.params;
    const updateData = req.body;

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/secrets/${encodeURIComponent(secret_id)}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs update secret API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to update secret in ElevenLabs', 
        details: errorText 
      });
    }

    const secret = await response.json();
    res.json(secret);
  } catch (error) {
    console.error('Error updating secret:', error);
    res.status(500).json({ error: 'Failed to update secret', details: error.message });
  }
});

// Debug endpoint to check database schema
app.get('/api/debug/agent-knowledge-base-schema', (req, res) => {
  db.query('DESCRIBE agent_knowledge_base', (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    db.query('SELECT COUNT(*) as count FROM agent_knowledge_base', (countErr, countRows) => {
      if (countErr) {
        return res.status(500).json({ success: false, error: countErr.message });
      }
      
      res.json({
        success: true,
        schema: rows,
        recordCount: countRows[0].count
      });
    });
  });
});

// Debug endpoint to check if agent exists
app.get('/api/debug/agent/:agentId', (req, res) => {
  const agentId = req.params.agentId;
  
  db.query('SELECT agent_id, name FROM agents WHERE agent_id = ?', [agentId], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    res.json({
      success: true,
      agentExists: rows.length > 0,
      agent: rows[0] || null
    });
  });
});

// Cleanup endpoint to fix agent_knowledge_base table
app.post('/api/debug/fix-agent-knowledge-base-table', (req, res) => {
  console.log('[API] Starting agent_knowledge_base table cleanup...');
  
  // Disable foreign key checks
  db.query('SET FOREIGN_KEY_CHECKS = 0', (fkErr) => {
    if (fkErr) {
      console.error('[API] Failed to disable foreign key checks:', fkErr);
      return res.status(500).json({ success: false, error: fkErr.message });
    }
    
    console.log('[API] Disabled foreign key checks');
    
    // Drop the table completely
    db.query('DROP TABLE IF EXISTS agent_knowledge_base', (dropErr) => {
      if (dropErr) {
        console.error('[API] Failed to drop table:', dropErr);
        return res.status(500).json({ success: false, error: dropErr.message });
      }
      
      console.log('[API] Dropped agent_knowledge_base table');
      
      // Create the table with correct schema
      const createTableSQL = `
        CREATE TABLE agent_knowledge_base (
          id INT AUTO_INCREMENT PRIMARY KEY,
          agent_id VARCHAR(255) NOT NULL UNIQUE,
          knowledge_base_items JSON NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_agent_id (agent_id)
        ) ENGINE=InnoDB;
      `;
      
      db.query(createTableSQL, (createErr) => {
        if (createErr) {
          console.error('[API] Failed to create table:', createErr);
          return res.status(500).json({ success: false, error: createErr.message });
        }
        
        console.log('[API] Created agent_knowledge_base table with correct schema');
        
        // Re-enable foreign key checks
        db.query('SET FOREIGN_KEY_CHECKS = 1', (fkErr2) => {
          if (fkErr2) {
            console.error('[API] Failed to re-enable foreign key checks:', fkErr2);
          } else {
            console.log('[API] Re-enabled foreign key checks');
          }
          
          res.json({
            success: true,
            message: 'Agent knowledge base table has been fixed successfully'
          });
        });
      });
    });
  });
});

// Test email configuration endpoint
app.post("/api/test-email", async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ success: false, message: "Test email address is required" });
    }
    
    // Test email configuration
    const isConfigValid = await testEmailConfig();
    if (!isConfigValid) {
      return res.status(500).json({ success: false, message: "Email service configuration is invalid" });
    }
    
    // Send test email
    const testClientData = {
      companyName: 'Test Company',
      companyEmail: testEmail,
      contactPersonName: 'Test User',
      phoneNumber: '1234567890'
    };
    
    const emailResult = await sendEmail(testEmail, 'welcomeEmail', testClientData);
    
    res.json({ 
      success: true, 
      message: "Test email sent successfully",
      to: testEmail,
      messageId: emailResult.messageId
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ success: false, message: "Failed to send test email", error: error.message });
  }
});

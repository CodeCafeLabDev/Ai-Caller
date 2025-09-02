// backend/routes/elevenlabs.js
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const db = require('../config/database');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

// ElevenLabs Voices Proxy Endpoint
router.get('/voices', async (req, res) => {
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
router.post('/create-agent', authenticateJWT, async (req, res) => {
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

// ElevenLabs Get Agent Details Endpoint
router.get('/agent/:id', async (req, res) => {
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
router.patch('/agent/:id', async (req, res) => {
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
router.get('/agent/:id/settings', async (req, res) => {
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

router.patch('/agent/:id/settings', async (req, res) => {
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
router.get('/agent/:id/widget-config', async (req, res) => {
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

router.patch('/agent/:id/widget-config', async (req, res) => {
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
router.get('/agent/:id/voice', (req, res) => {
  res.status(200).json({ stub: true, message: 'Voice config endpoint not implemented in ElevenLabs API yet.' });
});

router.patch('/agent/:id/voice', (req, res) => {
  res.status(501).json({ error: 'Voice config update not implemented in ElevenLabs API yet.' });
});

// Security Config (stub)
router.get('/agent/:id/security', (req, res) => {
  res.status(200).json({ stub: true, message: 'Security config endpoint not implemented in ElevenLabs API yet.' });
});

router.patch('/agent/:id/security', (req, res) => {
  res.status(501).json({ error: 'Security config update not implemented in ElevenLabs API yet.' });
});

// Advanced Config (stub)
router.get('/agent/:id/advanced', (req, res) => {
  res.status(200).json({ stub: true, message: 'Advanced config endpoint not implemented in ElevenLabs API yet.' });
});

router.patch('/agent/:id/advanced', (req, res) => {
  res.status(501).json({ error: 'Advanced config update not implemented in ElevenLabs API yet.' });
});

// Analysis Config (stub)
router.get('/agent/:id/analysis', (req, res) => {
  res.status(200).json({ stub: true, message: 'Analysis config endpoint not implemented in ElevenLabs API yet.' });
});

router.patch('/agent/:id/analysis', (req, res) => {
  res.status(501).json({ error: 'Analysis config update not implemented in ElevenLabs API yet.' });
});

// ElevenLabs Get All Agents Endpoint
router.get('/agents', async (req, res) => {
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

// POST /api/elevenlabs/pronunciation-dictionary
router.post('/pronunciation-dictionary', (req, res) => {
  const { execFile } = require('child_process');
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

// PATCH proxy for ElevenLabs API (if not already present)
router.patch('/v1/convai/agents/:agentId', async (req, res) => {
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

// GET /api/elevenlabs/secrets - Get all workspace secrets
router.get('/secrets', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.warn('[GET /api/elevenlabs/secrets] No ELEVENLABS_API_KEY found');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    console.log('[GET /api/elevenlabs/secrets] Fetching secrets from ElevenLabs...');
    
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
        console.log(`[GET /api/elevenlabs/secrets] Trying GET endpoint: ${endpoint}`);
        response = await fetch(endpoint, {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        console.log(`[GET /api/elevenlabs/secrets] GET endpoint ${endpoint} response status:`, response.status);
        
        if (response.ok) {
          console.log(`[GET /api/elevenlabs/secrets] GET success with endpoint: ${endpoint}`);
          break;
        } else {
          const errorText = await response.text();
          console.log(`[GET /api/elevenlabs/secrets] GET endpoint ${endpoint} failed:`, response.status, errorText);
          lastError = { status: response.status, text: errorText };
        }
      } catch (error) {
        console.log(`[GET /api/elevenlabs/secrets] GET endpoint ${endpoint} error:`, error.message);
        lastError = { error: error.message };
      }
    }

    if (!response || !response.ok) {
      console.error('[GET /api/elevenlabs/secrets] All GET endpoints failed. Last error:', lastError);
      return res.status(lastError?.status || 500).json({ 
        error: 'Failed to fetch secrets from ElevenLabs', 
        details: lastError?.text || lastError?.error || 'All endpoints failed'
      });
    }

    console.log('[GET /api/elevenlabs/secrets] ElevenLabs secrets response status:', response.status);
    console.log('[GET /api/elevenlabs/secrets] ElevenLabs secrets response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GET /api/elevenlabs/secrets] ElevenLabs secrets API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch secrets from ElevenLabs', 
        details: errorText 
      });
    }

    const secrets = await response.json();
    console.log('[GET /api/elevenlabs/secrets] ElevenLabs secrets response:', JSON.stringify(secrets, null, 2));
    
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
            console.error('[GET /api/elevenlabs/secrets] Failed to sync secret to local database:', dbErr);
          }
        });
      }
      
      console.log('[GET /api/elevenlabs/secrets] Secrets synced with local database');
    } catch (dbError) {
      console.error('[GET /api/elevenlabs/secrets] Error syncing secrets with local database:', dbError);
    }
    
    res.json(secrets);
  } catch (error) {
    console.error('[GET /api/elevenlabs/secrets] Error fetching secrets:', error);
    res.status(500).json({ error: 'Failed to fetch secrets', details: error.message });
  }
});

// POST /api/elevenlabs/secrets - Create a new secret
router.post('/secrets', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const { name, value } = req.body;
    console.log('[POST /api/elevenlabs/secrets] Creating secret with:', { name, value: value ? '[HIDDEN]' : 'undefined' });
    
    if (!name || !value) {
      return res.status(400).json({ error: 'Name and value are required' });
    }

    const requestBody = { name, value, type: 'new' };
    console.log('[POST /api/elevenlabs/secrets] Request body:', { name, value: '[HIDDEN]', type: 'new' });

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
        console.log(`[POST /api/elevenlabs/secrets] Trying endpoint: ${endpoint}`);
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log(`[POST /api/elevenlabs/secrets] Endpoint ${endpoint} response status:`, response.status);
        
        if (response.ok) {
          console.log(`[POST /api/elevenlabs/secrets] Success with endpoint: ${endpoint}`);
          break;
        } else {
          const errorText = await response.text();
          console.log(`[POST /api/elevenlabs/secrets] Endpoint ${endpoint} failed:`, response.status, errorText);
          lastError = { status: response.status, text: errorText };
        }
      } catch (error) {
        console.log(`[POST /api/elevenlabs/secrets] Endpoint ${endpoint} error:`, error.message);
        lastError = { error: error.message };
      }
    }

    if (!response || !response.ok) {
      console.error('[POST /api/elevenlabs/secrets] All endpoints failed. Last error:', lastError);
      return res.status(lastError?.status || 500).json({ 
        error: 'Failed to create secret in ElevenLabs', 
        details: lastError?.text || lastError?.error || 'All endpoints failed'
      });
    }

    console.log('[POST /api/elevenlabs/secrets] ElevenLabs response status:', response.status);
    console.log('[POST /api/elevenlabs/secrets] ElevenLabs response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[POST /api/elevenlabs/secrets] ElevenLabs create secret API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to create secret in ElevenLabs', 
        details: errorText 
      });
    }

    const secret = await response.json();
    console.log('[POST /api/elevenlabs/secrets] Successfully created secret:', secret);
    
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
          console.error('[POST /api/elevenlabs/secrets] Failed to save secret to local database:', dbErr);
        } else {
          console.log('[POST /api/elevenlabs/secrets] Secret saved to local database');
        }
      });
    } catch (dbError) {
      console.error('[POST /api/elevenlabs/secrets] Error saving secret to local database:', dbError);
    }
    
    res.status(201).json(secret);
  } catch (error) {
    console.error('[POST /api/elevenlabs/secrets] Error creating secret:', error);
    res.status(500).json({ error: 'Failed to create secret', details: error.message });
  }
});

// DELETE /api/elevenlabs/secrets/:secret_id - Delete a secret
router.delete('/secrets/:secret_id', async (req, res) => {
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
      console.error('[DELETE /api/elevenlabs/secrets/:secret_id] ElevenLabs delete secret API error:', response.status, errorText);
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
          console.error('[DELETE /api/elevenlabs/secrets/:secret_id] Failed to delete secret from local database:', dbErr);
          // Still return success since ElevenLabs deletion was successful
        } else {
          console.log('[DELETE /api/elevenlabs/secrets/:secret_id] Secret deleted from local database successfully');
        }
      });
    } catch (dbError) {
      console.error('[DELETE /api/elevenlabs/secrets/:secret_id] Error deleting secret from local database:', dbError);
      // Still return success since ElevenLabs deletion was successful
    }

    res.json({ success: true, message: 'Secret deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/elevenlabs/secrets/:secret_id] Error deleting secret:', error);
    res.status(500).json({ error: 'Failed to delete secret', details: error.message });
  }
});

// PATCH /api/elevenlabs/secrets/:secret_id - Update a secret
router.patch('/secrets/:secret_id', async (req, res) => {
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
      console.error('[PATCH /api/elevenlabs/secrets/:secret_id] ElevenLabs update secret API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to update secret in ElevenLabs', 
        details: errorText 
      });
    }

    const secret = await response.json();
    res.json(secret);
  } catch (error) {
    console.error('[PATCH /api/elevenlabs/secrets/:secret_id] Error updating secret:', error);
    res.status(500).json({ error: 'Failed to update secret', details: error.message });
  }
});

// Knowledge Base Proxy Endpoints
// POST /api/elevenlabs/knowledge-base/url - Add URL to ElevenLabs knowledge base
router.post('/knowledge-base/url', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const { url, name } = req.body;
    if (!url || !name) {
      return res.status(400).json({ error: 'URL and name are required' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base/url', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, name }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to add URL to ElevenLabs', details: data });
    }

    res.json(data);
  } catch (error) {
    console.error('[POST /api/elevenlabs/knowledge-base/url] Error:', error);
    res.status(500).json({ error: 'Failed to add URL to knowledge base', details: error.message });
  }
});

// POST /api/elevenlabs/knowledge-base/text - Add text to ElevenLabs knowledge base
router.post('/knowledge-base/text', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const { name, text } = req.body;
    if (!name || !text) {
      return res.status(400).json({ error: 'Name and text are required' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base/text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, text }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to add text to ElevenLabs', details: data });
    }

    res.json(data);
  } catch (error) {
    console.error('[POST /api/elevenlabs/knowledge-base/text] Error:', error);
    res.status(500).json({ error: 'Failed to add text to knowledge base', details: error.message });
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /api/elevenlabs/knowledge-base/file - Add file to ElevenLabs knowledge base
router.post('/knowledge-base/file', upload.single('file'), async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Create multipart form data for ElevenLabs using axios
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);
    formData.append('name', name);

    const response = await axios.post('https://api.elevenlabs.io/v1/convai/knowledge-base/file', formData, {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data;
    if (response.status !== 200) {
      return res.status(response.status).json({ error: 'Failed to add file to ElevenLabs', details: data });
    }

    res.json(data);
  } catch (error) {
    console.error('[POST /api/elevenlabs/knowledge-base/file] Error:', error);
    res.status(500).json({ error: 'Failed to add file to knowledge base', details: error.message });
  }
});

// GET /api/elevenlabs/knowledge-base - Get knowledge base from ElevenLabs
router.get('/knowledge-base', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch knowledge base from ElevenLabs', details: data });
    }

    res.json(data);
  } catch (error) {
    console.error('[GET /api/elevenlabs/knowledge-base] Error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base', details: error.message });
  }
});

module.exports = router;

// backend/routes/agents.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

// GET /api/agents - return all agents from local DB with language name/code
router.get('/', authenticateJWT, (req, res) => {
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

// POST /api/agents/sync-from-elevenlabs - Sync agents from ElevenLabs to local DB
router.post('/sync-from-elevenlabs', authenticateJWT, async (req, res) => {
  try {
    console.log('[API] /api/agents/sync-from-elevenlabs - Starting sync...');
    
    // 1. Fetch all agents from ElevenLabs
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] /api/agents/sync-from-elevenlabs - ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({ 
        success: false, 
        message: 'Failed to fetch agents from ElevenLabs', 
        error: errorText 
      });
    }
    
    const elevenLabsAgents = await response.json();
    console.log(`[API] /api/agents/sync-from-elevenlabs - Found ${elevenLabsAgents.length} agents in ElevenLabs`);
    
    // 2. Get existing agents from local DB
    const localAgents = await new Promise((resolve, reject) => {
      db.query('SELECT agent_id FROM agents', (err, results) => {
        if (err) reject(err);
        else resolve(results.map(r => r.agent_id));
      });
    });
    
    console.log(`[API] /api/agents/sync-from-elevenlabs - Found ${localAgents.length} agents in local DB`);
    
    // 3. Sync each agent that doesn't exist locally
    let syncedCount = 0;
    let errors = [];
    
    for (const elevenLabsAgent of elevenLabsAgents) {
      if (!localAgents.includes(elevenLabsAgent.agent_id)) {
        try {
          // Fetch full agent details
          const agentDetailsRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${elevenLabsAgent.agent_id}`, {
            method: 'GET',
            headers,
          });
          
          if (!agentDetailsRes.ok) {
            console.warn(`[API] /api/agents/sync-from-elevenlabs - Failed to fetch details for agent ${elevenLabsAgent.agent_id}`);
            continue;
          }
          
          const agent = await agentDetailsRes.json();
          
          // Map language code to local language_id
          let languageId = null;
          const languageCode = agent.language || 'en';
          
          const languageResult = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM languages WHERE code = ? LIMIT 1', [languageCode], (err, rows) => {
              if (err) reject(err);
              else resolve(rows.length > 0 ? rows[0].id : null);
            });
          });
          
          languageId = languageResult;
          
          // Insert agent into local DB
          const insertValues = [
            agent.agent_id,
            null, // client_id - will be null for imported agents
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
            JSON.stringify(Array.isArray(agent.prompt?.mcp_server_ids) ? agent.prompt.mcp_server_ids : (agent.mcp_server_ids || [])),
            req.user.id,
            'Imported from ElevenLabs',
            'admin'
          ];
          
          await new Promise((resolve, reject) => {
            const insertSql = `
              INSERT INTO agents (
                agent_id, client_id, name, description, first_message, system_prompt, language_id, voice_id, model, tags, platform_settings, created_at, updated_at, language_code, additional_languages, custom_llm_url, custom_llm_model_id, custom_llm_api_key, custom_llm_headers, llm, temperature, mcp_server_ids, created_by, created_by_name, created_by_type
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(insertSql, insertValues, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          
          syncedCount++;
          console.log(`[API] /api/agents/sync-from-elevenlabs - Synced agent: ${agent.name} (${agent.agent_id})`);
          
        } catch (error) {
          console.error(`[API] /api/agents/sync-from-elevenlabs - Error syncing agent ${elevenLabsAgent.agent_id}:`, error);
          errors.push({ agent_id: elevenLabsAgent.agent_id, error: error.message });
        }
      }
    }
    
    console.log(`[API] /api/agents/sync-from-elevenlabs - Sync completed. Synced: ${syncedCount}, Errors: ${errors.length}`);
    
    res.json({ 
      success: true, 
      message: `Sync completed successfully`,
      synced_count: syncedCount,
      total_elevenlabs_agents: elevenLabsAgents.length,
      total_local_agents: localAgents.length,
      errors: errors
    });
    
  } catch (error) {
    console.error('[API] /api/agents/sync-from-elevenlabs - ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync agents from ElevenLabs', 
      error: error.message 
    });
  }
});

// GET /api/agents/:id/details - Get agent details from both local DB and ElevenLabs
router.get('/:id/details', async (req, res) => {
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
router.patch('/:id/details', async (req, res) => {
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
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.query('UPDATE agents SET status = ? WHERE agent_id = ?', [status, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true });
  });
});

// Test endpoint to verify the server is running with latest code
router.get('/test', (req, res) => {
  res.json({ message: 'Backend server is running with latest code', timestamp: new Date().toISOString() });
});

// Debug endpoint to test ElevenLabs API directly
router.get('/debug-elevenlabs/:agentId', async (req, res) => {
  const agentId = req.params.agentId;
  
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.json({ error: 'No ELEVENLABS_API_KEY found' });
    }
    
    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    
    console.log(`[DEBUG] Making direct ElevenLabs API call for agent: ${agentId}`);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'GET',
      headers,
    });
    
    console.log(`[DEBUG] ElevenLabs response status:`, response.status);
    
    if (response.ok) {
      const agentData = await response.json();
      
      // Extract all possible paths for criteria
      const criteriaPaths = {
        'platform_settings.evaluation': agentData.platform_settings?.evaluation,
        'evaluation.criteria': agentData.evaluation?.criteria,
        'conversation_config.agent.analysis_criteria': agentData.conversation_config?.agent?.analysis_criteria,
        'analysis_criteria': agentData.analysis_criteria,
        'conversation_config.analysis_criteria': agentData.conversation_config?.analysis_criteria,
      };
      
      // Extract all possible paths for data collection
      const dataCollectionPaths = {
        'platform_settings.data_collection': agentData.platform_settings?.data_collection,
        'conversation_config.agent.data_collection': agentData.conversation_config?.agent?.data_collection,
        'data_collection': agentData.data_collection,
        'conversation_config.data_collection': agentData.conversation_config?.data_collection,
        'evaluation.data_collection': agentData.evaluation?.data_collection,
      };
      
      res.json({
        success: true,
        agentId,
        criteriaPaths,
        dataCollectionPaths,
        fullAgentData: agentData,
        evaluationCriteriaLength: agentData.evaluation?.criteria?.length || 0,
        evaluationCriteriaIsArray: Array.isArray(agentData.evaluation?.criteria),
      });
    } else {
      const errorText = await response.text();
      res.json({
        success: false,
        error: `ElevenLabs API error: ${response.status}`,
        errorText
      });
    }
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/agents/:id/analysis - Get analysis criteria and data collection for an agent
router.get('/:id/analysis', async (req, res) => {
  const agentId = req.params.id;
  
  try {
    console.log(`[GET /api/agents/:id/analysis] Fetching analysis for agent: ${agentId}`);
    
    // 1. Fetch from local database
    const localData = await new Promise((resolve, reject) => {
      db.query(
        'SELECT name, prompt FROM agent_analysis_criteria WHERE agent_id = ?',
        [agentId],
        (err, criteriaRows) => {
          if (err) return reject(err);
          db.query(
            'SELECT data_type, identifier, description FROM agent_analysis_data_collection WHERE agent_id = ?',
            [agentId],
            (err2, dataRows) => {
              if (err2) return reject(err2);
              resolve({
                criteria: criteriaRows,
                data_collection: dataRows
              });
            }
          );
        }
      );
    });

    console.log(`[GET /api/agents/:id/analysis] Local data:`, localData);

    // 2. Fetch from ElevenLabs API
    let elevenLabsData = { criteria: [], data_collection: [] };
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        console.warn('[GET /api/agents/:id/analysis] No ELEVENLABS_API_KEY found');
      } else {
        console.log(`[GET /api/agents/:id/analysis] Using API key: ${apiKey.substring(0, 10)}...`);
        const headers = {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        };
        
        console.log(`[GET /api/agents/:id/analysis] Fetching from ElevenLabs: https://api.elevenlabs.io/v1/convai/agents/${agentId}`);
        console.log(`[GET /api/agents/:id/analysis] Making ElevenLabs API call...`);
        
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
          method: 'GET',
          headers,
        });
        
        console.log(`[GET /api/agents/:id/analysis] ElevenLabs API call completed`);
        
        console.log(`[GET /api/agents/:id/analysis] ElevenLabs response status:`, response.status);
        console.log(`[GET /api/agents/:id/analysis] ElevenLabs response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const agentData = await response.json();
          console.log(`[GET /api/agents/:id/analysis] ElevenLabs agent data structure:`, JSON.stringify(agentData, null, 2));
          console.log(`[GET /api/agents/:id/analysis] ElevenLabs evaluation.criteria:`, JSON.stringify(agentData.evaluation?.criteria, null, 2));
          console.log(`[GET /api/agents/:id/analysis] ElevenLabs evaluation.criteria length:`, agentData.evaluation?.criteria?.length || 0);
          console.log(`[GET /api/agents/:id/analysis] ElevenLabs evaluation.criteria is array:`, Array.isArray(agentData.evaluation?.criteria));
          
          // Extract analysis criteria from ElevenLabs agent data - prioritize evaluation.criteria
          let analysisCriteria = [];
          console.log(`[GET /api/agents/:id/analysis] Checking criteria paths:`);
          console.log(`- agentData.platform_settings?.evaluation:`, agentData.platform_settings?.evaluation);
          console.log(`- agentData.platform_settings?.evaluation?.criteria:`, agentData.platform_settings?.evaluation?.criteria);
          console.log(`- agentData.conversation_config?.agent?.analysis_criteria:`, agentData.conversation_config?.agent?.analysis_criteria);
          console.log(`- agentData.analysis_criteria:`, agentData.analysis_criteria);
          console.log(`- agentData.conversation_config?.analysis_criteria:`, agentData.conversation_config?.analysis_criteria);
          console.log(`- agentData.evaluation?.criteria:`, agentData.evaluation?.criteria);
          
          // Check multiple paths for evaluation criteria
          if (agentData.platform_settings?.evaluation?.criteria) {
            analysisCriteria = agentData.platform_settings.evaluation.criteria;
            console.log(`[GET /api/agents/:id/analysis] Using platform_settings.evaluation.criteria (found ${analysisCriteria.length} items)`);
          } else if (agentData.evaluation?.criteria) {
            analysisCriteria = agentData.evaluation.criteria;
            console.log(`[GET /api/agents/:id/analysis] Using evaluation.criteria (found ${analysisCriteria.length} items)`);
          } else if (agentData.conversation_config?.agent?.analysis_criteria) {
            analysisCriteria = agentData.conversation_config.agent.analysis_criteria;
            console.log(`[GET /api/agents/:id/analysis] Using conversation_config.agent.analysis_criteria`);
          } else if (agentData.analysis_criteria) {
            analysisCriteria = agentData.analysis_criteria;
            console.log(`[GET /api/agents/:id/analysis] Using analysis_criteria`);
          } else if (agentData.conversation_config?.analysis_criteria) {
            analysisCriteria = agentData.conversation_config.analysis_criteria;
            console.log(`[GET /api/agents/:id/analysis] Using conversation_config.analysis_criteria`);
          } else {
            console.log(`[GET /api/agents/:id/analysis] No criteria found in any path`);
          }
          
          console.log(`[GET /api/agents/:id/analysis] Found analysisCriteria:`, analysisCriteria);
          
          if (Array.isArray(analysisCriteria)) {
            console.log(`[GET /api/agents/:id/analysis] Starting to map ${analysisCriteria.length} criteria`);
            elevenLabsData.criteria = analysisCriteria.map((criterion, index) => {
              console.log(`[GET /api/agents/:id/analysis] Processing criterion ${index}:`, JSON.stringify(criterion, null, 2));
              
              const mappedCriterion = {
                name: criterion.name || criterion.title || `Criterion ${index + 1}`,
                prompt: criterion.prompt || criterion.description || criterion.text || criterion.conversation_goal_prompt || ''
              };
              
              console.log(`[GET /api/agents/:id/analysis] Mapped criterion ${index}:`, {
                original: criterion,
                mapped: mappedCriterion
              });
              
              return mappedCriterion;
            });
            console.log(`[GET /api/agents/:id/analysis] Final mapped criteria:`, elevenLabsData.criteria);
            console.log(`[GET /api/agents/:id/analysis] Length of mapped criteria:`, elevenLabsData.criteria.length);
            console.log(`[GET /api/agents/:id/analysis] Mapped criteria names:`, elevenLabsData.criteria.map(c => c.name));
          }
          
          // Extract data collection from ElevenLabs agent data - prioritize platform_settings.data_collection
          let dataCollection = [];
          console.log(`[GET /api/agents/:id/analysis] Checking data collection paths:`);
          console.log(`- agentData.conversation_config?.agent?.data_collection:`, agentData.conversation_config?.agent?.data_collection);
          console.log(`- agentData.data_collection:`, agentData.data_collection);
          console.log(`- agentData.conversation_config?.data_collection:`, agentData.conversation_config?.data_collection);
          console.log(`- agentData.evaluation?.data_collection:`, agentData.evaluation?.data_collection);
          console.log(`- agentData.platform_settings?.data_collection:`, agentData.platform_settings?.data_collection);
          
          // Use platform_settings.data_collection as it's the actual ElevenLabs structure
          if (agentData.platform_settings?.data_collection) {
            // Handle the actual ElevenLabs structure for data collection
            const platformDataCollection = agentData.platform_settings.data_collection;
            // Convert object format to array format
            dataCollection = Object.keys(platformDataCollection).map(key => ({
              identifier: key,
              data_type: platformDataCollection[key].type,
              description: platformDataCollection[key].description
            }));
            console.log(`[GET /api/agents/:id/analysis] Using platform_settings.data_collection (found ${dataCollection.length} items)`);
          } else {
            console.log(`[GET /api/agents/:id/analysis] No platform_settings.data_collection found, checking other paths...`);
            if (agentData.conversation_config?.agent?.data_collection) {
              dataCollection = agentData.conversation_config.agent.data_collection;
              console.log(`[GET /api/agents/:id/analysis] Using conversation_config.agent.data_collection`);
            } else if (agentData.data_collection) {
              dataCollection = agentData.data_collection;
              console.log(`[GET /api/agents/:id/analysis] Using data_collection`);
            } else if (agentData.conversation_config?.data_collection) {
              dataCollection = agentData.conversation_config.data_collection;
              console.log(`[GET /api/agents/:id/analysis] Using conversation_config.data_collection`);
            } else if (agentData.evaluation?.data_collection) {
              dataCollection = agentData.evaluation.data_collection;
              console.log(`[GET /api/agents/:id/analysis] Using evaluation.data_collection`);
            }
          }
          
          if (Array.isArray(dataCollection)) {
            elevenLabsData.data_collection = dataCollection.map((item, index) => ({
              identifier: item.identifier || item.id || `item_${index + 1}`,
              data_type: item.data_type || item.type || 'text',
              description: item.description || item.name || ''
            }));
          }
          
          console.log(`[GET /api/agents/:id/analysis] Extracted ElevenLabs data:`, elevenLabsData);
        } else {
          const errorText = await response.text();
          console.warn(`[GET /api/agents/:id/analysis] ElevenLabs API error:`, response.status, errorText);
        }
      }
    } catch (elevenLabsError) {
      console.warn(`[GET /api/agents/:id/analysis] Failed to fetch from ElevenLabs:`, elevenLabsError);
    }

    // 3. Merge data (ElevenLabs data takes full precedence)
    let mergedCriteria = [];
    let mergedDataCollection = [];
    
    console.log(`[GET /api/agents/:id/analysis] Starting merge process:`);
    console.log(`- Local criteria count:`, localData.criteria.length);
    console.log(`- Local data_collection count:`, localData.data_collection.length);
    console.log(`- ElevenLabs criteria count:`, elevenLabsData.criteria.length);
    console.log(`- ElevenLabs data_collection count:`, elevenLabsData.data_collection.length);
    console.log(`- ElevenLabs criteria details:`, elevenLabsData.criteria.map(c => ({ name: c.name, prompt: c.prompt?.substring(0, 50) + '...' })));
    
    // Start with ElevenLabs data (takes precedence)
    mergedCriteria = [...elevenLabsData.criteria];
    mergedDataCollection = [...elevenLabsData.data_collection];
    
    console.log(`[GET /api/agents/:id/analysis] After copying ElevenLabs data:`);
    console.log(`- Merged criteria count:`, mergedCriteria.length);
    console.log(`- Merged data_collection count:`, mergedDataCollection.length);
    console.log(`- Merged criteria details:`, mergedCriteria.map(c => ({ name: c.name, prompt: c.prompt?.substring(0, 50) + '...' })));
    
    // Add local data that doesn't exist in ElevenLabs
    localData.criteria.forEach(localCriterion => {
      const exists = mergedCriteria.some(elevenCriterion => elevenCriterion.name === localCriterion.name);
      if (!exists) {
        mergedCriteria.push(localCriterion);
        console.log(`[GET /api/agents/:id/analysis] Added local criterion:`, localCriterion.name);
      } else {
        console.log(`[GET /api/agents/:id/analysis] Skipped duplicate local criterion:`, localCriterion.name);
      }
    });
    
    localData.data_collection.forEach(localItem => {
      const exists = mergedDataCollection.some(elevenItem => elevenItem.identifier === localItem.identifier);
      if (!exists) {
        mergedDataCollection.push(localItem);
        console.log(`[GET /api/agents/:id/analysis] Added local data item:`, localItem.identifier);
      } else {
        console.log(`[GET /api/agents/:id/analysis] Skipped duplicate local data item:`, localItem.identifier);
      }
    });

    console.log(`[GET /api/agents/:id/analysis] Final merged data:`, {
      criteria: mergedCriteria,
      data_collection: mergedDataCollection
    });
    console.log(`[GET /api/agents/:id/analysis] Final response criteria count:`, mergedCriteria.length);
    console.log(`[GET /api/agents/:id/analysis] Final response criteria names:`, mergedCriteria.map(c => c.name));

    const response = {
      criteria: mergedCriteria,
      data_collection: mergedDataCollection,
      source: 'merged',
      local_count: localData.criteria.length + localData.data_collection.length,
      elevenlabs_count: elevenLabsData.criteria.length + elevenLabsData.data_collection.length,
      merged_count: mergedCriteria.length + mergedDataCollection.length,
      debug: {
        elevenlabs_criteria_count: elevenLabsData.criteria.length,
        elevenlabs_criteria_names: elevenLabsData.criteria.map(c => c.name),
        merged_criteria_count: mergedCriteria.length,
        merged_criteria_names: mergedCriteria.map(c => c.name),
        local_criteria_count: localData.criteria.length,
        local_criteria_names: localData.criteria.map(c => c.name)
      }
    };
    
    console.log(`[GET /api/agents/:id/analysis] Sending response with criteria count:`, response.criteria.length);
    res.json(response);
    
  } catch (error) {
    console.error('[GET /api/agents/:id/analysis] Error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis data' });
  }
});

// POST /api/agents/:id/analysis - Save analysis criteria and data collection for an agent
router.post('/:id/analysis', async (req, res) => {
  const agentId = req.params.id;
  const { criteria, data_collection } = req.body;

  try {
    console.log(`[POST /api/agents/:id/analysis] Saving analysis for agent: ${agentId}`, { criteria, data_collection });
    
    // 1. Save to local database
    if (Array.isArray(criteria)) {
      const seen = new Set();
      for (const c of criteria) {
        if (seen.has(c.name)) continue;
        seen.add(c.name);
        await new Promise((resolve, reject) => {
          db.query(
            `INSERT INTO agent_analysis_criteria (agent_id, name, prompt) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE prompt = VALUES(prompt)`,
            [agentId, c.name, c.prompt],
            (err, result) => {
              if (err) {
                console.error('[POST /api/agents/:id/analysis] Error inserting criteria:', err, c);
                reject(err);
              } else {
                resolve(result);
              }
            }
          );
        });
      }
    }
    
    if (Array.isArray(data_collection)) {
      const seen = new Set();
      for (const d of data_collection) {
        if (seen.has(d.identifier)) continue;
        seen.add(d.identifier);
        await new Promise((resolve, reject) => {
          db.query(
            `INSERT INTO agent_analysis_data_collection (agent_id, identifier, data_type, description) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE data_type = VALUES(data_type), description = VALUES(description)`,
            [agentId, d.identifier, d.type || d.data_type, d.description],
            (err, result) => {
              if (err) {
                console.error('[POST /api/agents/:id/analysis] Error inserting data_collection:', err, d);
                reject(err);
              } else {
                resolve(result);
              }
            }
          );
        });
      }
    }

    // 2. Update ElevenLabs API (optional - don't fail if this doesn't work)
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (apiKey) {
        const headers = {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        };
        
        // Prepare analysis data for ElevenLabs
        const analysisData = {
          evaluation: {
            criteria: criteria?.map(c => ({
              id: c.name?.toLowerCase().replace(/\s+/g, '_') || `criterion_${Date.now()}`,
              name: c.name,
              type: "prompt",
              conversation_goal_prompt: c.prompt,
              use_knowledge_base: false
            })) || []
          },
          platform_settings: {
            data_collection: data_collection?.reduce((acc, d) => {
              acc[d.identifier] = {
                type: d.type || d.data_type,
                description: d.description,
                dynamic_variable: '',
                constant_value: ''
              };
              return acc;
            }, {}) || {}
          }
        };
        
        console.log(`[POST /api/agents/:id/analysis] Updating ElevenLabs with data:`, analysisData);
        
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(analysisData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[POST /api/agents/:id/analysis] Failed to update ElevenLabs:`, response.status, errorText);
        } else {
          console.log(`[POST /api/agents/:id/analysis] Successfully updated ElevenLabs`);
        }
      } else {
        console.warn(`[POST /api/agents/:id/analysis] No ELEVENLABS_API_KEY found, skipping ElevenLabs update`);
      }
    } catch (elevenLabsError) {
      console.warn(`[POST /api/agents/:id/analysis] Failed to update ElevenLabs:`, elevenLabsError);
      // Don't fail the entire request if ElevenLabs update fails
    }

    console.log(`[POST /api/agents/:id/analysis] Successfully saved analysis data`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('[POST /api/agents/:id/analysis] Error:', error);
    res.status(500).json({ error: 'Failed to save analysis data' });
  }
});

// Duplicate agent in local DB and ElevenLabs
router.post('/:agentId/duplicate', authenticateJWT, async (req, res) => {
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
router.delete('/:agentId', authenticateJWT, async (req, res) => {
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
router.post('/:agentId/knowledge-base-db', async (req, res) => {
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
router.get('/:agentId/knowledge-base-db', async (req, res) => {
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

// --- Analysis Criteria/Data Item DELETE Endpoints ---
router.delete('/:agentId/analysis/criteria', (req, res) => {
  const { agentId } = req.params;
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing criteria name' });
  db.query('DELETE FROM agent_analysis_criteria WHERE agent_id = ? AND name = ?', [agentId, name], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Criteria not found' });
    res.json({ success: true });
  });
});

router.delete('/:agentId/analysis/data-item', (req, res) => {
  const { agentId } = req.params;
  const { identifier } = req.query;
  if (!identifier) return res.status(400).json({ error: 'Missing data item identifier' });
  db.query('DELETE FROM agent_analysis_data_collection WHERE agent_id = ? AND identifier = ?', [agentId, identifier], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Data item not found' });
    res.json({ success: true });
  });
});

module.exports = router;

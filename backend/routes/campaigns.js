// backend/routes/campaigns.js
const express = require('express');
const router = express.Router();
const { config } = require('../config/urls');
const multer = require('multer');
const XLSX = require('xlsx');
const db = require('../config/database');

const upload = multer({ storage: multer.memoryStorage() });

function elevenHeaders() {
  const key = process.env.ELEVENLABS_API_KEY;
  return {
    'Content-Type': 'application/json',
    'xi-api-key': key || ''
  };
}

// Phone numbers list (workspace)
router.get('/phone-numbers', async (_req, res) => {
  try {
    const response = await fetch(`${config.elevenlabs.base}/convai/phone-numbers`, {
      headers: elevenHeaders()
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch phone numbers', details: e.message });
  }
});

// Phone number details
router.get('/phone-numbers/:phone_number_id', async (req, res) => {
  try {
    const response = await fetch(`${config.elevenlabs.base}/convai/phone-numbers/${encodeURIComponent(req.params.phone_number_id)}`, {
      headers: elevenHeaders()
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch phone number details', details: e.message });
  }
});

// DB agents by client - return ElevenLabs agent IDs
router.get('/agents', async (req, res) => {
  try {
    const clientId = req.query.client_id;
    // Select agent_id (ElevenLabs ID) instead of local id
    const sql = clientId ? 'SELECT agent_id as id, name, client_id FROM agents WHERE client_id = ?' : 'SELECT agent_id as id, name, client_id FROM agents';
    db.query(sql, clientId ? [clientId] : [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch agents', details: err.message });
      res.json({ agents: rows });
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch agents', details: e.message });
  }
});

// Create (submit) a new campaign (batch calling)
router.post('/', upload.single('sheet'), async (req, res) => {
  try {
    console.log('[POST /api/campaigns] Request body:', req.body);
    console.log('[POST /api/campaigns] File uploaded:', !!req.file);
    const isMultipart = !!req.file;
    let body = req.body || {};
    let recipients = [];
    const agentId = body.agent_id;
    const phoneNumberId = body.phone_number_id;

    if (isMultipart && req.file) {
      // Parse CSV/XLSX buffer to extract phone numbers in ElevenLabs format
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      console.log('[POST /api/campaigns] CSV parsing debug:');
      console.log('  - Total rows:', rows.length);
      console.log('  - Header row:', rows[0]);
      console.log('  - First data row:', rows[1]);
      console.log('  - All rows:', rows);
      
      // ElevenLabs format: phone_number, language, voice_id, first_message, prompt, city, other_dyn_variable
      // Look for phone_number column (first column)
      const headerRow = rows[0] || [];
      const phoneColumnIndex = headerRow.findIndex(h => 
        h && h.toString().toLowerCase().includes('phone_number')
      );
      
      console.log('  - Phone column index:', phoneColumnIndex);
      console.log('  - Header row contents:', headerRow);
      
      if (phoneColumnIndex >= 0) {
        recipients = rows
          .slice(1) // Skip header row
          .map(r => {
            const phone = Array.isArray(r) ? String(r[phoneColumnIndex] || '').trim() : '';
            console.log('  - Raw phone from CSV:', phone);
            // Clean phone number: remove spaces, dashes, parentheses, keep only digits and +
            const cleaned = phone.replace(/[\s\-\(\)]/g, '');
            console.log('  - Cleaned phone:', cleaned);
            return cleaned;
          })
          .filter(v => v && v.length >= 8 && /^\+?[0-9]+$/.test(v)); // Reduced minimum length to 8
        console.log('  - Using phone_number column, recipients:', recipients);
      } else {
        // Fallback: use first column if no phone column found
        recipients = rows
          .slice(1) // Skip header row
          .map(r => {
            const phone = Array.isArray(r) ? String(r[0] || '').trim() : '';
            console.log('  - Raw phone from CSV (fallback):', phone);
            // Clean phone number: remove spaces, dashes, parentheses, keep only digits and +
            const cleaned = phone.replace(/[\s\-\(\)]/g, '');
            console.log('  - Cleaned phone (fallback):', cleaned);
            return cleaned;
          })
          .filter(v => v && v.length >= 8 && /^\+?[0-9]+$/.test(v)); // Reduced minimum length to 8
        console.log('  - Using first column fallback, recipients:', recipients);
      }
      body = {
        call_name: body.name,
        agent_id: agentId,
        agent_phone_number_id: phoneNumberId,
        scheduled_time_unix: body.scheduled_time_unix ? Number(body.scheduled_time_unix) : null,
        recipients: recipients.map(phone => ({ phone_number: phone }))
      };
      
      console.log('[POST /api/campaigns] Final recipients array:', recipients);
      console.log('[POST /api/campaigns] Final recipients objects:', recipients.map(phone => ({ phone_number: phone })));
    }

    console.log('[POST /api/campaigns] Final body before ElevenLabs:', body);
    
    // Guard: ElevenLabs requires recipients; if none provided, return 422
    if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
      console.log('[POST /api/campaigns] No recipients found, returning 422');
      return res.status(422).json({ error: 'No recipients provided. Please upload a CSV/XLSX with a phone_number column.' });
    }

    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/submit`, {
      method: 'POST',
      headers: elevenHeaders(),
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'ElevenLabs submit failed', details: data });
    }

    // Best-effort DB sync
    try {
      const name = body.call_name || data.name || 'Campaign';
      const clientName = req.body.client_name || 'Workspace'; // Get from form data
      const agentName = req.body.agent_name || 'Unknown Agent'; // Get from form data
      const type = req.body.type || 'Outbound'; // Get campaign type from form data
      const callsTargeted = Number(data.total_calls_scheduled || data.total_calls || 0);
      const startDate = body.scheduled_time_unix ? new Date(Number(body.scheduled_time_unix) * 1000) : (body.start_date || null);
      const endDate = null;
      const externalId = data.id || data.batch_id || null;
      
      console.log('[POST /api/campaigns] Attempting DB insert with:', {
        externalId, name, clientName, agentName, type, callsTargeted, startDate, endDate
      });
      
      console.log('[POST /api/campaigns] Raw req.body:', req.body);
      console.log('[POST /api/campaigns] Form data client_name:', req.body.client_name);
      console.log('[POST /api/campaigns] Form data agent_name:', req.body.agent_name);
      console.log('[POST /api/campaigns] Form data type:', req.body.type);
      
      db.query(
        `INSERT INTO campaigns (external_id, name, clientName, agentName, type, callsTargeted, startDate, endDate, status, successRate) VALUES (?,?,?,?,?,?,?,?, 'Active', 0.00)`,
        [externalId, name, clientName, agentName, type, callsTargeted, startDate, endDate],
        (dbErr, result) => {
          if (dbErr) {
            console.error('[POST /api/campaigns] Database insert failed:', dbErr);
            console.error('[POST /api/campaigns] SQL Error details:', {
              code: dbErr.code,
              errno: dbErr.errno,
              sqlState: dbErr.sqlState,
              sqlMessage: dbErr.sqlMessage
            });
          } else {
            console.log('[POST /api/campaigns] Database insert successful:', result);
            console.log('[POST /api/campaigns] Inserted campaign ID:', result.insertId);
          }
        }
      );
    } catch (dbErr) {
      console.error('[POST /api/campaigns] Database sync failed:', dbErr.message);
    }

    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Campaign submit failed', details: e.message });
  }
});

// Get flagged calls (for admin review) - must be before /:id routes
router.get('/flagged-calls', async (req, res) => {
  try {
    console.log('[GET /api/campaigns/flagged-calls] Fetching flagged calls...');
    
    // In a real application, you would fetch from database
    // For now, return empty array
    const flaggedCalls = [];
    
    res.json({
      success: true,
      data: {
        flaggedCalls,
        total: flaggedCalls.length
      }
    });
    
  } catch (error) {
    console.error('[GET /api/campaigns/flagged-calls] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flagged calls',
      details: error.message
    });
  }
});

// Get live calls data for monitoring (must be before /:id routes)
router.get('/live-calls', async (req, res) => {
  try {
    console.log('[GET /api/campaigns/live-calls] Fetching live calls data...');
    
    // Get all active campaigns from ElevenLabs
    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/workspace`, {
      headers: elevenHeaders()
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: 'Failed to fetch campaigns from ElevenLabs', 
        details: await response.text() 
      });
    }
    
    const data = await response.json();
    console.log('[GET /api/campaigns/live-calls] ElevenLabs response:', JSON.stringify(data, null, 2));
    
    // Process batch calls to extract live call data
    const batchCalls = data.batch_calls || data.items || [];
    const liveCalls = [];
    const logs = [];
    
    // Get detailed data for each active campaign
    for (const batch of batchCalls) {
      if (batch.status === 'in_progress' || batch.status === 'pending') {
        try {
          // Get detailed campaign data including recipients/calls
          const detailResponse = await fetch(`${config.elevenlabs.base}/convai/batch-calling/${batch.id}`, {
            headers: elevenHeaders()
          });
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            console.log(`[GET /api/campaigns/live-calls] Campaign ${batch.id} details:`, JSON.stringify(detailData, null, 2));
            
            // Extract calls/recipients from the detailed data
            const calls = detailData.recipients || detailData.calls || detailData.call_recipients || [];
            
            calls.forEach((call, index) => {
              // Map ElevenLabs call data to our LiveCall format
              const liveCall = {
                id: call.id || `${batch.id}_${index}`,
                callerId: call.phone_number || call.phone || call.number || 'Unknown',
                campaignName: batch.name || 'Campaign',
                clientName: 'Workspace', // Will be updated from local DB if available
                status: mapElevenLabsStatus(call.status),
                durationSeconds: calculateDuration(call.created_at_unix, call.updated_at_unix),
                agent: batch.agent_name || 'AI Agent',
                transcriptionSnippet: extractTranscriptionSnippet(call),
                campaignId: batch.id,
                createdAt: call.created_at_unix ? new Date(call.created_at_unix * 1000) : new Date(),
                updatedAt: call.updated_at_unix ? new Date(call.updated_at_unix * 1000) : new Date(),
                // Additional fields for better monitoring
                conversationId: call.conversation_id,
                phoneProvider: batch.phone_provider || 'Unknown',
                totalCallsScheduled: batch.total_calls_scheduled || 0,
                totalCallsDispatched: batch.total_calls_dispatched || 0
              };
              
              liveCalls.push(liveCall);
            });
            
            // Generate logs for this campaign
            logs.push({
              id: `log_${batch.id}_${Date.now()}`,
              timestamp: new Date(),
              message: `Campaign '${batch.name}' is ${batch.status} with ${calls.length} calls`,
              type: 'info'
            });
            
            // Add individual call logs for active calls
            calls.forEach((call, index) => {
              if (call.status === 'in_progress' || call.status === 'pending') {
                logs.push({
                  id: `log_${batch.id}_${call.id}_${Date.now()}`,
                  timestamp: new Date(),
                  message: `Call to ${call.phone_number || 'Unknown'} is ${call.status}`,
                  type: 'info'
                });
              }
            });
          }
        } catch (error) {
          console.error(`[GET /api/campaigns/live-calls] Error fetching details for ${batch.id}:`, error.message);
        }
      }
    }
    
    // Calculate metrics
    const totalLiveCalls = liveCalls.filter(call => 
      ['Dialing', 'Answered', 'In Progress'].includes(call.status)
    ).length;
    
    const activeAgents = new Set(
      liveCalls
        .filter(call => call.agent && ['Answered', 'In Progress'].includes(call.status))
        .map(call => call.agent)
    ).size;
    
    const avgResponseTime = calculateAverageResponseTime(liveCalls);
    
    res.json({
      success: true,
      data: {
        liveCalls,
        logs,
        metrics: {
          totalLiveCalls,
          activeAgents,
          avgResponseTime
        }
      }
    });
    
  } catch (error) {
    console.error('[GET /api/campaigns/live-calls] Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch live calls data', 
      details: error.message 
    });
  }
});

// Get campaign details from ElevenLabs batch calling API
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[GET /api/campaigns/${id}] Fetching batch call details for campaign:`, id);
    
    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/${id}`, {
      headers: elevenHeaders()
    });
    const data = await response.json();
    
    console.log(`[GET /api/campaigns/${id}] ElevenLabs batch call response status:`, response.status);
    console.log(`[GET /api/campaigns/${id}] ElevenLabs batch call response data:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch campaign details', details: data });
    }
    
    res.json(data);
  } catch (error) {
    console.error(`[GET /api/campaigns/${id}] Error:`, error.message);
    res.status(500).json({ error: 'Failed to fetch campaign details', details: error.message });
  }
});

// Get campaign recipients from ElevenLabs batch calling API
router.get('/:id/recipients', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[GET /api/campaigns/${id}/recipients] Fetching batch call info for campaign:`, id);
    
    // Use the correct ElevenLabs batch calling API endpoint
    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/${id}`, {
      headers: elevenHeaders()
    });
    const data = await response.json();
    
    console.log(`[GET /api/campaigns/${id}/recipients] ElevenLabs batch call response status:`, response.status);
    console.log(`[GET /api/campaigns/${id}/recipients] ElevenLabs batch call response data:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch batch call info', details: data });
    }
    
    // Extract recipients from the batch call response
    let recipients = [];
    
    // Check different possible structures for recipients in the batch call response
    if (data.recipients && Array.isArray(data.recipients)) {
      recipients = data.recipients;
      console.log(`[GET /api/campaigns/${id}/recipients] Found recipients in data.recipients:`, recipients.length);
    } else if (data.calls && Array.isArray(data.calls)) {
      recipients = data.calls;
      console.log(`[GET /api/campaigns/${id}/recipients] Found recipients in data.calls:`, recipients.length);
    } else if (data.call_recipients && Array.isArray(data.call_recipients)) {
      recipients = data.call_recipients;
      console.log(`[GET /api/campaigns/${id}/recipients] Found recipients in data.call_recipients:`, recipients.length);
    } else if (data.batch_calls && Array.isArray(data.batch_calls)) {
      // If it's a list of batch calls, get the first one
      const batchCall = data.batch_calls.find(bc => bc.id === id || bc.batch_id === id);
      if (batchCall) {
        recipients = batchCall.recipients || batchCall.calls || [];
        console.log(`[GET /api/campaigns/${id}/recipients] Found recipients in batch_calls:`, recipients.length);
      }
    } else {
      console.log(`[GET /api/campaigns/${id}/recipients] No recipients found in response structure`);
      console.log(`[GET /api/campaigns/${id}/recipients] Available keys in response:`, Object.keys(data));
    }
    
    console.log(`[GET /api/campaigns/${id}/recipients] Final extracted recipients:`, recipients.length);
    if (recipients.length > 0) {
      console.log(`[GET /api/campaigns/${id}/recipients] Sample recipient:`, JSON.stringify(recipients[0], null, 2));
    }
    
    res.json(recipients);
  } catch (error) {
    console.error(`[GET /api/campaigns/${id}/recipients] Error:`, error.message);
    res.status(500).json({ error: 'Failed to fetch recipients', details: error.message });
  }
});

// Get campaign details from local database
router.get('/:id/local', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[GET /api/campaigns/${id}/local] Fetching local campaign data for ID:`, id);
    
    // First try to find by external_id (ElevenLabs ID)
    db.query('SELECT * FROM campaigns WHERE external_id = ?', [id], (err, rows) => {
      if (err) {
        console.error(`[GET /api/campaigns/${id}/local] Database query failed:`, err.message);
        return res.status(500).json({ success: false, error: 'Database query failed', details: err.message });
      }
      
      console.log(`[GET /api/campaigns/${id}/local] Query by external_id result:`, rows.length, 'rows');
      if (rows.length > 0) {
        console.log(`[GET /api/campaigns/${id}/local] Found campaign by external_id:`, rows[0]);
        return res.json({ success: true, data: rows[0] });
      }
      
      // If not found by external_id, try by local ID
      console.log(`[GET /api/campaigns/${id}/local] Trying by local ID...`);
      db.query('SELECT * FROM campaigns WHERE id = ?', [id], (err2, rows2) => {
        if (err2) {
          console.error(`[GET /api/campaigns/${id}/local] Database query by ID failed:`, err2.message);
          return res.status(500).json({ success: false, error: 'Database query failed', details: err2.message });
        }
        
        console.log(`[GET /api/campaigns/${id}/local] Query by ID result:`, rows2.length, 'rows');
        if (rows2.length > 0) {
          console.log(`[GET /api/campaigns/${id}/local] Found campaign by ID:`, rows2[0]);
          return res.json({ success: true, data: rows2[0] });
        }
        
        // Not found in either case
        console.log(`[GET /api/campaigns/${id}/local] Campaign not found in local database`);
        res.json({ success: false, data: null, message: 'Campaign not found in local database' });
      });
    });
  } catch (error) {
    console.error(`[GET /api/campaigns/${id}/local] Error:`, error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch local campaign details', details: error.message });
  }
});

// Cancel campaign (ElevenLabs batch calling)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[POST /api/campaigns/${id}/cancel] Cancelling campaign...`);
    
    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/${id}/cancel`, {
      method: 'POST',
      headers: elevenHeaders()
    });
    
    console.log(`[POST /api/campaigns/${id}/cancel] ElevenLabs response status:`, response.status);
    const data = await response.json();
    console.log(`[POST /api/campaigns/${id}/cancel] ElevenLabs response data:`, data);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: 'Failed to cancel campaign', 
        details: data 
      });
    }
    
    // Update local database status to 'Paused' when cancelled
    db.query(
      'UPDATE campaigns SET status = ? WHERE external_id = ?',
      ['Paused', id],
      (dbErr, result) => {
        if (dbErr) {
          console.error(`[POST /api/campaigns/${id}/cancel] Database update failed:`, dbErr);
        } else {
          console.log(`[POST /api/campaigns/${id}/cancel] Database status updated to Paused`);
        }
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Campaign cancelled successfully',
      data: data
    });
  } catch (error) {
    console.error(`[POST /api/campaigns/${id}/cancel] Error:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel campaign', 
      details: error.message 
    });
  }
});

// Retry campaign (ElevenLabs batch calling)
router.post('/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[POST /api/campaigns/${id}/retry] Retrying campaign...`);
    
    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/${id}/retry`, {
      method: 'POST',
      headers: elevenHeaders()
    });
    
    console.log(`[POST /api/campaigns/${id}/retry] ElevenLabs response status:`, response.status);
    const data = await response.json();
    console.log(`[POST /api/campaigns/${id}/retry] ElevenLabs response data:`, data);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: 'Failed to retry campaign', 
        details: data 
      });
    }
    
    // Update local database status to 'Active' when retried
    db.query(
      'UPDATE campaigns SET status = ? WHERE external_id = ?',
      ['Active', id],
      (dbErr, result) => {
        if (dbErr) {
          console.error(`[POST /api/campaigns/${id}/retry] Database update failed:`, dbErr);
        } else {
          console.log(`[POST /api/campaigns/${id}/retry] Database status updated to Active`);
        }
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Campaign retry initiated successfully',
      data: data
    });
  } catch (error) {
    console.error(`[POST /api/campaigns/${id}/retry] Error:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retry campaign', 
      details: error.message 
    });
  }
});


// Test endpoint for ElevenLabs Batch Calling API
router.get('/test-batch/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[TEST] Testing ElevenLabs Batch Calling API for campaign:`, id);
    
    // Test the batch calling API endpoint
    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/${id}`, {
      headers: elevenHeaders()
    });
    const data = await response.json();
    
    console.log(`[TEST] Batch calling API response status:`, response.status);
    console.log(`[TEST] Batch calling API response data:`, JSON.stringify(data, null, 2));
    
    // Analyze the response structure
    const analysis = {
      campaignId: id,
      responseStatus: response.status,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      responseData: data,
      structure: {
        hasRecipients: !!(data.recipients && Array.isArray(data.recipients)),
        hasCalls: !!(data.calls && Array.isArray(data.calls)),
        hasCallRecipients: !!(data.call_recipients && Array.isArray(data.call_recipients)),
        hasBatchCalls: !!(data.batch_calls && Array.isArray(data.batch_calls)),
        availableKeys: Object.keys(data),
        recipientsCount: 0,
        sampleRecipient: null
      }
    };
    
    // Count recipients in different possible structures
    if (data.recipients && Array.isArray(data.recipients)) {
      analysis.structure.recipientsCount = data.recipients.length;
      analysis.structure.sampleRecipient = data.recipients[0] || null;
      console.log(`[TEST] Found ${data.recipients.length} recipients in data.recipients`);
    } else if (data.calls && Array.isArray(data.calls)) {
      analysis.structure.recipientsCount = data.calls.length;
      analysis.structure.sampleRecipient = data.calls[0] || null;
      console.log(`[TEST] Found ${data.calls.length} recipients in data.calls`);
    } else if (data.call_recipients && Array.isArray(data.call_recipients)) {
      analysis.structure.recipientsCount = data.call_recipients.length;
      analysis.structure.sampleRecipient = data.call_recipients[0] || null;
      console.log(`[TEST] Found ${data.call_recipients.length} recipients in data.call_recipients`);
    } else {
      console.log(`[TEST] No recipients found in any expected structure`);
    }
    
    if (analysis.structure.sampleRecipient) {
      console.log(`[TEST] Sample recipient:`, JSON.stringify(analysis.structure.sampleRecipient, null, 2));
    }
    
    res.json(analysis);
  } catch (error) {
    console.error(`[TEST] Error:`, error.message);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// Debug endpoint to check database structure and data
router.get('/debug-db', async (_req, res) => {
  try {
    // Check campaigns table structure
    const [rows] = await new Promise((resolve, reject) => {
      db.query('DESCRIBE campaigns', (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    // Check current campaigns data
    const [campaigns] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM campaigns ORDER BY createdAt DESC LIMIT 5', (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    const hasExternalId = rows.some(row => row.Field === 'external_id');
    const hasAgentName = rows.some(row => row.Field === 'agentName');
    
    res.json({
      tableStructure: rows,
      currentCampaigns: campaigns,
      hasExternalId,
      hasAgentName,
      totalCampaigns: campaigns.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Database check failed', details: error.message });
  }
});

// List workspace campaigns (batches)
// Get campaigns for a specific client (for client-admin panel)
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    console.log(`[GET /api/campaigns/client/${clientId}] Fetching campaigns for client:`, clientId);
    
    // First, try to get the client name from the clients table if clientId is numeric
    let clientName = clientId;
    if (/^\d+$/.test(clientId)) {
      try {
        const clientResult = await new Promise((resolve) => {
          db.query('SELECT companyName FROM clients WHERE id = ?', [clientId], (err, rows) => {
            if (err || !rows || rows.length === 0) {
              resolve(null);
            } else {
              resolve(rows[0].companyName);
            }
          });
        });
        if (clientResult) {
          clientName = clientResult;
          console.log(`[GET /api/campaigns/client/${clientId}] Mapped client ID to name: ${clientName}`);
        }
      } catch (e) {
        console.log(`[GET /api/campaigns/client/${clientId}] Could not map client ID, using as-is: ${clientId}`);
      }
    }
    
    const [elevenRes, dbRows] = await Promise.all([
      fetch(`${config.elevenlabs.base}/convai/batch-calling/workspace`, { headers: elevenHeaders() }),
      new Promise((resolve) => {
        // Get campaigns for this specific client - try multiple matching strategies
        db.query('SELECT * FROM campaigns WHERE clientName = ? OR clientName LIKE ?', [clientName, `%${clientName}%`], (err, rows) => {
          if (err) {
            console.error('[GET /api/campaigns/client/:clientId] Database error:', err);
            return resolve([]);
          }
          resolve(rows || []);
        });
      })
    ]);
    
    const elevenJson = await elevenRes.json();
    const batches = Array.isArray(elevenJson?.batch_calls) ? elevenJson.batch_calls : (Array.isArray(elevenJson?.items) ? elevenJson.items : (Array.isArray(elevenJson) ? elevenJson : []));
    const local = Array.isArray(dbRows) ? dbRows : [];
    
    console.log(`[GET /api/campaigns/client/${clientId}] ElevenLabs batches:`, batches.length);
    console.log(`[GET /api/campaigns/client/${clientId}] Local DB rows for client:`, local.length);
    
    // Filter ElevenLabs batches to only include those associated with this client
    const clientBatches = batches.filter(batch => {
      // Check if this batch has local data associated with the client
      const hasLocalData = local.some(localCampaign => 
        localCampaign.external_id === (batch.id || batch.batch_id)
      );
      
      // Also include batches that might have client info in ElevenLabs data
      const hasClientInfo = batch.client_name === clientName || 
                           batch.agent_name?.toLowerCase().includes(clientName.toLowerCase()) ||
                           batch.name?.toLowerCase().includes(clientName.toLowerCase());
      
      console.log(`[GET /api/campaigns/client/${clientId}] Batch ${batch.id}:`, {
        name: batch.name,
        agent_name: batch.agent_name,
        client_name: batch.client_name,
        hasLocalData,
        hasClientInfo,
        clientName
      });
      
      // Always include batches that have local data
      if (hasLocalData) {
        return true;
      }
      
      // For batches without local data, check if they might belong to this client
      if (hasClientInfo) {
        return true;
      }
      
      // Only include batches that have local data for this client
      // This ensures proper client isolation
      return hasLocalData;
    });
    
    console.log(`[GET /api/campaigns/client/${clientId}] Filtered batches for client:`, clientBatches.length);
    
    // Create mapping between external IDs and local data
    const externalToLocal = new Map(local.map(r => [String(r.external_id), r]));
    
    // Merge ElevenLabs data with local data for this client
    const merged = clientBatches.map(b => ({ 
      ...b, 
      local: externalToLocal.get(String(b.id || b.batch_id)) || null 
    }));
    
    // Also include any local-only campaigns for this client
    const unmatched = local.filter(r => !externalToLocal.has(String(r.external_id || '')));
    
    const payload = { 
      batch_calls: merged, 
      local_only: unmatched,
      client_id: clientId,
      total_campaigns: merged.length + unmatched.length
    };
    
    console.log(`[GET /api/campaigns/client/${clientId}] Final payload:`, {
      batch_calls_count: payload.batch_calls.length,
      local_only_count: payload.local_only.length,
      total_campaigns: payload.total_campaigns
    });
    
    res.json(payload);
  } catch (e) {
    console.error(`[GET /api/campaigns/client/${clientId}] Error:`, e.message);
    res.status(500).json({ error: 'Failed to fetch client campaigns', details: e.message });
  }
});

router.get('/', async (_req, res) => {
  try {
    const [elevenRes, dbRows] = await Promise.all([
      fetch(`${config.elevenlabs.base}/convai/batch-calling/workspace`, { headers: elevenHeaders() }),
      new Promise((resolve) => {
        db.query('SELECT * FROM campaigns', (err, rows) => {
          if (err) return resolve([]);
          resolve(rows || []);
        });
      })
    ]);
    const elevenJson = await elevenRes.json();
    
    console.log('[GET /api/campaigns] ElevenLabs raw response:', JSON.stringify(elevenJson, null, 2));
    
    const batches = Array.isArray(elevenJson?.batch_calls) ? elevenJson.batch_calls : (Array.isArray(elevenJson?.items) ? elevenJson.items : (Array.isArray(elevenJson) ? elevenJson : []));
    const local = Array.isArray(dbRows) ? dbRows : [];
    
    console.log('[GET /api/campaigns] Processed batches:', batches.length);
    console.log('[GET /api/campaigns] Local DB rows:', local.length);
    
    // Log each batch to see agent information
    batches.forEach((batch, index) => {
      console.log(`[GET /api/campaigns] Batch ${index + 1}:`, {
        id: batch.id,
        batch_id: batch.batch_id,
        name: batch.name,
        agent_id: batch.agent_id,
        agent_name: batch.agent_name,
        phone_provider: batch.phone_provider,
        status: batch.status,
        total_calls_scheduled: batch.total_calls_scheduled,
        total_calls_dispatched: batch.total_calls_dispatched
      });
    });
    
    const externalToLocal = new Map(local.filter(r => r.external_id).map(r => [String(r.external_id), r]));
    const merged = batches.map(b => ({ ...b, local: externalToLocal.get(String(b.id || b.batch_id)) || null }));
    const unmatched = local.filter(r => !externalToLocal.has(String(r.external_id || '')));
    const payload = { batch_calls: merged, local_only: unmatched };
    
    console.log('[GET /api/campaigns] Final payload structure:', {
      batch_calls_count: payload.batch_calls.length,
      local_only_count: payload.local_only.length
    });
    
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: 'Fetch campaigns failed', details: e.message });
  }
});

// Get a single campaign (batch) details
router.get('/:campaign_id', async (req, res) => {
  try {
    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/${encodeURIComponent(req.params.campaign_id)}`, {
      headers: elevenHeaders()
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Fetch campaign failed', details: e.message });
  }
});

// Pause a campaign = cancel batch
router.post('/:campaign_id/pause', async (req, res) => {
  try {
    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/${encodeURIComponent(req.params.campaign_id)}/cancel`, {
      method: 'POST',
      headers: elevenHeaders()
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Pause campaign failed', details: e.message });
  }
});

// Resume/Retry a campaign = retry batch
router.post('/:campaign_id/resume', async (req, res) => {
  try {
    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/${encodeURIComponent(req.params.campaign_id)}/retry`, {
      method: 'POST',
      headers: elevenHeaders()
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Resume campaign failed', details: e.message });
  }
});

// Update campaign metadata (no native PATCH on ElevenLabs; passthrough for future or local notes)
router.patch('/:campaign_id', async (_req, res) => {
  // No-op passthrough; implement custom metadata storage if needed
  res.json({ ok: true });
});

// Delete campaign: map to cancel on ElevenLabs
router.delete('/:campaign_id', async (req, res) => {
  try {
    const response = await fetch(`${config.elevenlabs.base}/convai/batch-calling/${encodeURIComponent(req.params.campaign_id)}/cancel`, {
      method: 'POST',
      headers: elevenHeaders()
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Delete (cancel) campaign failed', details: e.message });
  }
});

// Flag misuse endpoint
router.post('/flag-misuse', async (req, res) => {
  try {
    const { callId, conversationId, callerId, campaignName, agent, reason, description, reportedBy } = req.body;
    
    console.log('[POST /api/campaigns/flag-misuse] Flag misuse report:', {
      callId, conversationId, callerId, campaignName, agent, reason, description, reportedBy
    });
    
    // Validate required fields
    if (!callId || !reason || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: callId, reason, and description are required'
      });
    }
    
    // Create flag report object
    const flagReport = {
      id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      callId,
      conversationId,
      callerId,
      campaignName,
      agent,
      reason,
      description,
      reportedBy: reportedBy || 'System User',
      timestamp: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // In a real application, you would save this to a database
    // For now, we'll just log it and return success
    console.log('[POST /api/campaigns/flag-misuse] Flag report created:', flagReport);
    
    // You could also send notifications to administrators here
    // sendAdminNotification(flagReport);
    
    res.json({
      success: true,
      message: 'Call flagged successfully for review',
      data: {
        flagId: flagReport.id,
        status: 'pending'
      }
    });
    
  } catch (error) {
    console.error('[POST /api/campaigns/flag-misuse] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to flag call for misuse',
      details: error.message
    });
  }
});


// Helper functions for data mapping
function mapElevenLabsStatus(status) {
  const statusMap = {
    'pending': 'Dialing',
    'in_progress': 'Answered',
    'completed': 'Completed',
    'failed': 'Failed',
    'cancelled': 'Failed'
  };
  return statusMap[status] || 'Dialing';
}

function calculateDuration(createdAt, updatedAt) {
  if (!createdAt || !updatedAt) return 0;
  return Math.max(0, updatedAt - createdAt);
}

function extractTranscriptionSnippet(call) {
  // Try to extract transcription from various possible fields
  return call.transcription_snippet || 
         call.transcription || 
         call.snippet || 
         call.preview ||
         (call.conversation_initiation_client_data?.dynamic_variables?.name ? 
          `Calling ${call.conversation_initiation_client_data.dynamic_variables.name}` : 
          'Call in progress...');
}

function calculateAverageResponseTime(calls) {
  const answeredCalls = calls.filter(call => 
    call.status === 'Answered' || call.status === 'In Progress'
  );
  
  if (answeredCalls.length === 0) return '0s';
  
  const totalTime = answeredCalls.reduce((sum, call) => sum + call.durationSeconds, 0);
  const avgSeconds = Math.round(totalTime / answeredCalls.length);
  
  return `${avgSeconds}s`;
}

module.exports = router;



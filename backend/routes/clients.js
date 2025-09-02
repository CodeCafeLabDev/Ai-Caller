const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

// Get all clients (aggregate all assigned plans) - match original server.js exactly
router.get("/", (req, res) => {
  // Aggregate plan names and sum monthly limits across all currently active assigned plans
  const sql = `
    SELECT 
      c.*,
      COALESCE(SUM(CAST(p.totalCallsAllowedPerMonth AS UNSIGNED)), 0) AS totalMonthlyLimit,
      GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS planNames
    FROM clients c
    LEFT JOIN assigned_plans ap ON ap.client_id = c.id
      AND (ap.start_date IS NULL OR ap.start_date <= CURDATE())
      AND (ap.duration_override_days IS NULL OR DATE_ADD(ap.start_date, INTERVAL ap.duration_override_days DAY) >= CURDATE())
      AND (ap.is_enabled IS NULL OR ap.is_enabled = 1)
    LEFT JOIN plans p ON ap.plan_id = p.id
    GROUP BY c.id
  `;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch clients", error: err });
    }

    const processedResults = results.map(client => ({
      ...client,
      monthlyCallLimit: client.totalMonthlyLimit ? parseInt(client.totalMonthlyLimit) : 0,
    }));

    res.json({ success: true, data: processedResults });
  });
});

// Get a single client by id - match original server.js exactly
router.get("/:id", (req, res) => {
  const sql = `
    SELECT 
      c.*,
      COALESCE(SUM(CAST(p.totalCallsAllowedPerMonth AS UNSIGNED)), 0) AS totalMonthlyLimit,
      GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS planNames
    FROM clients c
    LEFT JOIN assigned_plans ap ON ap.client_id = c.id
      AND (ap.start_date IS NULL OR ap.start_date <= CURDATE())
      AND (ap.duration_override_days IS NULL OR DATE_ADD(ap.start_date, INTERVAL ap.duration_override_days DAY) >= CURDATE())
      AND (ap.is_enabled IS NULL OR ap.is_enabled = 1)
    LEFT JOIN plans p ON ap.plan_id = p.id
    WHERE c.id = ?
    GROUP BY c.id
  `;
  db.query(sql, [req.params.id], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch client", error: err });
      }
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
    const row = results[0];
    row.monthlyCallLimit = row.totalMonthlyLimit ? parseInt(row.totalMonthlyLimit) : 0;
    res.json({ success: true, data: row });
  });
});

// Create a new client - match original server.js logic exactly
router.post("/", async (req, res) => {
  try {
    const client = req.body;
    delete client.id;
    delete client.confirmAdminPassword;

    // Hash the adminPassword before saving
    if (client.adminPassword) {
      const bcrypt = require('bcrypt');
      client.adminPassword = await bcrypt.hash(client.adminPassword, 10);
    }

    // If trialMode with duration is provided and no trialEndsAt, set it now
    if (client.trialMode && client.trialDuration && !client.trialEndsAt) {
      const ends = new Date(Date.now() + Number(client.trialDuration) * 24 * 60 * 60 * 1000);
      client.trialEndsAt = ends;
    }

    // Start transaction for client creation and referral handling
    db.beginTransaction(async (err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        return res.status(500).json({ success: false, message: "Database error", error: err.message });
      }

      try {
        // Create the client
        db.query("INSERT INTO clients SET ?", client, (err, result) => {
          if (err) {
            console.error("Failed to create client:", err);
            return db.rollback(() => {
              res.status(500).json({ success: false, message: "Failed to create client", error: err });
            });
          }

          const clientId = result.insertId;

          // Handle referral code if provided
          if (client.referralCode) {
            // Find sales admin by referral code from sales_admin_referral_codes table
            db.query(`
              SELECT au.id, au.name, sarc.referral_code 
              FROM admin_users au 
              JOIN sales_admin_referral_codes sarc ON au.id = sarc.admin_user_id 
              WHERE sarc.referral_code = ? AND au.status = "Active"
            `, [client.referralCode], (err, salesResults) => {
              if (err) {
                console.error("Error finding sales admin by referral code:", err);
                return db.rollback(() => {
                  res.status(500).json({ success: false, message: "Database error", error: err.message });
                });
              }

              if (salesResults.length > 0) {
                const salesAdmin = salesResults[0];
                
                // Create referral record with all necessary fields
                const insertReferralQuery = `
                  INSERT INTO referrals (
                    admin_user_id, 
                    client_id, 
                    referral_code, 
                    status, 
                    plan_subscribed, 
                    is_trial, 
                    revenue_generated, 
                    commission_status
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const referralValues = [
                  salesAdmin.id, 
                  clientId, 
                  client.referralCode,
                  'pending', // Default status
                  client.plan_id ? 'Trial' : 'Basic', // Default plan (you can adjust this logic)
                  1, // Default to trial (is_trial = 1)
                  0.00, // Default revenue
                  'pending' // Default commission status
                ];
                db.query(insertReferralQuery, referralValues, (err, referralResult) => {
                  if (err) {
                    console.error("Error creating referral:", err);
                    return db.rollback(() => {
                      res.status(500).json({ success: false, message: "Database error", error: err.message });
                    });
                  }

                  // Commit transaction and return success
                  db.commit((err) => {
                    if (err) {
                      console.error("Error committing transaction:", err);
                      return db.rollback(() => {
                        res.status(500).json({ success: false, message: "Database error", error: err.message });
                      });
                    }

                    // Fetch the created client
                    db.query("SELECT * FROM clients WHERE id = ?", [clientId], (err, results) => {
                      if (err) {
                        return res.status(500).json({ success: false, message: "Client created but failed to fetch", error: err });
                      }
                      res.status(201).json({ 
                        success: true, 
                        message: "Client created with referral", 
                        data: results[0],
                        referral: {
                          salesAdminId: salesAdmin.id,
                          salesAdminName: salesAdmin.name,
                          referralCode: client.referralCode
                        }
                      });
                    });
                  });
                });
              } else {
                // No valid sales admin found, but still create client
                db.commit((err) => {
                  if (err) {
                    console.error("Error committing transaction:", err);
                    return db.rollback(() => {
                      res.status(500).json({ success: false, message: "Database error", error: err.message });
                    });
                  }

                  // Fetch the created client
                  db.query("SELECT * FROM clients WHERE id = ?", [clientId], (err, results) => {
                    if (err) {
                      return res.status(500).json({ success: false, message: "Client created but failed to fetch", error: err });
                    }
                    res.status(201).json({ 
                      success: true, 
                      message: "Client created (invalid referral code)", 
                      data: results[0] 
                    });
                  });
                });
              }
            });
          } else {
            // No referral code provided, just commit the transaction
            db.commit((err) => {
              if (err) {
                console.error("Error committing transaction:", err);
                return db.rollback(() => {
                  res.status(500).json({ success: false, message: "Database error", error: err.message });
                });
              }

              // Fetch the created client
              db.query("SELECT * FROM clients WHERE id = ?", [clientId], (err, results) => {
                if (err) {
                  return res.status(500).json({ success: false, message: "Client created but failed to fetch", error: err });
                }
                res.status(201).json({ success: true, message: "Client created", data: results[0] });
              });
            });
          }
        });
      } catch (error) {
        console.error("Error in client creation transaction:", error);
        return db.rollback(() => {
          res.status(500).json({ success: false, message: "Database error", error: error.message });
        });
      }
    });
  } catch (err) {
    console.error("Error hashing password or creating client:", err);
    res.status(500).json({ success: false, message: "Failed to create client", error: err.message });
  }
});

// Update a client - match original server.js logic exactly
router.put("/:id", (req, res) => {
  const clientIncoming = req.body || {};
  let clientId = Number.parseInt(String(req.params.id ?? ''), 10);
  if (Number.isNaN(clientId)) {
    const fallbackId = Number.parseInt(String(clientIncoming.id ?? ''), 10);
    if (!Number.isNaN(fallbackId)) clientId = fallbackId;
  }
  if (Number.isNaN(clientId)) {
    console.error('[PUT /api/clients/:id] Invalid client id in params/body:', req.params.id, clientIncoming.id);
    return res.status(400).json({ success: false, message: 'Invalid client id' });
  }

  // Log the incoming request body for debugging
  console.log("[PUT /api/clients/:id] Incoming body:", clientIncoming);

  // Remove undefined fields
  const client = { ...clientIncoming };
  // Ensure we do not update primary key directly
  delete client.id;
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

  // Strip computed/aggregated fields that are not columns in clients
  const blacklist = new Set([
    'totalMonthlyLimit',
    'planNames',
    'monthlyCallLimit',
    'monthlyCallsMade',
    'totalCallsMade'
  ]);
  Object.keys(client).forEach((k) => {
    if (blacklist.has(k)) delete client[k];
  });

  // Whitelist by actual table columns to avoid sending unknown keys
  db.query("SHOW COLUMNS FROM clients", (colsErr, colsRows) => {
    if (colsErr) {
      console.error('[PUT /api/clients/:id] Failed to introspect columns:', colsErr);
      return res.status(500).json({ success: false, message: 'Failed to update client (introspection)', error: colsErr });
    }
    const allowed = new Set((colsRows || []).map((r) => r.Field));
    const filtered = {};
    Object.keys(client).forEach((k) => {
      if (allowed.has(k)) filtered[k] = client[k];
    });
  db.query(
    "UPDATE clients SET ? WHERE id = ?",
      [filtered, clientId],
    (err, result) => {
      if (err) {
        console.error("[PUT /api/clients/:id] MySQL error:", err);
        return res.status(500).json({ success: false, message: "Failed to update client", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
        db.query("SELECT * FROM clients WHERE id = ?", [clientId], (err2, results) => {
          if (err2) {
            console.error("[PUT /api/clients/:id] MySQL error (fetch after update):", err2);
            return res.status(500).json({ success: false, message: "Client updated but failed to fetch", error: err2 });
        }
        res.json({ success: true, message: "Client updated successfully", data: results[0] });
      });
    }
  );
  });
});

// Delete a client
router.delete("/:id", (req, res) => {
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

// Get assigned plans for a client
router.get("/:id/assigned-plans", (req, res) => {
  const clientId = req.params.id;
  const sql = `
    SELECT 
      ap.id AS assignmentId,
      ap.client_id AS clientId,
      ap.plan_id AS planId,
      p.name AS planName,
      p.totalCallsAllowedPerMonth AS monthlyLimit,
      ap.start_date AS startDate,
      ap.duration_override_days AS durationDays,
      ap.is_trial AS isTrial,
      ap.discount_type AS discountType,
      ap.discount_value AS discountValue,
      ap.notes AS notes,
      ap.auto_send_notifications AS autoSendNotifications,
      COALESCE(ap.is_enabled, 1) AS isEnabled,
      ( (ap.start_date IS NULL OR ap.start_date <= CURDATE())
        AND (ap.duration_override_days IS NULL OR DATE_ADD(ap.start_date, INTERVAL ap.duration_override_days DAY) >= CURDATE())
      ) AS isActive
    FROM assigned_plans ap
    LEFT JOIN plans p ON p.id = ap.plan_id
    WHERE ap.client_id = ?
    ORDER BY ap.start_date DESC, ap.id DESC
  `;
  db.query(sql, [clientId], (err, results) => {
    if (err) {
      console.error("Failed to fetch assigned plans:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch assigned plans", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Client Agents Analytics (calls, success rate) - match original server.js
router.get('/:id/agents-analytics', async (req, res) => {
  try {
    const clientId = req.params.id;
    const daysParam = Number.parseInt(String(req.query.days ?? ''), 10);
    const lastDays = Number.isNaN(daysParam) ? 30 : Math.max(1, Math.min(daysParam, 180));

    const xiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    if (!xiKey) {
      return res.status(400).json({ success: false, message: 'ElevenLabs API key missing' });
    }
    const headers = { 'xi-api-key': xiKey };

    // Get agents for client
    const agents = await new Promise((resolve, reject) => {
      db.query('SELECT agent_id, name FROM agents WHERE client_id = ? OR (created_by_type = "client" AND created_by = ?)', [clientId, clientId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
    let agentList = Array.isArray(agents) ? agents : [];

    // Fallback: include agent IDs stored on client record (elevenlabs_agent_ids)
    try {
      const clientRows = await new Promise((resolve, reject) => {
        db.query('SELECT elevenlabs_agent_ids FROM clients WHERE id = ?', [clientId], (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });
      if (clientRows.length > 0 && clientRows[0].elevenlabs_agent_ids) {
        const storedIds = JSON.parse(clientRows[0].elevenlabs_agent_ids || '[]');
        if (Array.isArray(storedIds)) {
          storedIds.forEach(agentId => {
            if (!agentList.find(a => a.agent_id === agentId)) {
              agentList.push({ agent_id: agentId, name: `Agent ${agentId}` });
            }
          });
        }
      }
    } catch (parseErr) {
      // Silently handle parse errors to reduce console clutter
      // console.warn('Failed to parse elevenlabs_agent_ids for client', clientId, parseErr);
    }

    if (agentList.length === 0) {
      return res.json({
        success: true,
        data: {
          agents: [],
          totals: {
            totalCalls: 0,
            successRate: 0,
            totalDurationSecs: 0
          }
        }
      });
    }

    // Fetch analytics for each agent
    const agentAnalytics = await Promise.all(agentList.map(async (agent) => {
      try {
        const axios = require('axios');
        const url = `https://api.elevenlabs.io/v1/convai/agents/${agent.agent_id}/conversations`;
        const response = await axios.get(url, { headers });
        
        if (response.status === 200) {
          const conversations = response.data.conversations || [];
          
          // Filter conversations by date range
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - lastDays);
          
          const recentConversations = conversations.filter(conv => {
            const convDate = new Date(conv.start_time);
            return convDate >= cutoffDate;
          });
          
          const totalCalls = recentConversations.length;
          const successfulCalls = recentConversations.filter(conv => conv.status === 'completed').length;
          const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
          const totalDuration = recentConversations.reduce((sum, conv) => sum + (conv.duration_seconds || 0), 0);
          
          return {
            agentId: agent.agent_id,
            agentName: agent.name,
            totalCalls,
            successfulCalls,
            successRate: Math.round(successRate * 100) / 100,
            totalDurationSecs: totalDuration,
            averageDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0
          };
        }
      } catch (apiErr) {
        // Only log critical errors to reduce console clutter
        if (apiErr.response?.status >= 500) {
          console.warn(`Failed to fetch analytics for agent ${agent.agent_id}:`, apiErr.message);
        }
      }
      
      return {
        agentId: agent.agent_id,
        agentName: agent.name,
        totalCalls: 0,
        successfulCalls: 0,
        successRate: 0,
        totalDurationSecs: 0,
        averageDuration: 0
      };
    }));

    // Calculate totals
    const totals = agentAnalytics.reduce((acc, agent) => ({
      totalCalls: acc.totalCalls + agent.totalCalls,
      successfulCalls: acc.successfulCalls + agent.successfulCalls,
      totalDurationSecs: acc.totalDurationSecs + agent.totalDurationSecs
    }), { totalCalls: 0, successfulCalls: 0, totalDurationSecs: 0 });

    const overallSuccessRate = totals.totalCalls > 0 ? (totals.successfulCalls / totals.totalCalls) * 100 : 0;

    res.json({
      success: true,
      data: {
        agents: agentAnalytics,
        totals: {
          totalCalls: totals.totalCalls,
          successRate: Math.round(overallSuccessRate * 100) / 100,
          totalDurationSecs: totals.totalDurationSecs
        }
      }
    });

  } catch (error) {
    console.error('Error fetching client agents analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics',
      data: {
        agents: [],
        totals: {
          totalCalls: 0,
          successRate: 0,
          totalDurationSecs: 0
        }
      }
    });
  }
});

// Get ElevenLabs usage for a client - match original server.js
router.get("/:clientId/elevenlabs-usage", async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const xiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!xiKey) {
      return res.json({
        success: true,
        data: {
          monthlyCalls: 0,
          monthlyLimit: 0,
          lifetimeCalls: 0,
          period: "current_month"
        }
      });
    }

    // Get client's monthly call limit from assigned plans
    const limitSql = `
      SELECT COALESCE(SUM(CAST(p.totalCallsAllowedPerMonth AS UNSIGNED)), 0) AS totalLimit
      FROM assigned_plans ap
      JOIN plans p ON ap.plan_id = p.id
      WHERE ap.client_id = ?
        AND (ap.start_date IS NULL OR ap.start_date <= CURDATE())
        AND (ap.duration_override_days IS NULL OR DATE_ADD(ap.start_date, INTERVAL ap.duration_override_days DAY) >= CURDATE())
        AND (ap.is_enabled IS NULL OR ap.is_enabled = 1)
    `;
    
    const limitResult = await new Promise((resolve, reject) => {
      db.query(limitSql, [clientId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]?.totalLimit || 0);
      });
    });

    // Get agents for this client (same logic as old server.js)
    let agents = await new Promise((resolve, reject) => {
      db.query('SELECT agent_id FROM agents WHERE client_id = ? OR (created_by_type = "client" AND created_by = ?)', [clientId, clientId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });

    // Note: elevenlabs_agent_ids column doesn't exist in current database schema
    // This fallback is removed to prevent database errors

    if (agents.length === 0) {
      return res.json({
        success: true,
        data: {
          monthlyCalls: 0,
          monthlyLimit: limitResult,
          lifetimeCalls: 0,
          period: "current_month"
        }
      });
    }

    // Use the same efficient approach as old server.js: fetch conversations in batches with date filtering
    const axios = require('axios');
    let totalMonthlyCalls = 0;
    let totalLifetimeCalls = 0;

    try {
      // Get agent IDs for filtering
      const agentIds = agents.map(a => String(a.agent_id)).filter(Boolean);
      if (agentIds.length === 0) {
        return res.json({
          success: true,
          data: {
            monthlyCalls: 0,
            monthlyLimit: limitResult,
            lifetimeCalls: 0,
            period: "current_month"
          }
        });
      }

      const agentIdSet = new Set(agentIds);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const startUnix = Math.floor(monthStart.getTime() / 1000);
      const endUnix = Math.floor(now.getTime() / 1000);

      // Define headers for API calls
      const headers = { 'xi-api-key': xiKey };

      // Fetch monthly calls (current month) with date filtering
      let monthlyCalls = 0;
      let cursor = undefined;
      let safety = 0;
      
      do {
        const url = 'https://api.elevenlabs.io/v1/convai/conversations';
        const params = {
          page_size: '100',
          summary_mode: 'include',
          call_start_after_unix: String(startUnix),
          call_start_before_unix: String(endUnix)
        };
        if (cursor) params.cursor = String(cursor);
        
        const response = await axios.get(url, { params, headers });
        if (response.status !== 200) break;
        
        const json = response.data;
        const conversations = Array.isArray(json.conversations) ? json.conversations : [];
        
        for (const conv of conversations) {
          const agentId = String(conv.agent_id || conv.agent?.id || conv.agentId || '');
          if (agentId && agentIdSet.has(agentId)) {
            monthlyCalls += 1;
          }
        }
        
        cursor = json.next_cursor || json.cursor || undefined;
        safety += 1;
      } while (cursor && safety < 100);

      // Fetch lifetime calls (all time) for the same agents
      let lifetimeCalls = 0;
      cursor = undefined;
      safety = 0;
      
      do {
        const url = 'https://api.elevenlabs.io/v1/convai/conversations';
        const params = {
          page_size: '100',
          summary_mode: 'include'
        };
        if (cursor) params.cursor = String(cursor);
        
        const response = await axios.get(url, { params, headers });
        if (response.status !== 200) break;
        
        const json = response.data;
        const conversations = Array.isArray(json.conversations) ? json.conversations : [];
        
        for (const conv of conversations) {
          const agentId = String(conv.agent_id || conv.agent?.id || conv.agentId || '');
          if (agentId && agentIdSet.has(agentId)) {
            lifetimeCalls += 1;
          }
        }
        
        cursor = json.next_cursor || json.cursor || undefined;
        safety += 1;
      } while (cursor && safety < 200);

      totalMonthlyCalls = monthlyCalls;
      totalLifetimeCalls = lifetimeCalls;
      
    } catch (apiErr) {
      // // Only log non-404 errors to reduce console clutter
      // if (apiErr.response?.status !== 404) {
      //   console.warn(`Failed to fetch ElevenLabs usage:`, apiErr.message);
      // }
    }

    res.json({
      success: true,
      data: {
        monthlyCalls: totalMonthlyCalls,
        monthlyLimit: limitResult,
        lifetimeCalls: totalLifetimeCalls,
        period: "current_month"
      }
    });

  } catch (error) {
    console.error('Error fetching ElevenLabs usage:', error);
    res.json({
      success: true,
      data: {
        monthlyCalls: 0,
        monthlyLimit: 0,
        lifetimeCalls: 0,
        period: "current_month"
      }
    });
  }
});

// Send welcome email to client
router.post("/:id/send-welcome-email", async (req, res) => {
  const clientId = req.params.id;
  
  db.query("SELECT * FROM clients WHERE id = ?", [clientId], async (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch client", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const client = results[0];
    
    try {
      const emailData = {
        companyName: client.companyName,
        contactPersonName: client.contactPersonName,
        companyEmail: client.companyEmail,
        phoneNumber: client.phoneNumber
      };

      await sendEmail(client.companyEmail, 'welcomeEmail', emailData);
      console.log(`📧 Welcome email sent to ${client.companyEmail}`);
      
      res.json({ success: true, message: "Welcome email sent successfully" });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      res.status(500).json({ success: false, message: "Failed to send welcome email", error: emailError.message });
    }
  });
});

// Increment call count for client
router.post("/:id/increment-call", (req, res) => {
  const clientId = req.params.id;
  
  db.query(
    "UPDATE clients SET totalCallsMade = totalCallsMade + 1, monthlyCallsMade = monthlyCallsMade + 1 WHERE id = ?",
    [clientId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to increment call count", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
      res.json({ success: true, message: "Call count incremented" });
    }
  );
});

// Reset monthly usage for all clients (utility endpoint)
router.post("/reset-monthly-usage", (req, res) => {
  const sql = `
    UPDATE clients 
    SET monthlyCallsMade = 0, 
        lastMonthlyReset = CURDATE() 
    WHERE lastMonthlyReset < CURDATE() OR lastMonthlyReset IS NULL
  `;
  
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Failed to reset monthly usage:", err);
      return res.status(500).json({ success: false, message: "Failed to reset monthly usage", error: err });
    }
    
    res.json({ 
      success: true, 
      message: `Monthly usage reset for ${result.affectedRows} clients`,
      affectedRows: result.affectedRows
    });
  });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

// Get all referrals
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      r.*,
      c.companyName,
      c.companyEmail,
      c.contactPersonName,
      au.name as salesPersonName,
      p.name as planName
    FROM referrals r
    LEFT JOIN clients c ON c.id = r.client_id
    LEFT JOIN admin_users au ON au.id = r.admin_user_id
    LEFT JOIN plans p ON p.id = c.plan_id
    ORDER BY r.referred_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch referrals", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Create referral
router.post("/", (req, res) => {
  const referral = req.body;
  delete referral.id;

  db.query("INSERT INTO referrals SET ?", referral, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to create referral", error: err });
    }
    res.status(201).json({ success: true, message: "Referral created", id: result.insertId });
  });
});

// Update referral
router.put("/:id", (req, res) => {
  const referralId = req.params.id;
  const updatedReferral = req.body;

  db.query("UPDATE referrals SET ? WHERE id = ?", [updatedReferral, referralId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to update referral", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }
    res.json({ success: true, message: "Referral updated" });
  });
});

// Delete referral
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM referrals WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete referral", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }
    res.json({ success: true, message: "Referral deleted" });
  });
});

// Get referrals by referral code (for client registration)
router.get("/by-code/:code", (req, res) => {
  const { code } = req.params;
  
  const sql = `
    SELECT 
      r.*,
      c.companyName,
      c.companyEmail,
      c.contactPersonName,
      c.phoneNumber,
      c.created_at as client_created_at,
      au.name as salesPersonName
    FROM referrals r
    LEFT JOIN clients c ON c.id = r.client_id
    LEFT JOIN admin_users au ON au.id = r.admin_user_id
    WHERE r.referral_code = ?
    ORDER BY r.referred_at DESC
  `;
  
  db.query(sql, [code], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch referrals", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Update commission for a referral
router.put("/:id/commission", (req, res) => {
  const { id } = req.params;
  const { commission_status, commission_amount } = req.body;
  
  const updateData = {};
  if (commission_status !== undefined) updateData.commission_status = commission_status;
  if (commission_amount !== undefined) updateData.commission_amount = commission_amount;
  
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ success: false, message: "No fields to update" });
  }
  
  db.query("UPDATE referrals SET ? WHERE id = ?", [updateData, id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to update commission", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }
    res.json({ success: true, message: "Commission updated" });
  });
});

// Export referrals CSV (fallback for when no sales profile exists)
router.get("/export", (req, res) => {
  const { q, plan, clientStatus, commissionStatus } = req.query;
  const clientIdFilter = Number(req.query.clientId || 0);
  const commissionPercent = Number(process.env.COMMISSION_PERCENT || 10);

  const whereClauses = ['1=1']; // Always true to get all referrals
  const params = [];
  
  if (q) { 
    whereClauses.push('(c.companyName LIKE ? OR c.companyEmail LIKE ? OR c.contactPersonName LIKE ? OR r.referral_code LIKE ?)'); 
    const like = `%${q}%`; 
    params.push(like, like, like, like); 
  }
  if (plan && plan !== 'ALL') { whereClauses.push('r.plan_subscribed = ?'); params.push(plan); }
  if (clientStatus === 'trial') { whereClauses.push('r.is_trial = 1'); }
  else if (clientStatus === 'paid') { whereClauses.push('r.is_trial = 0'); }
  if (!Number.isNaN(clientIdFilter) && clientIdFilter > 0) { whereClauses.push('r.client_id = ?'); params.push(clientIdFilter); }
  if (commissionStatus && commissionStatus !== 'ALL') { whereClauses.push('r.commission_status = ?'); params.push(commissionStatus); }

  const sql = `
    SELECT 
      r.referral_code,
      c.companyName,
      c.companyEmail,
      c.phoneNumber,
      r.plan_subscribed,
      r.is_trial,
      r.status,
      r.referred_at,
      r.conversion_date,
      r.revenue_generated,
      COALESCE(r.commission_amount, ROUND(r.revenue_generated * ${commissionPercent} / 100, 2)) AS commission,
      r.commission_status
    FROM referrals r
    JOIN clients c ON r.client_id = c.id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY r.referred_at DESC
  `;
  
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching referrals for export:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
    
    // Build CSV
    const headers = [
      'Referral Code','Client Name','Client Email','Client Phone','Plan','Trial',
      'Conversion Status','Signup Date','Conversion Date','Revenue','Commission','Commission Status'
    ];
    const lines = [headers.join(',')];
    for (const r of rows) {
      lines.push([
        r.referral_code,
        r.companyName,
        r.companyEmail,
        r.phoneNumber || '',
        r.plan_subscribed || '',
        r.is_trial ? 'Yes' : 'No',
        r.status === 'converted' ? 'Converted to Paid' : 'Still in Trial',
        new Date(r.referred_at).toISOString(),
        r.conversion_date ? new Date(r.conversion_date).toISOString() : '',
        Number(r.revenue_generated || 0).toFixed(2),
        Number(r.commission || 0).toFixed(2),
        r.commission_status
      ].map(v => `${String(v).replace(/"/g,'""')}`).join(',')
      );
    }
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="referrals.csv"');
    res.send(csv);
  });
});

module.exports = router;
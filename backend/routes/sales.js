const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

// Get all sales persons (admin users with sales role) with referral data
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      au.id,
      au.name,
      au.email,
      au.status,
      sarc.referral_code,
      COUNT(r.id) as total_referrals_count,
      COUNT(CASE WHEN r.referred_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 END) as monthly_referrals_count
    FROM admin_users au
    LEFT JOIN sales_admin_referral_codes sarc ON au.id = sarc.admin_user_id
    LEFT JOIN referrals r ON au.id = r.admin_user_id
    WHERE au.roleName = 'Sales Admin'
    GROUP BY au.id, au.name, au.email, au.status, sarc.referral_code
    ORDER BY au.id DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching sales persons:', err);
      return res.status(500).json({ success: false, message: "Failed to fetch sales persons", error: err });
    }
    
    // Format the results to match the frontend expectations
    const formattedResults = results.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: '', // Phone field doesn't exist in admin_users table
      status: row.status?.toLowerCase() || 'inactive',
      created_at: new Date().toISOString(), // Use current date since created_at doesn't exist
      referral_code: row.referral_code || '',
      total_referrals: row.total_referrals_count || 0,
      monthly_referrals: row.monthly_referrals_count || 0,
      total_referrals_count: row.total_referrals_count || 0,
      monthly_referrals_count: row.monthly_referrals_count || 0
    }));
    
    res.json({ success: true, data: formattedResults });
  });
});

// Get sales person referrals
router.get("/:salesPersonId/referrals", (req, res) => {
  const salesPersonId = req.params.salesPersonId;
  
  const sql = `
    SELECT 
      r.*,
      c.companyName,
      c.companyEmail,
      c.contactPersonName,
      p.name as planName
    FROM referrals r
    LEFT JOIN clients c ON c.id = r.client_id
    LEFT JOIN plans p ON p.id = c.plan_id
    WHERE r.admin_user_id = ?
    ORDER BY r.referred_at DESC
  `;
  
  db.query(sql, [salesPersonId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch referrals", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Generate referral code for sales person
router.post("/:salesPersonId/generate-referral-code", (req, res) => {
  const salesPersonId = req.params.salesPersonId;
  const referralCode = `REF${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  // Check if sales person already has a referral code
  db.query("SELECT * FROM sales_admin_referral_codes WHERE admin_user_id = ?", [salesPersonId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to check existing referral code", error: err });
    }
    
    if (results.length > 0) {
      return res.json({ success: true, data: results[0] });
    }
    
    // Create new referral code
    db.query("INSERT INTO sales_admin_referral_codes SET ?", [{ admin_user_id: salesPersonId, referral_code: referralCode }], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to generate referral code", error: err });
      }
      
      res.json({ success: true, data: { id: result.insertId, admin_user_id: salesPersonId, referral_code: referralCode } });
    });
  });
});

// Generate referral codes for all sales admins who don't have them
router.post("/generate-all-codes", (req, res) => {
  const sql = `
    SELECT au.id, au.name, au.email
    FROM admin_users au
    LEFT JOIN sales_admin_referral_codes sarc ON au.id = sarc.admin_user_id
    WHERE au.roleName = 'Sales Admin' AND sarc.referral_code IS NULL
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error finding sales admins without referral codes:', err);
      return res.status(500).json({ success: false, message: "Failed to find sales admins", error: err });
    }
    
    if (results.length === 0) {
      return res.json({ success: true, message: "All sales admins already have referral codes", generated: 0 });
    }
    
    let generated = 0;
    const tasks = results.map(row => new Promise((resolve) => {
      const referralCode = `REF${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      db.query("INSERT INTO sales_admin_referral_codes SET ?", [{ 
        admin_user_id: row.id, 
        referral_code: referralCode 
      }], (err) => {
        if (!err) generated += 1;
        resolve(true);
      });
    }));
    
    Promise.all(tasks).then(() => {
      res.json({ success: true, message: `Generated ${generated} referral codes`, generated });
    });
  });
});

// Get current user's sales profile (for track referrals page)
router.get("/me", authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  
  if (!userId && !userEmail) {
    return res.status(400).json({ success: false, message: 'Missing user ID' });
  }

  // Get the current user's referral code and sales info
  const sql = `
    SELECT 
      au.id,
      au.name,
      au.email,
      sarc.referral_code,
      COUNT(r.id) as total_referrals,
      COUNT(CASE WHEN r.referred_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 END) as monthly_referrals,
      au.status
    FROM admin_users au
    LEFT JOIN sales_admin_referral_codes sarc ON au.id = sarc.admin_user_id
    LEFT JOIN referrals r ON au.id = r.admin_user_id
    WHERE ${userEmail ? 'au.email = ?' : 'au.id = ?'}
    GROUP BY au.id
    LIMIT 1
  `;
  
  db.query(sql, [userEmail ? userEmail : userId], (err, results) => {
    if (err) {
      console.error('Error fetching sales profile:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
    
    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: 'Sales profile not found' });
    }
    
    const profile = results[0];
    res.json({ success: true, data: profile });
  });
});

// Get referrals for current user (for track referrals page)
router.get("/me/referrals", authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  
  if (!userId && !userEmail) {
    return res.status(400).json({ success: false, message: 'Missing user ID' });
  }

  const { q, plan, clientStatus, commissionStatus } = req.query;
  const clientIdFilter = Number(req.query.clientId || 0);
  const commissionPercent = Number(process.env.COMMISSION_PERCENT || 10);

  // Get the current user's referral code
  const findCodeSql = `
    SELECT sarc.referral_code
    FROM sales_admin_referral_codes sarc
    JOIN admin_users au ON au.id = sarc.admin_user_id
    WHERE ${userEmail ? 'au.email = ?' : 'sarc.admin_user_id = ?'}
    LIMIT 1
  `;
  
  db.query(findCodeSql, [userEmail ? userEmail : userId], (err, codeRows) => {
    if (err) {
      console.error('Error fetching referral code:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
    
    const code = codeRows && codeRows[0] ? codeRows[0].referral_code : null;
    if (!code) return res.json({ success: true, data: [] });

    const whereClauses = ['r.referral_code = ?'];
    const params = [code];
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
        r.*, 
        c.companyName, 
        c.companyEmail, 
        c.contactPersonName, 
        c.phoneNumber, 
        c.created_at as client_created_at,
        CASE WHEN r.commission_amount IS NOT NULL THEN r.commission_amount ELSE ROUND(r.revenue_generated * ${commissionPercent} / 100, 2) END AS commission_calculated
      FROM referrals r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY r.referred_at DESC
    `;
    
    db.query(sql, params, (err2, results) => {
      if (err2) {
        console.error('Error fetching referrals:', err2);
        return res.status(500).json({ success: false, message: 'Database error', error: err2.message });
      }
      res.json({ success: true, data: results });
    });
  });
});

// Export referrals CSV for current user
router.get("/me/referrals/export", authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  
  if (!userId && !userEmail) {
    return res.status(400).json({ success: false, message: 'Missing user ID' });
  }

  const { q, plan, clientStatus, commissionStatus } = req.query;
  const clientIdFilter = Number(req.query.clientId || 0);
  const commissionPercent = Number(process.env.COMMISSION_PERCENT || 10);

  // Get the current user's referral code
  const findCodeSql = `
    SELECT sarc.referral_code
    FROM sales_admin_referral_codes sarc
    JOIN admin_users au ON au.id = sarc.admin_user_id
    WHERE ${userEmail ? 'au.email = ?' : 'sarc.admin_user_id = ?'}
    LIMIT 1
  `;
  
  db.query(findCodeSql, [userEmail ? userEmail : userId], (err, codeRows) => {
    if (err) {
      console.error('Error fetching referral code:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
    
    const code = codeRows && codeRows[0] ? codeRows[0].referral_code : null;
    if (!code) return res.json({ success: true, data: [] });

    const whereClauses = ['r.referral_code = ?'];
    const params = [code];
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
    
    db.query(sql, params, (err2, rows2) => {
      if (err2) {
        console.error('Error fetching referrals for export:', err2);
        return res.status(500).json({ success: false, message: 'Database error', error: err2.message });
      }
      
      // Build CSV
      const headers = [
        'Referral Code','Client Name','Client Email','Client Phone','Plan','Trial',
        'Conversion Status','Signup Date','Conversion Date','Revenue','Commission','Commission Status'
      ];
      const lines = [headers.join(',')];
      for (const r of rows2) {
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
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage: storage });

// --- Admin Users API ---
// Get all admin users
router.get('/', (req, res) => {
  db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results });
  });
});

// Get current admin user's profile
router.get('/me', authenticateJWT, async (req, res) => {
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
  db.query('SELECT * FROM admin_users WHERE id = ?', [req.user.id], async (err, results) => {
    if (err) {
      console.error('Error fetching admin profile:', err);
      return res.status(500).json({ success: false, message: 'DB error', error: err });
    }
    if (!results.length) {
      console.error('Admin not found:', req.user.id);
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }
    const admin = results[0];
    let permissions = [];
    try {
      const roleRows = await new Promise((resolve, reject) => {
        db.query('SELECT permission_summary FROM admin_roles WHERE name = ? LIMIT 1', [admin.roleName], (e, r) => {
          if (e) return reject(e); resolve(r || []);
        });
      });
      const raw = roleRows?.[0]?.permission_summary || '';
      try { permissions = JSON.parse(raw); if (!Array.isArray(permissions)) permissions = []; }
      catch {
        const trimmed = String(raw || '').trim();
        if (trimmed && trimmed.toLowerCase().includes('all')) {
          permissions = ['*'];
        } else {
          permissions = (trimmed || '').split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    } catch {}
    res.json({ success: true, data: { ...admin, permissions } });
  });
});

// Get a single admin user by id
router.get('/:id', (req, res) => {
  db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Admin user not found' });
    res.json({ success: true, data: results[0] });
  });
});

// Create a new admin user
router.post('/', async (req, res) => {
  try {
    const { name, email, roleName, password, lastLogin, status, referral_code } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO admin_users (name, email, roleName, password, lastLogin, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, roleName, hashedPassword, lastLogin, status],
      (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        const newUserId = result.insertId;
        const normalizedRole = String(roleName || '').toLowerCase().replace(/_/g, ' ');
        if (normalizedRole === 'sales admin') {
          const code = referral_code && String(referral_code).trim().length > 0 ? referral_code.trim().toUpperCase() : null;
          const ensureCode = (finalCode) => {
            const insertMap = 'INSERT INTO sales_admin_referral_codes (admin_user_id, referral_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE referral_code = VALUES(referral_code)';
            db.query(insertMap, [newUserId, finalCode], (mErr) => {
              if (mErr) console.error('Failed to upsert sales admin referral code:', mErr);
              db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [newUserId], (err2, rows) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });
                res.status(201).json({ success: true, data: rows[0] });
              });
            });
          };

          if (code) {
            ensureCode(code);
          } else {
            // Auto-generate unique 8-char code
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const gen = () => Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            const tryGen = (attempts = 0) => {
              const candidate = gen();
              db.query('SELECT id FROM sales_admin_referral_codes WHERE referral_code = ?', [candidate], (chkErr, rows) => {
                if (chkErr) {
                  console.error('Failed checking referral code uniqueness:', chkErr);
                  return ensureCode(candidate);
                }
                if (rows && rows.length > 0 && attempts < 10) return tryGen(attempts + 1);
                ensureCode(candidate);
              });
            };
            tryGen();
          }
        } else {
          db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [newUserId], (err2, rows) => {
            if (err2) return res.status(500).json({ success: false, message: err2.message });
            res.status(201).json({ success: true, data: rows[0] });
          });
        }
      }
    );
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update an admin user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, roleName, password, lastLogin, status, referral_code } = req.body;
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
      const normalizedRole = String(roleName || '').toLowerCase().replace(/_/g, ' ');
      if (normalizedRole === 'sales admin') {
        const code = referral_code && String(referral_code).trim().length > 0 ? referral_code.trim().toUpperCase() : null;
        if (code) {
          const upsert = 'INSERT INTO sales_admin_referral_codes (admin_user_id, referral_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE referral_code = VALUES(referral_code)';
          db.query(upsert, [req.params.id, code], (mErr) => {
            if (mErr) console.error('Failed to upsert sales admin referral code:', mErr);
            db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [req.params.id], (err2, rows) => {
              if (err2) return res.status(500).json({ success: false, message: err2.message });
              console.log('[PUT /api/admin_users/:id] Updated user:', rows[0]);
              res.json({ success: true, data: rows[0] });
            });
          });
        } else {
          db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [req.params.id], (err2, rows) => {
            if (err2) return res.status(500).json({ success: false, message: err2.message });
            console.log('[PUT /api/admin_users/:id] Updated user:', rows[0]);
            res.json({ success: true, data: rows[0] });
          });
        }
      } else {
        db.query('SELECT id, name, email, roleName, lastLogin, status, createdOn FROM admin_users WHERE id = ?', [req.params.id], (err2, rows) => {
          if (err2) return res.status(500).json({ success: false, message: err2.message });
          console.log('[PUT /api/admin_users/:id] Updated user:', rows[0]);
          res.json({ success: true, data: rows[0] });
        });
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete an admin user
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM admin_users WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Admin user not found' });
    res.json({ success: true, message: 'Admin user deleted successfully' });
  });
});

// Force logout an admin user
router.post('/:id/force-logout', (req, res) => {
  // Implement session/token invalidation here if needed
  res.json({ success: true, message: 'User has been forced to log out.' });
});

// Reset an admin user's password
router.post('/:id/reset-password', (req, res) => {
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
router.patch('/me', authenticateJWT, (req, res) => {
  const { name, avatar_url, bio } = req.body;
  db.query('UPDATE admin_users SET name = ?, avatar_url = ?, bio = ? WHERE id = ?', [name, avatar_url, bio, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error', error: err });
    res.json({ success: true });
  });
});

// Upload profile picture
router.post('/me/avatar_url', authenticateJWT, upload.single('profile_picture'), (req, res) => {
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
router.delete('/me/avatar_url', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Missing user ID' });
  db.query('UPDATE admin_users SET avatar_url = NULL WHERE id = ?', [userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true });
  });
});

// --- Admin Roles API ---
// GET all admin roles
router.get('/roles', (req, res) => {
  db.query('SELECT * FROM admin_roles ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results });
  });
});

// POST new admin role
router.post('/roles', (req, res) => {
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
router.put('/roles/:id', (req, res) => {
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

// Permissions: attach structured JSON to admin_roles.permission_summary and expose as array
// GET permissions for a role
router.get('/roles/:id/permissions', (req, res) => {
  db.query('SELECT permission_summary FROM admin_roles WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Role not found' });
    const raw = rows[0].permission_summary || '';
    let permissions = [];
    try { permissions = JSON.parse(raw); if (!Array.isArray(permissions)) permissions = []; }
    catch {
      const trimmed = String(raw || '').trim();
      if (trimmed && trimmed.toLowerCase().includes('all')) {
        permissions = ['*'];
      } else {
        permissions = (trimmed || '').split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return res.json({ success: true, data: permissions });
  });
});

// PUT permissions for a role
router.put('/roles/:id/permissions', (req, res) => {
  const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
  const json = JSON.stringify(permissions);
  db.query('UPDATE admin_roles SET permission_summary = ? WHERE id = ?', [json, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    return res.json({ success: true, data: permissions });
  });
});

// DELETE an admin role
router.delete('/roles/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM admin_roles WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Role deleted successfully' });
  });
});

// GET a single admin role by id
router.get('/roles/:id', (req, res) => {
  db.query('SELECT * FROM admin_roles WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0) return res.status(404).json({ success: false, message: "Role not found" });
    res.json({ success: true, data: results[0] });
  });
});

// --- Client Users API ---
// Get all client users with role name
router.get("/client-users", authenticateJWT, (req, res) => {
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
router.get("/client-users/:id", (req, res) => {
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
router.post("/client-users", (req, res) => {
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
router.put("/client-users/:id", (req, res) => {
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
router.delete("/client-users/:id", (req, res) => {
  db.query("DELETE FROM client_users WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  });
});

// Reset a client user's password
router.post("/client-users/:id/reset-password", async (req, res) => {
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
router.put("/client-users/:id/status", (req, res) => {
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

module.exports = router;

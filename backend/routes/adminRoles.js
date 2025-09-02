const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all admin roles (public endpoint)
router.get('/', (req, res) => {
  db.query('SELECT * FROM admin_roles ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results });
  });
});

// GET a single admin role by id
router.get('/:id', (req, res) => {
  db.query('SELECT * FROM admin_roles WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0) return res.status(404).json({ success: false, message: "Role not found" });
    res.json({ success: true, data: results[0] });
  });
});

// GET permissions for a role
router.get('/:id/permissions', (req, res) => {
  db.query('SELECT permission_summary FROM admin_roles WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Role not found' });
    const raw = rows[0].permission_summary || '';
    let permissions = [];
    try { 
      permissions = JSON.parse(raw); 
      if (!Array.isArray(permissions)) permissions = []; 
    } catch {
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

// PUT update an admin role
router.put('/:id', (req, res) => {
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

// PUT permissions for a role
router.put('/:id/permissions', (req, res) => {
  const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
  const json = JSON.stringify(permissions);
  db.query('UPDATE admin_roles SET permission_summary = ? WHERE id = ?', [json, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    return res.json({ success: true, data: permissions });
  });
});

// POST new admin role
router.post('/', (req, res) => {
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

// DELETE an admin role
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM admin_roles WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Role deleted successfully' });
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Get all client users with role name
router.get("/", authenticateJWT, (req, res) => {
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

// Get client users for a specific client (by clientId)
router.get("/client/:clientId", authenticateJWT, (req, res) => {
  const clientId = req.params.clientId;
  db.query(
    `SELECT cu.*, ur.role_name 
     FROM client_users cu 
     LEFT JOIN user_roles ur ON cu.role_id = ur.id
     WHERE cu.client_id = ?`,
    [clientId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: results });
    }
  );
});

// Get a single client user
router.get("/:id", (req, res) => {
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
router.post("/", async (req, res) => {
  const { full_name, email, phone, role_id, status, last_login, client_id, password } = req.body;
  
  try {
    // Hash the password if provided
    let hashedPassword = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    const payload = { ...req.body, client_id: Number(client_id) };
    db.query(
      "INSERT INTO client_users (full_name, email, phone, role_id, status, last_login, client_id, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [full_name, email, phone, role_id, status, last_login, client_id, hashedPassword],
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
  } catch (error) {
    console.error('Error creating client user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a client user
router.put("/:id", (req, res) => {
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
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM client_users WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  });
});

// Reset a client user's password
router.post("/:id/reset-password", async (req, res) => {
  const userId = req.params.id;
  const { oldPassword, password, newPassword } = req.body;
  const bcrypt = require('bcryptjs');

  console.log('Reset password request for user:', userId);
  console.log('Request body:', req.body);

  // Use newPassword if provided, otherwise use password
  const finalPassword = newPassword || password;

  if (!finalPassword) {
    console.log('No password provided in request');
    return res.status(400).json({ success: false, message: 'New password is required' });
  }

  try {
    db.query('SELECT password FROM client_users WHERE id = ?', [userId], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (results.length === 0) {
        console.log('User not found with id:', userId);
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      console.log('User found, current password hash exists:', !!results[0].password);
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

      console.log('Hashing new password...');
      const newHashedPassword = await bcrypt.hash(finalPassword, 10);
      
      db.query('UPDATE client_users SET password = ? WHERE id = ?', [newHashedPassword, userId], (err2) => {
        if (err2) {
          console.error('Error updating password:', err2);
          return res.status(500).json({ success: false, message: 'Failed to update password' });
        }
        console.log('Password updated successfully for user:', userId);
        res.json({ success: true, message: 'Password updated successfully' });
      });
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Activate or deactivate a client user (only updates status)
router.put("/:id/status", (req, res) => {
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

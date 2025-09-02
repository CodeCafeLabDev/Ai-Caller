const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

// Client Users Routes

// Get all client users
router.get("/", (req, res) => {
  db.query("SELECT * FROM client_users", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch client users", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get client users by client_id
router.get("/client/:clientId", (req, res) => {
  const clientId = req.params.clientId;
  db.query("SELECT * FROM client_users WHERE client_id = ?", [clientId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch client users", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Create client user
router.post("/", async (req, res) => {
  const user = req.body;
  delete user.id;

  try {
    if (user.password) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
    }

    db.query("INSERT INTO client_users SET ?", user, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to create client user", error: err });
      }
      res.status(201).json({ success: true, message: "Client user created", id: result.insertId });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create client user", error: error.message });
  }
});

// Update client user
router.put("/:id", async (req, res) => {
  const userId = req.params.id;
  const updatedUser = req.body;

  try {
    if (updatedUser.password && updatedUser.password !== '') {
      const hashedPassword = await bcrypt.hash(updatedUser.password, 10);
      updatedUser.password = hashedPassword;
    } else {
      delete updatedUser.password;
    }

    db.query("UPDATE client_users SET ? WHERE id = ?", [updatedUser, userId], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to update client user", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Client user not found" });
      }
      res.json({ success: true, message: "Client user updated" });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update client user", error: error.message });
  }
});

// Delete client user
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM client_users WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete client user", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Client user not found" });
    }
    res.json({ success: true, message: "Client user deleted" });
  });
});

// User Roles Routes

// Get all user roles
router.get("/roles", (req, res) => {
  db.query("SELECT * FROM user_roles", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch user roles", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get user role by id
router.get("/roles/:id", (req, res) => {
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

// Create user role
router.post("/roles", (req, res) => {
  const role = req.body;
  delete role.id;

  db.query("INSERT INTO user_roles SET ?", role, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to create user role", error: err });
    }
    res.status(201).json({ success: true, message: "User role created", id: result.insertId });
  });
});

// Update user role
router.put("/roles/:id", (req, res) => {
  const roleId = req.params.id;
  const updatedRole = req.body;

  db.query("UPDATE user_roles SET ? WHERE id = ?", [updatedRole, roleId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to update user role", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User role not found" });
    }
    res.json({ success: true, message: "User role updated" });
  });
});

// Delete user role
router.delete("/roles/:id", (req, res) => {
  db.query("DELETE FROM user_roles WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete user role", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User role not found" });
    }
    res.json({ success: true, message: "User role deleted" });
  });
});

module.exports = router;
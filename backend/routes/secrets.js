const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

// Get all workspace secrets
router.get("/", (req, res) => {
  db.query("SELECT * FROM workspace_secrets", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch workspace secrets", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get workspace secret by id
router.get("/:id", (req, res) => {
  db.query("SELECT * FROM workspace_secrets WHERE id = ?", [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch workspace secret", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Workspace secret not found" });
    }
    res.json({ success: true, data: results[0] });
  });
});

// Create workspace secret
router.post("/", (req, res) => {
  const secret = req.body;
  delete secret.id;

  db.query("INSERT INTO workspace_secrets SET ?", secret, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to create workspace secret", error: err });
    }
    res.status(201).json({ success: true, message: "Workspace secret created", id: result.insertId });
  });
});

// Update workspace secret
router.put("/:id", (req, res) => {
  const secretId = req.params.id;
  const updatedSecret = req.body;

  db.query("UPDATE workspace_secrets SET ? WHERE id = ?", [updatedSecret, secretId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to update workspace secret", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Workspace secret not found" });
    }
    res.json({ success: true, message: "Workspace secret updated" });
  });
});

// Delete workspace secret
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM workspace_secrets WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete workspace secret", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Workspace secret not found" });
    }
    res.json({ success: true, message: "Workspace secret deleted" });
  });
});

module.exports = router;


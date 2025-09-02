const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

// Get all knowledge base entries
router.get("/", (req, res) => {
  db.query("SELECT * FROM knowledge_base", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch knowledge base", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get knowledge base entries by client
router.get("/client/:clientId", (req, res) => {
  const clientId = req.params.clientId;
  db.query("SELECT * FROM knowledge_base WHERE client_id = ?", [clientId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch client knowledge base", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Create knowledge base entry
router.post("/", (req, res) => {
  const entry = req.body;
  delete entry.id;

  db.query("INSERT INTO knowledge_base SET ?", entry, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to create knowledge base entry", error: err });
    }
    res.status(201).json({ success: true, message: "Knowledge base entry created", id: result.insertId });
  });
});

// Update knowledge base entry
router.put("/:id", (req, res) => {
  const entryId = req.params.id;
  const updatedEntry = req.body;

  db.query("UPDATE knowledge_base SET ? WHERE id = ?", [updatedEntry, entryId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to update knowledge base entry", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Knowledge base entry not found" });
    }
    res.json({ success: true, message: "Knowledge base entry updated" });
  });
});

// Delete knowledge base entry
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM knowledge_base WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete knowledge base entry", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Knowledge base entry not found" });
    }
    res.json({ success: true, message: "Knowledge base entry deleted" });
  });
});

module.exports = router;


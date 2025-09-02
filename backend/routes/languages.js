const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

// Get all languages
router.get("/", (req, res) => {
  db.query("SELECT * FROM languages", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch languages", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get enabled languages only
router.get("/enabled", (req, res) => {
  db.query("SELECT * FROM languages WHERE enabled = true", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch enabled languages", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get language by id
router.get("/:id", (req, res) => {
  db.query("SELECT * FROM languages WHERE id = ?", [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch language", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Language not found" });
    }
    res.json({ success: true, data: results[0] });
  });
});

// Create language
router.post("/", (req, res) => {
  const language = req.body;
  delete language.id;

  db.query("INSERT INTO languages SET ?", language, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to create language", error: err });
    }
    res.status(201).json({ success: true, message: "Language created", id: result.insertId });
  });
});

// Update language
router.put("/:id", (req, res) => {
  const languageId = req.params.id;
  const updatedLanguage = req.body;

  db.query("UPDATE languages SET ? WHERE id = ?", [updatedLanguage, languageId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to update language", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Language not found" });
    }
    res.json({ success: true, message: "Language updated" });
  });
});

// Delete language
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM languages WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete language", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Language not found" });
    }
    res.json({ success: true, message: "Language deleted" });
  });
});

module.exports = router;


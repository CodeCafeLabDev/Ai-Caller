const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

// Get all MCP servers
router.get("/", (req, res) => {
  db.query("SELECT * FROM mcp_servers", (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch MCP servers", error: err });
    }
    res.json({ success: true, data: results });
  });
});

// Get MCP server by id
router.get("/:id", (req, res) => {
  db.query("SELECT * FROM mcp_servers WHERE id = ?", [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch MCP server", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "MCP server not found" });
    }
    res.json({ success: true, data: results[0] });
  });
});

// Create MCP server
router.post("/", (req, res) => {
  const server = req.body;
  delete server.id;

  db.query("INSERT INTO mcp_servers SET ?", server, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to create MCP server", error: err });
    }
    res.status(201).json({ success: true, message: "MCP server created", id: result.insertId });
  });
});

// Update MCP server
router.put("/:id", (req, res) => {
  const serverId = req.params.id;
  const updatedServer = req.body;

  db.query("UPDATE mcp_servers SET ? WHERE id = ?", [updatedServer, serverId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to update MCP server", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "MCP server not found" });
    }
    res.json({ success: true, message: "MCP server updated" });
  });
});

// Delete MCP server
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM mcp_servers WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to delete MCP server", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "MCP server not found" });
    }
    res.json({ success: true, message: "MCP server deleted" });
  });
});

module.exports = router;


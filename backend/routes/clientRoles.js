const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all client roles (using user_roles table)
router.get('/', (req, res) => {
  db.query('SELECT * FROM user_roles ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error('Error fetching client roles:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch client roles'
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// Get client role by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM user_roles WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching client role:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch client role'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client role not found'
      });
    }
    
    res.json({
      success: true,
      data: results[0]
    });
  });
});

// Create new client role
router.post('/', (req, res) => {
  // Handle both field name formats from frontend
  const name = req.body.name || req.body.role_name;
  const description = req.body.description;
  const permission_summary = req.body.permission_summary || req.body.permissions_summary;
  const status = req.body.status;
  
  // Validate required fields
  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Role name is required and cannot be empty'
    });
  }
  
  const query = `
    INSERT INTO user_roles (role_name, description, permissions_summary, status)
    VALUES (?, ?, ?, ?)
  `;
  
  db.query(query, [name.trim(), description || '', permission_summary || '', status || 'Active'], (err, result) => {
    if (err) {
      console.error('Error creating client role:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to create client role'
      });
    }
    
    // Fetch the created role
    db.query('SELECT * FROM user_roles WHERE id = ?', [result.insertId], (err2, createdRole) => {
      if (err2) {
        console.error('Error fetching created role:', err2);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch created role'
        });
      }
      
      res.status(201).json({
        success: true,
        data: createdRole[0]
      });
    });
  });
});

// Update client role
router.put('/:id', (req, res) => {
  const { id } = req.params;
  // Handle both field name formats from frontend
  const name = req.body.name || req.body.role_name;
  const description = req.body.description;
  const permission_summary = req.body.permission_summary || req.body.permissions_summary;
  // Map status values to match database constraint (Active/Archived)
  let status = req.body.status;
  if (status === 'inactive') {
    status = 'Archived';
  } else if (status === 'active') {
    status = 'Active';
  }
  
  console.log('Update role request for ID:', id);
  console.log('Update role request body:', req.body);
  console.log('Extracted values:', { name, description, permission_summary, status });
  
  // Validate required fields
  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Role name is required and cannot be empty'
    });
  }
  
  const query = `
    UPDATE user_roles 
    SET role_name = ?, description = ?, permissions_summary = ?, status = ?
    WHERE id = ?
  `;
  
  console.log('Executing query:', query);
  console.log('Query parameters:', [name.trim(), description || '', permission_summary || '', status || 'Active', id]);
  
  db.query(query, [name.trim(), description || '', permission_summary || '', status || 'Active', id], (err, result) => {
    if (err) {
      console.error('Error updating client role:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update client role'
      });
    }
    
    console.log('Update result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client role not found'
      });
    }
    
    // Fetch the updated role
    db.query('SELECT * FROM user_roles WHERE id = ?', [id], (err2, updatedRole) => {
      if (err2) {
        console.error('Error fetching updated role:', err2);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch updated role'
        });
      }
      
      res.json({
        success: true,
        data: updatedRole[0]
      });
    });
  });
});

// Delete client role
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM user_roles WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting client role:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete client role'
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client role not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Client role deleted successfully'
    });
  });
});

module.exports = router;

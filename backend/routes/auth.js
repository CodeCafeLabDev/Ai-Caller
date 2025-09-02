// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

// Combined Login endpoint for both admins and clients
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);

  // First try admin login
  db.query('SELECT * FROM admin_users WHERE email = ?', [email], async (err, adminResults) => {
    if (err) {
      console.error('Admin lookup error:', err);
      return res.status(500).json({ success: false, message: 'DB error', error: err });
    }

    // If found in admin_users table
    if (adminResults.length > 0) {
      console.log('Found user in admin_users');
      const user = adminResults[0];
      try {
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          console.log('Admin password invalid');
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Update lastLogin to now
        db.query('UPDATE admin_users SET lastLogin = NOW() WHERE id = ?', [user.id]);

        const token = jwt.sign(
          { id: user.id, name: user.name, email: user.email, role: user.roleName, type: 'admin' },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        const isDev = process.env.NODE_ENV !== 'production';
        const useLax = isDev; // Always lax/ insecure in development for localhost workflows
        res.cookie('token', token, {
          httpOnly: true,
          sameSite: useLax ? 'lax' : 'none',
          secure: useLax ? false : true,
          domain: useLax ? 'localhost' : undefined,
          path: '/',
          maxAge: 24*60*60*1000
        });

        return res.json({ 
          success: true, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.roleName,
            type: 'admin'
          } 
        });
      } catch (err) {
        console.error('Error in admin authentication:', err);
        return res.status(500).json({ success: false, message: 'Authentication error' });
      }
    }

    // If not found in admin_users, try client login
    console.log('Not found in admin_users, trying clients table');
    db.query('SELECT * FROM clients WHERE companyEmail = ?', [email], async (err, clientResults) => {
      if (err) {
        console.error('Client lookup error:', err);
        return res.status(500).json({ success: false, message: 'DB error', error: err });
      }
      if (!clientResults.length) {
        console.log('Email not found in clients table');
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const client = clientResults[0];
      console.log('Found client:', { id: client.id, email: client.companyEmail });
      
      try {
        let isValidPassword = false;

        // First try bcrypt comparison (for hashed passwords)
        try {
          console.log('Trying bcrypt comparison');
          // Check if the stored password looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
          if (client.adminPassword && client.adminPassword.startsWith('$2')) {
            isValidPassword = await bcrypt.compare(password, client.adminPassword);
            console.log('Bcrypt comparison result:', isValidPassword);
          } else {
            // If not a bcrypt hash, do plain text comparison
            console.log('Stored password is not a bcrypt hash, trying plain-text comparison');
            isValidPassword = (password === client.adminPassword);
            console.log('Plain-text comparison result:', isValidPassword);

            // If plain-text password is correct, upgrade it to hashed
            if (isValidPassword) {
              console.log('Plain-text password matched. Upgrading to hashed password...');
              const hashedPassword = await bcrypt.hash(password, 10);
              db.query(
                'UPDATE clients SET adminPassword = ? WHERE id = ?',
                [hashedPassword, client.id],
                (updateErr) => {
                  if (updateErr) {
                    console.error('Failed to upgrade password to hash:', updateErr);
                  } else {
                    console.log('Successfully upgraded password to hash');
                  }
                }
              );
            }
          }
        } catch (hashError) {
          console.error('Error during password comparison:', hashError);
          // If any error occurs during bcrypt comparison, try plain text
          console.log('Error in password comparison, falling back to plain-text');
          isValidPassword = (password === client.adminPassword);
          console.log('Plain-text comparison result:', isValidPassword);

          // If plain-text password is correct, upgrade it to hashed
          if (isValidPassword) {
            console.log('Plain-text password matched. Upgrading to hashed password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query(
              'UPDATE clients SET adminPassword = ? WHERE id = ?',
              [hashedPassword, client.id],
              (updateErr) => {
                if (updateErr) {
                  console.error('Failed to upgrade password to hash:', updateErr);
                } else {
                  console.log('Successfully upgraded password to hash');
                }
              }
            );
          }
        }

        if (!isValidPassword) {
          console.log('Client password invalid');
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('Client password valid, creating token');
        const token = jwt.sign(
          { 
            id: client.id, 
            email: client.companyEmail, 
            role: 'client_admin',
            type: 'client',
            companyName: client.companyName 
          },
          JWT_SECRET,
          { expiresIn: '1d' }
        );

        // Set cookie for both same-origin and cross-origin scenarios
        const isLocalhost = req.headers.origin && req.headers.origin.includes('localhost');
        
        if (isLocalhost) {
          // For localhost, use lax sameSite
        res.cookie('token', token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 24*60*60*1000
        });
        } else {
          // For cross-origin (ngrok, server), use none sameSite with secure
          res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            path: '/',
            maxAge: 24*60*60*1000
          });
        }

        return res.json({ 
          success: true, 
          user: { 
            id: client.id, 
            email: client.companyEmail, 
            role: 'client_admin',
            type: 'client',
            companyName: client.companyName 
          } 
        });
      } catch (err) {
        console.error('Error in client authentication:', err);
        return res.status(500).json({ success: false, message: 'Authentication error' });
      }
    });
  });
});

// Client Admin Login endpoint
router.post('/client-admin/login', async (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM clients WHERE companyEmail = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error', error: err });
    if (!results.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
    const client = results[0];
    try {
      let isValidPassword = false;

      // First try bcrypt comparison (for hashed passwords)
      try {
        isValidPassword = await bcrypt.compare(password, client.adminPassword);
      } catch (hashError) {
        // If bcrypt.compare fails, it might be a plain-text password
        console.log('Hash comparison failed, trying plain-text comparison');
        isValidPassword = (password === client.adminPassword);

        // If plain-text password is correct, upgrade it to hashed
        if (isValidPassword) {
          console.log('Plain-text password matched. Upgrading to hashed password...');
          const hashedPassword = await bcrypt.hash(password, 10);
          db.query(
            'UPDATE clients SET adminPassword = ? WHERE id = ?',
            [hashedPassword, client.id],
            (updateErr) => {
              if (updateErr) {
                console.error('Failed to upgrade password to hash:', updateErr);
                // Continue anyway since login is successful
              } else {
                console.log('Successfully upgraded password to hash');
              }
            }
          );
        }
      }

      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Create JWT token for client admin
      const token = jwt.sign(
        { 
          id: client.id, 
          email: client.companyEmail, 
          role: 'client_admin',
          companyName: client.companyName 
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Set cookie for both same-origin and cross-origin scenarios
      const isDev = process.env.NODE_ENV !== 'production';
      const useLax = isDev; // Always lax/ insecure in development for localhost workflows
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: useLax ? 'lax' : 'none',
        secure: useLax ? false : true,
        domain: useLax ? 'localhost' : undefined,
        path: '/',
        maxAge: 24*60*60*1000
      });

      res.json({ 
        success: true, 
        user: { 
          id: client.id, 
          email: client.companyEmail, 
          role: 'client_admin',
          companyName: client.companyName 
        } 
      });
    } catch (err) {
      console.error('Error in authentication:', err);
      res.status(500).json({ success: false, message: 'Authentication error' });
    }
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    path: '/'
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;

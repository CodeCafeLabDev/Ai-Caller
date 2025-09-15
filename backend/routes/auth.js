
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
          JWT_SECRET
          // No expiresIn - token will not expire until manual logout
        );
        
        // Set cookie with proper configuration for production
        const cookieOptions = {
          httpOnly: true,
          path: '/',
          // No maxAge - cookie will persist until manual logout
        };
        
        // Configure for production vs development
        if (process.env.NODE_ENV === 'production') {
          cookieOptions.sameSite = 'none';
          cookieOptions.secure = true;
        } else {
          cookieOptions.sameSite = 'lax';
          cookieOptions.secure = false;
          // Don't set domain for localhost - let browser handle it
        }
        
        res.cookie('token', token, cookieOptions);
        console.log('Cookie set with options:', cookieOptions);
        console.log('Token set in cookie:', token.substring(0, 20) + '...');

        return res.json({ 
          success: true, 
          token: token, // Include token in response for localStorage fallback
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
          JWT_SECRET
          // No expiresIn - token will not expire until manual logout
        );

        // Set cookie with proper configuration for production
        const cookieOptions = {
          httpOnly: true,
          path: '/',
          // No maxAge - cookie will persist until manual logout
        };
        
        // Configure for production vs development
        if (process.env.NODE_ENV === 'production') {
          cookieOptions.sameSite = 'none';
          cookieOptions.secure = true;
        } else {
          cookieOptions.sameSite = 'lax';
          cookieOptions.secure = false;
          // Don't set domain for localhost - let browser handle it
        }
        
        res.cookie('token', token, cookieOptions);

        return res.json({ 
          success: true, 
          token: token, // Include token in response for localStorage fallback
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
        JWT_SECRET
        // No expiresIn - token will not expire until manual logout
      );

      // Set cookie with proper configuration for production
      const cookieOptions = {
        httpOnly: true,
        path: '/',
        maxAge: 24*60*60*1000 // 24 hours
      };
      
      // Configure for production vs development
      if (process.env.NODE_ENV === 'production') {
        cookieOptions.sameSite = 'none';
        cookieOptions.secure = true;
      } else {
        cookieOptions.sameSite = 'lax';
        cookieOptions.secure = false;
      }
      
      res.cookie('token', token, cookieOptions);

      res.json({ 
        success: true, 
        token: token, // Include token in response for localStorage fallback
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

// Client User Login endpoint
router.post('/client-user/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Client user login attempt for:', email);
  
  // Find client user with role information
  db.query(`
    SELECT cu.*, ur.role_name, ur.permissions_summary, c.companyName 
    FROM client_users cu 
    LEFT JOIN user_roles ur ON cu.role_id = ur.id
    LEFT JOIN clients c ON cu.client_id = c.id
    WHERE cu.email = ? AND cu.status = 'Active'
  `, [email], async (err, results) => {
    if (err) {
      console.error('Client user lookup error:', err);
      return res.status(500).json({ success: false, message: 'DB error', error: err });
    }
    
    if (!results.length) {
      console.log('Client user not found or inactive');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const clientUser = results[0];
    console.log('Found client user:', { id: clientUser.id, email: clientUser.email, role: clientUser.role_name });
    console.log('Client user fields:', Object.keys(clientUser));
    console.log('Client user password field:', clientUser.password);
    
    try {
      let isValidPassword = false;

      // Check if password field exists
      if (!clientUser.password) {
        console.log('No password field found in client user record');
        // For now, allow login with any password if no password is set (temporary solution)
        isValidPassword = true;
        console.log('Allowing login without password validation (temporary)');
      } else {
        // First try bcrypt comparison (for hashed passwords)
        try {
          isValidPassword = await bcrypt.compare(password, clientUser.password);
        } catch (hashError) {
          // If bcrypt.compare fails, it might be a plain-text password
          console.log('Hash comparison failed, trying plain-text comparison');
          isValidPassword = (password === clientUser.password);

          // If plain-text password is correct, upgrade it to hashed
          if (isValidPassword) {
            console.log('Plain-text password matched. Upgrading to hashed password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query(
              'UPDATE client_users SET password = ? WHERE id = ?',
              [hashedPassword, clientUser.id],
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
      }

      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Update last login
      db.query(
        'UPDATE client_users SET last_login = NOW() WHERE id = ?',
        [clientUser.id],
        (updateErr) => {
          if (updateErr) {
            console.error('Failed to update last login:', updateErr);
            // Continue anyway since login is successful
          }
        }
      );

      // Parse permissions
      let permissions = [];
      try {
        permissions = JSON.parse(clientUser.permissions_summary || '[]');
      } catch (parseError) {
        console.error('Error parsing permissions:', parseError);
        permissions = [];
      }

      // Create JWT token for client user
      const token = jwt.sign(
        { 
          id: clientUser.id, 
          email: clientUser.email, 
          role: 'client_user',
          role_name: clientUser.role_name,
          permissions: permissions,
          client_id: clientUser.client_id,
          companyName: clientUser.companyName,
          full_name: clientUser.full_name
        },
        JWT_SECRET
        // No expiresIn - token will not expire until manual logout
      );

      // Set cookie with proper configuration for production
      const cookieOptions = {
        httpOnly: true,
        path: '/',
        maxAge: 24*60*60*1000 // 24 hours
      };
      
      // Configure for production vs development
      if (process.env.NODE_ENV === 'production') {
        cookieOptions.sameSite = 'none';
        cookieOptions.secure = true;
      } else {
        cookieOptions.sameSite = 'lax';
        cookieOptions.secure = false;
      }
      
      res.cookie('token', token, cookieOptions);

      res.json({ 
        success: true, 
        token: token, // Include token in response for localStorage fallback
        user: { 
          id: clientUser.id, 
          email: clientUser.email, 
          role: 'client_user',
          role_name: clientUser.role_name,
          permissions: permissions,
          client_id: clientUser.client_id,
          companyName: clientUser.companyName,
          full_name: clientUser.full_name
        } 
      });
    } catch (err) {
      console.error('Error in client user authentication:', err);
      res.status(500).json({ success: false, message: 'Authentication error' });
    }
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    path: '/'
  };
  
  // Configure for production vs development
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.sameSite = 'none';
    cookieOptions.secure = true;
  } else {
    cookieOptions.sameSite = 'lax';
    cookieOptions.secure = false;
  }
  
  res.clearCookie('token', cookieOptions);
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;


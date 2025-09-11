// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// JWT middleware
function authenticateJWT(req, res, next) {
  console.log('Auth middleware - cookies received:', req.cookies);
  const token = req.cookies.token;
  
  if (!token) {
    console.log('No token found in cookies');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
}

module.exports = { authenticateJWT, JWT_SECRET };


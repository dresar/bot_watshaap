const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware for authentication
const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.redirect('/login');
};

// Login page
router.get('/login', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  res.render('login');
});

// Login process
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check credentials against environment variables
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username === validUsername && password === validPassword) {
      // Set session
      req.session.isAuthenticated = true;
      req.session.user = { username };
      
      // Generate JWT token
      const token = jwt.sign(
        { username },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '1d' }
      );
      
      // Set cookie with token
      res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      
      req.flash('success', 'Login successful');
      return res.redirect('/admin/dashboard');
    }
    
    req.flash('error', 'Invalid username or password');
    res.redirect('/login');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login');
    res.redirect('/login');
  }
});

// Logout
router.get('/logout', (req, res) => {
  // Clear session
  req.session.destroy();
  
  // Clear cookie
  res.clearCookie('auth_token');
  
  res.redirect('/login');
});

// API authentication middleware
const apiAuth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
      
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('API authentication error:', error);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// API login endpoint
router.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check credentials against environment variables
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username === validUsername && password === validPassword) {
      // Generate JWT token
      const token = jwt.sign(
        { username },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '1d' }
      );
      
      return res.json({
        success: true,
        token,
        user: { username }
      });
    }
    
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    console.error('API login error:', error);
    res.status(500).json({ success: false, message: 'Login error' });
  }
});

// Export router and middleware functions
module.exports = router;
module.exports.isAuthenticated = isAuthenticated;
module.exports.apiAuth = apiAuth;
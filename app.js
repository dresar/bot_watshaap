require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const whatsappRoutes = require('./routes/whatsapp');
const apiRoutes = require('./routes/api');

// Import WhatsApp client initialization
const { initWhatsApp } = require('./services/whatsapp');

// Initialize scheduled messages service
const { initScheduler } = require('./services/scheduler');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using HTTPS
}));
app.use(flash());

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/admin');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Global middleware for authentication status
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  res.locals.user = req.session.user || null;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.path = req.path; // Add path to locals for layout
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/api', apiRoutes);

// Home route
app.get('/', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  res.render('login');
});

// Initialize WhatsApp client
initWhatsApp();

// Initialize scheduler for scheduled messages
initScheduler();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
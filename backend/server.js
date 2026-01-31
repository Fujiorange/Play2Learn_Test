// backend/server.js - Play2Learn Backend - WITH PARENT ROUTES
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const path = require('path');

// ==================== CORS CONFIGURATION ====================
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://play2learn-test.onrender.com',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        console.log('⚠️ CORS blocked in production:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

console.log('🚀 Starting Play2Learn Server...');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔗 MongoDB:', MONGODB_URI.includes('localhost') ? 'Local' : 'Atlas Cloud');

// Mongoose 9.1.3 connection (no options needed)
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🏢 Host:', mongoose.connection.host);
    console.log('✅ Ready to accept connections');
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.log('\n💡 TROUBLESHOOTING TIPS:');
    console.log('1. Check MONGODB_URI in Render environment variables');
    console.log('2. Whitelist IP 0.0.0.0/0 in MongoDB Atlas Network Access');
    console.log('3. Verify database user credentials');
    console.log('4. Check if cluster is running (not paused)');
    
    if (process.env.NODE_ENV === 'production') {
      console.log('🚫 Exiting - Database required in production');
      process.exit(1);
    } else {
      console.log('⚠️  Continuing without database for development...');
    }
  });

// ==================== JWT CONFIGURATION ====================
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Validate JWT_SECRET in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-this-in-production') {
    console.error('❌ ERROR: JWT_SECRET must be set in production environment!');
    console.error('💡 Set JWT_SECRET in Render dashboard as a secure random string');
    process.exit(1);
  }
}

// ==================== AUTHENTICATION MIDDLEWARE ====================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Auth check:', req.method, req.path, token ? 'Token present' : 'No token');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
}

// ==================== STATIC FILES (PRODUCTION) ====================
if (process.env.NODE_ENV === 'production') {
  // Serve static frontend files
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// ==================== REQUEST LOGGING ====================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString().split('T')[1]} - ${req.method} ${req.path}`);
  next();
});

// ==================== MODEL IMPORTS (MUST BE BEFORE ROUTES!) ====================
// ✅ CRITICAL FIX: Load User model BEFORE loading routes
try {
  const User = require('./models/User');
  console.log('✅ User model loaded');
} catch (error) {
  console.error('❌ Error loading User model:', error.message);
  console.error('💡 Make sure ./models/User.js exists');
}

// ==================== ROUTE IMPORTS ====================
try {
  const mongoAuthRoutes = require('./routes/mongoAuthRoutes');
  const mongoStudentRoutes = require('./routes/mongoStudentRoutes');
  const mongoTeacherRoutes = require('./routes/mongoTeacherRoutes');
  const schoolAdminRoutes = require('./routes/schoolAdminRoutes');
  const mongoParentRoutes = require('./routes/mongoParentRoutes'); // ✅ ADDED
  
  app.use('/api/mongo/auth', mongoAuthRoutes);
  app.use('/api/auth', mongoAuthRoutes); // Backward compatibility
  app.use('/api/mongo/student', authenticateToken, mongoStudentRoutes);
  app.use('/school-admin', schoolAdminRoutes);
  app.use('/api/mongo/parent', mongoParentRoutes); // ✅ ADDED - Parent routes
  app.use('/api/mongo/teacher', authenticateToken, mongoTeacherRoutes);
  app.use('/api/mongo/school-admin', schoolAdminRoutes);
  
  console.log('✅ Routes loaded successfully');
  console.log('✅ Parent routes: /api/mongo/parent/*'); // ✅ ADDED
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.log('⚠️  Some routes may not be available');
}

// ==================== TEST ENDPOINTS ====================
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][dbStatus];
  
  res.json({ 
    success: dbStatus === 1, 
    message: dbStatus === 1 ? 'Server is healthy' : 'Server running (no DB)',
    database: {
      status: statusText,
      connected: dbStatus === 1,
      type: process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local MongoDB'
    },
    server: {
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Play2Learn API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      test: '/api/test',
      health: '/api/health',
      auth: '/api/auth/*',
      student: '/api/mongo/student/*',
      parent: '/api/mongo/parent/*', // ✅ ADDED
      admin: '/school-admin/*'
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ==================== PRODUCTION FALLBACK ====================
if (process.env.NODE_ENV === 'production') {
  // Serve index.html for all unknown routes (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// ==================== ERROR HANDLERS ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found: ' + req.url,
    available: ['/', '/api/test', '/api/health', '/api/auth/*', '/api/mongo/*']
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║          🚀 Play2Learn Server               ║');
  console.log(`║          📍 Port: ${PORT}                       ║`);
  console.log(`║          🌍 URL: ${process.env.NODE_ENV === 'production' ? 'https://play2learn-test.onrender.com' : `http://localhost:${PORT}`} ║`);
  console.log('║          🗄️  Database: ' + 
    (mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected') + 
    '           ║');
  console.log('║          🔐 JWT: ' + 
    (process.env.JWT_SECRET ? '✅ Set' : '❌ Using default') + 
    '                   ║');
  console.log('╚═══════════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
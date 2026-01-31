// backend/server.js - Play2Learn Backend
// backend/server.js - Play2Learn Backend - WITH PARENT ROUTES
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Importing route files
const authRoutes = require('./routes/mongoAuthRoutes');
const studentRoutes = require('./routes/mongoStudentRoutes');
const schoolAdminRoutes = require('./routes/schoolAdminRoutes');
const p2lAdminRoutes = require('./routes/p2lAdminRoutes');
const adaptiveQuizRoutes = require('./routes/adaptiveQuizRoutes');
const path = require('path');

// ==================== CORS CONFIGURATION ====================
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'https://play2learn-test.onrender.com',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
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
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

console.log('🚀 Starting Play2Learn Server...');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔗 MongoDB:', MONGODB_URI.includes('localhost') ? 'Local' : 'Atlas Cloud');

// ==================== JWT CONFIGURATION ====================
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-this-in-production')) {
  console.error('❌ ERROR: JWT_SECRET must be set in the production environment!');
  process.exit(1);
}

// ==================== AUTHENTICATION MIDDLEWARE ====================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ==================== PUBLIC LANDING PAGE ENDPOINT ====================
// Public endpoint to fetch landing page blocks (no authentication required)
const LandingPage = require('./models/LandingPage');

app.get('/api/public/landing-page', async (req, res) => {
  try {
    // Get the active landing page or the most recent one
    let landingPage = await LandingPage.findOne({ is_active: true });
    
    if (!landingPage) {
      // If no active page, get the most recent one
      landingPage = await LandingPage.findOne().sort({ createdAt: -1 });
    }
    
    if (!landingPage) {
      // If no landing page exists at all, return empty structure
      return res.json({
        success: true,
        blocks: [],
        message: 'No landing page found'
      });
    }

    res.json({
      success: true,
      blocks: landingPage.blocks || []
    });
  } catch (error) {
    console.error('Get public landing page error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch landing page' 
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

// ==================== ROUTE IMPORTS & REGISTRATION ====================
try {
  app.use('/api/mongo/auth', authRoutes); // User authentication
  app.use('/api/mongo/student', authenticateToken, studentRoutes); // Student-specific routes
  app.use('/api/mongo/school-admin', authenticateToken, schoolAdminRoutes); // School admin routes
  app.use('/api/p2ladmin', p2lAdminRoutes); // P2lAdmin routes
  app.use('/api/adaptive-quiz', adaptiveQuizRoutes); // Adaptive quiz routes
  console.log('✅ Registered all routes successfully.');
} catch (error) {
  console.error('❌ Error registering routes:', error.message);
}

// ==================== STATIC FILE SERVING ====================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
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

// ==================== TEST ENDPOINT ====================
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API working',
    environment: process.env.NODE_ENV || 'development',
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ==================== ERROR HANDLING ====================
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
    error: `Route not found: ${req.originalUrl}`,
  });
});

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start server
async function startServer() {
  try {
    // MongoDB default serverSelectionTimeoutMS is 30000ms (30 seconds)
    // We reduce it to 5000ms (5 seconds) for faster failure detection
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🏢 Host:', mongoose.connection.host);
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log('✅ Ready to accept connections');
    });
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.error('❌ Server startup aborted');
    process.exit(1);
  }
}
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

startServer();

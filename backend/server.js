// backend/server.js - Play2Learn Backend
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

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
        callback(null, true); // Allow all in development
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
console.log('🔗 MongoDB URI Type:', MONGODB_URI.includes('localhost') ? 'Local' : 'Atlas Cloud');

// Remove deprecated options - use modern Mongoose 7+ syntax
async function connectToDatabase() {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    
    // Modern Mongoose connection (no options needed for v7+)
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🏢 Host:', mongoose.connection.host);
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    
    // Show helpful error info
    console.log('\n💡 TROUBLESHOOTING TIPS:');
    console.log('1. Check MONGODB_URI in Render dashboard');
    console.log('2. Make sure IP is whitelisted in MongoDB Atlas');
    console.log('3. Verify database username/password');
    console.log('4. Check if cluster is running (not paused)');
    
    if (process.env.NODE_ENV === 'production') {
      console.log('🚫 Exiting - Database required in production');
      process.exit(1);
    } else {
      console.log('⚠️  Continuing without database for development...');
      return false;
    }
  }
}

// Connect to database
connectToDatabase();

// ==================== JWT CONFIGURATION ====================
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is required in production!');
  process.exit(1);
}

// ==================== REQUEST LOGGING ====================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString().split('T')[1]} - ${req.method} ${req.path}`);
  next();
});

// ==================== AUTHENTICATION MIDDLEWARE ====================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
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

// ==================== ROUTE IMPORTS ====================
try {
  const mongoAuthRoutes = require('./routes/mongoAuthRoutes');
  const mongoStudentRoutes = require('./routes/mongoStudentRoutes');
  const schoolAdminRoutes = require('./routes/schoolAdminRoutes');
  
  app.use('/api/auth', mongoAuthRoutes);
  app.use('/api/mongo/student', authenticateToken, mongoStudentRoutes);
  app.use('/api/school-admin', schoolAdminRoutes);
  
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
}

// ==================== TEST ENDPOINTS ====================
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/test/echo', (req, res) => {
  res.json({
    success: true,
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][dbStatus];
  
  res.json({ 
    success: true, 
    message: 'Play2Learn Server',
    status: 'running',
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

// ==================== ROOT ROUTE ====================
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
      admin: '/api/school-admin/*'
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ==================== ITEM TEST ROUTES ====================
app.post('/api/items', authenticateToken, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('items');
    
    const item = {
      title: req.body.title || 'Test Item',
      description: req.body.description || 'No description',
      createdBy: req.user.email || 'unknown',
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(item);
    
    res.status(201).json({
      success: true,
      message: 'Item created',
      item: { ...item, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      error: 'Database error: ' + error.message
    });
  }
});

app.get('/api/items', authenticateToken, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('items');
    const items = await collection.find({}).limit(50).toArray();
    
    res.json({
      success: true,
      count: items.length,
      items: items
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      error: 'Database error: ' + error.message
    });
  }
});

// ==================== ERROR HANDLERS ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found: ' + req.url,
    available: ['/', '/api/test', '/api/health', '/api/auth/*', '/api/items']
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
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║          🚀 Play2Learn Server               ║');
  console.log(`║          📍 Port: ${PORT}                       ║`);
  console.log(`║          🌐 http://localhost:${PORT}           ║`);
  console.log('║          🗄️  Database: ' + 
    (mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected') + 
    '           ║');
  console.log('╚══════════════════════════════════════════════╝');
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

// backend/server.js - Play2Learn Backend
// ✅ FIXED: Added public announcements endpoint
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
console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
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
const Testimonial = require('./models/Testimonial');

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

    // Get testimonials that should be displayed on landing page
    const displayTestimonials = await Testimonial.find({
      display_on_landing: true
    })
      .sort({ created_at: -1 })
      .limit(10);

    // Transform testimonials to the format expected by the frontend
    const testimonialData = displayTestimonials.map(t => ({
      name: t.student_name,
      role: t.user_role,
      quote: t.message,
      rating: t.rating,
      image: t.image_url || null
    }));

    // Clone blocks and inject testimonials into testimonial blocks
    // Use toObject() to properly serialize Mongoose subdocuments
    const blocks = (landingPage.blocks || []).map(block => {
      // Convert Mongoose subdocument to plain object for proper serialization
      const plainBlock = block.toObject ? block.toObject() : block;
      
      if (plainBlock.type === 'testimonials') {
        // Inject display testimonials into the testimonial block
        return {
          ...plainBlock,
          custom_data: {
            ...(plainBlock.custom_data || {}),
            testimonials: testimonialData
          }
        };
      }
      return plainBlock;
    });

    res.json({
      success: true,
      blocks: blocks
    });
  } catch (error) {
    console.error('Get public landing page error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch landing page' 
    });
  }
});

// ==================== PUBLIC MAINTENANCE BROADCAST ENDPOINT ====================
// Public endpoint to fetch active maintenance broadcasts (no authentication required)
const Maintenance = require('./models/Maintenance');

app.get('/api/public/maintenance', async (req, res) => {
  try {
    const now = new Date();
    
    // Get all active broadcasts that:
    // 1. is_active = true
    // 2. start_date <= now
    // 3. end_date is null OR end_date >= now
    const broadcasts = await Maintenance.find({
      is_active: true,
      start_date: { $lte: now },
      $or: [
        { end_date: null },
        { end_date: { $gte: now } }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      broadcasts: broadcasts
    });
  } catch (error) {
    console.error('Get public maintenance broadcasts error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch maintenance broadcasts' 
    });
  }
});

// ==================== PUBLIC ANNOUNCEMENTS ENDPOINT ====================
// ✅ NEW: Public endpoint for students to view school announcements (no authentication required)
app.get('/school-admin/announcements/public', async (req, res) => {
  try {
    const { audience } = req.query;
    
    console.log('📢 Fetching public announcements for:', audience || 'all');
    
    const db = mongoose.connection.db;
    const now = new Date();
    
    // Base filter: not expired
    let filter = {
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null },
        { expiresAt: { $exists: false } }
      ]
    };
    
    // Add audience filter if specified
    if (audience && audience !== 'all') {
      const audienceNormalized = audience.toLowerCase();
      const audienceMatches = ['all']; // Always include 'all' audience
      
      if (audienceNormalized.includes('student')) {
        audienceMatches.push('student', 'students');
      } else if (audienceNormalized.includes('teacher')) {
        audienceMatches.push('teacher', 'teachers');
      } else if (audienceNormalized.includes('parent')) {
        audienceMatches.push('parent', 'parents');
      } else {
        audienceMatches.push(audienceNormalized);
      }
      
      filter = {
        $and: [
          { $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: null },
            { expiresAt: { $exists: false } }
          ]},
          { $or: [
            { audience: { $in: audienceMatches } },
            { audience: { $exists: false } }
          ]}
        ]
      };
    }
    
    const announcements = await db.collection('announcements')
      .find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(50)
      .toArray();
    
    console.log(`✅ Found ${announcements.length} announcements for ${audience || 'all'}`);
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('❌ Get public announcements error:', error);
    res.status(500).json({ success: false, error: 'Failed to load announcements' });
  }
});

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
}

// ==================== ROUTE IMPORTS ====================
try {
  const mongoParentRoutes = require('./routes/mongoParentRoutes');
  const mongoTeacherRoutes = require('./routes/mongoTeacherRoutes');
  
  app.use('/api/mongo/parent', mongoParentRoutes); // Parent routes
  app.use('/api/mongo/teacher', authenticateToken, mongoTeacherRoutes);
  
  console.log('✅ Additional routes loaded successfully');
  console.log('✅ Parent routes: /api/mongo/parent/*');
} catch (error) {
  console.error('❌ Error loading additional routes:', error.message);
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
      parent: '/api/mongo/parent/*',
      admin: '/school-admin/*',
      announcements: '/school-admin/announcements/public' // ✅ NEW
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
    
    const server = app.listen(PORT, () => {
      console.log('╔═══════════════════════════════════════════════╗');
      console.log('║          🚀 Play2Learn Server               ║');
      console.log(`║          📍 Port: ${PORT}                       ║`);
      console.log(`║          🌐 URL: ${process.env.NODE_ENV === 'production' ? 'https://play2learn-test.onrender.com' : `http://localhost:${PORT}`} ║`);
      console.log('║          🗄️  Database: ✅ Connected           ║');
      console.log('║          🔐 JWT: ' + 
        (process.env.JWT_SECRET ? '✅ Set' : '❌ Using default') + 
        '                   ║');
      console.log('╚═══════════════════════════════════════════════╝');
      console.log('✅ Ready to accept connections');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.error('❌ Server startup aborted');
    process.exit(1);
  }
}

startServer();
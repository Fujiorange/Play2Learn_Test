// backend/server.js - UPDATED VERSION
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// ==================== MIDDLEWARE ====================
// Fix CORS - specify your frontend URL
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://play2learn-test.onrender.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATABASE CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

console.log('🔗 Connecting to MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Store db reference globally
  global.mongoDb = mongoose.connection.db;
  
  // Test database connection
  mongoose.connection.db.admin().ping()
    .then(() => console.log('✅ MongoDB ping successful'))
    .catch(err => console.error('❌ MongoDB ping failed:', err));
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
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
      console.error('❌ JWT verification failed:', err.message);
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
}

// ==================== ROUTES ====================
// Import routes
const mongoAuthRoutes = require('./routes/mongoAuthRoutes');
const mongoStudentRoutes = require('./routes/mongoStudentRoutes');

// ✅ ONLY USE ONE PATH - remove duplicate routes
app.use('/api/auth', mongoAuthRoutes);

// ✅ Add authentication middleware to student routes
app.use('/api/students', authenticateToken, mongoStudentRoutes);

// Test routes
app.get('/api/test/public', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Public API endpoint is working',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test/protected', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Protected API endpoint is working',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  res.json({ 
    success: true, 
    message: 'Server is running',
    mongodb: mongoStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ==================== SERVE FRONTEND ====================
const frontendPath = path.join(__dirname, '..', 'frontend', 'build');

console.log('🔍 Looking for frontend at:', frontendPath);

if (fs.existsSync(frontendPath)) {
  console.log('✅ Found frontend build at:', frontendPath);
  app.use(express.static(frontendPath));
  
  // Serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      return res.sendFile(path.join(frontendPath, 'index.html'));
    }
    next();
  });
} else {
  console.log('⚠️  Frontend build not found at:', frontendPath);
  
  // Simple dashboard
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Play2Learn Backend</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
          .container { max-width: 800px; margin: 0 auto; }
          .endpoints { text-align: left; background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
          code { background: #333; color: #fff; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Play2Learn Backend Running</h1>
          <p>Server is up and running. Available API endpoints:</p>
          
          <div class="endpoints">
            <h3>📡 API Endpoints:</h3>
            <ul>
              <li><strong>Health Check:</strong> <a href="/api/health"><code>GET /api/health</code></a></li>
              <li><strong>Public Test:</strong> <a href="/api/test/public"><code>GET /api/test/public</code></a></li>
              <li><strong>Protected Test:</strong> <code>GET /api/test/protected</code> (requires token)</li>
              <li><strong>Login:</strong> <code>POST /api/auth/login</code></li>
              <li><strong>Register:</strong> <code>POST /api/auth/register</code></li>
              <li><strong>Student Dashboard:</strong> <code>GET /api/students/dashboard</code> (requires token)</li>
            </ul>
          </div>
          
          <p>To build the frontend:</p>
          <pre style="background:#f0f0f0;padding:10px;display:inline-block;">
cd frontend && npm run build</pre>
          
          <p style="margin-top: 30px; color: #666;">
            Backend running on port ${process.env.PORT || 5000}<br>
            MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}
          </p>
        </div>
      </body>
      </html>
    `);
  });
}

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    path: req.path 
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║    🚀 Play2Learn Server running on port ${PORT}    ║
║    🌍 Environment: ${process.env.NODE_ENV || 'development'}                     ║
║    🗄️  Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}                ║
║                                               ║
║    📡 API Endpoints:                          ║
║    • GET  /api/health                         ║
║    • POST /api/auth/login                     ║
║    • POST /api/auth/register                  ║
║    • GET  /api/students/* (protected)         ║
╚═══════════════════════════════════════════════╝
  `);
});

// server.js - Play2Learn Backend (MongoDB Only)
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// ==================== MONGODB CONNECTION ====================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📦 Database:', mongoose.connection.name);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ==================== MONGODB AUTH ROUTES ====================
const mongoAuthRoutes = require('./routes/mongoAuthRoutes');
app.use('/api/mongo/auth', mongoAuthRoutes);

// For backward compatibility, also support /api/auth
app.use('/api/auth', mongoAuthRoutes);

// ==================== MONGODB STUDENT ROUTES ====================
const mongoStudentRoutes = require('./routes/mongoStudentRoutes');
app.use('/api/mongo/student', authenticateToken, mongoStudentRoutes);

// ==================== MONGODB ITEM ROUTES (Test routes) ====================

// Create item
app.post('/api/mongo/items', authenticateToken, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('items');

    const item = {
      title: req.body.title,
      description: req.body.description,
      created_by: req.user.email,
      created_at: new Date()
    };

    const result = await collection.insertOne(item);

    res.status(201).json({
      success: true,
      message: 'Item created',
      item: { ...item, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all items
app.get('/api/mongo/items', authenticateToken, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('items');

    const items = await collection.find({}).toArray();

    res.json({
      success: true,
      count: items.length,
      items: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== SERVE FRONTEND FILES ====================

// Try multiple possible paths for the frontend
const possibleFrontendPaths = [
  path.join(__dirname, 'frontend', 'build'),         // Built React app
  path.join(__dirname, 'frontend', 'public'),        // React public folder
  path.join(__dirname, 'frontend'),                  // Frontend root
  path.join(__dirname, '..', 'frontend', 'build'),   // Parent/frontend/build
  path.join(__dirname, '..', 'frontend', 'public'),  // Parent/frontend/public
  path.join(__dirname, '..', 'frontend'),            // Parent/frontend
];

// Find which path exists
let frontendPath = null;
for (const possiblePath of possibleFrontendPaths) {
  try {
    require('fs').accessSync(possiblePath);
    frontendPath = possiblePath;
    console.log(`📁 Found frontend at: ${frontendPath}`);
    break;
  } catch (err) {
    // Path doesn't exist, continue checking
  }
}

if (frontendPath) {
  console.log(`🌐 Serving frontend from: ${frontendPath}`);
  
  // Serve static files from the found frontend path
  app.use(express.static(frontendPath));
  
  // For all non-API routes, serve the React app
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Try to serve index.html from various possible locations
    const possibleIndexPaths = [
      path.join(frontendPath, 'index.html'),
      path.join(frontendPath, 'public', 'index.html'),
      path.join(frontendPath, 'build', 'index.html'),
      path.join(__dirname, 'frontend', 'build', 'index.html'),
    ];
    
    for (const indexPath of possibleIndexPaths) {
      try {
        if (require('fs').existsSync(indexPath)) {
          console.log(`📄 Serving index.html from: ${indexPath}`);
          return res.sendFile(indexPath);
        }
      } catch (err) {
        // File doesn't exist, continue checking
      }
    }
    
    // If no index.html found, fall back to dashboard
    console.log(`❌ No index.html found in frontend paths`);
    sendDashboard(req, res);
  });
} else {
  console.log('⚠️ No frontend folder found, showing dashboard only');
  
  // Fallback: Show dashboard for root route
  app.get('/', (req, res) => {
    sendDashboard(req, res);
  });
}

// ==================== HELPER FUNCTIONS ====================

// JWT authentication middleware
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

// Dashboard HTML
function sendDashboard(req, res) {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Play2Learn Server</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          text-align: center; 
          padding: 40px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          margin: 0;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 20px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .success { 
          color: #4ade80; 
          font-size: 28px; 
          margin-bottom: 20px;
        }
        .warning { 
          color: #fbbf24; 
          font-size: 18px; 
          margin: 20px 0;
          padding: 15px;
          background: rgba(251, 191, 36, 0.1);
          border-radius: 10px;
        }
        .endpoint {
          background: rgba(255, 255, 255, 0.15);
          padding: 15px;
          border-radius: 10px;
          margin: 10px 0;
          text-align: left;
          font-family: monospace;
          word-break: break-all;
        }
        .status {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          background: #4ade80;
          color: white;
          font-weight: bold;
          margin: 10px 0;
        }
        a {
          color: #93c5fd;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        code {
          background: rgba(0,0,0,0.2);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }
        .db-status {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          display: inline-block;
          margin: 10px 0;
        }
        .connected { background: #4ade80; color: white; }
        .disconnected { background: #f87171; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="success">✅ Play2Learn Server is Running!</h1>
        <div class="status">🚀 Server Operational</div>
        
        <div class="warning">
          ⚠️ Frontend not found. If you're expecting to see a React app:
          <ul style="text-align: left; margin: 10px 0;">
            <li>Make sure your frontend is in a <code>frontend</code> folder</li>
            <li>Run <code>npm run build</code> in the frontend folder</li>
            <li>Check the server logs for frontend path detection</li>
          </ul>
        </div>
        
        <div style="margin: 30px 0;">
          <h3>📊 Server Information</h3>
          <p><strong>📍 Port:</strong> ${process.env.PORT || 5000}</p>
          <p><strong>🍃 Database:</strong> MongoDB Atlas</p>
          <p><strong>📦 Database Name:</strong> ${mongoose.connection.name || 'Connecting...'}</p>
          <p><strong>📅 Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>📁 Frontend Path:</strong> ${frontendPath || 'Not found'}</p>
        </div>
        
        <div style="margin: 30px 0;">
          <h3>🔗 Quick Links</h3>
          <p>
            <a href="/api/health" style="background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 10px; display: inline-block; margin: 5px;">
              🩺 Health Check
            </a>
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <h3>🚀 Available API Endpoints</h3>
          
          <div class="endpoint">
            <strong>GET</strong> <a href="/api/health">/api/health</a>
            <div style="font-size: 14px; margin-top: 5px;">Check server health and MongoDB connection status</div>
          </div>
          
          <div class="endpoint">
            <strong>POST</strong> /api/mongo/auth/register
            <div style="font-size: 14px; margin-top: 5px;">Register a new user - Body: {email, password, name, role}</div>
          </div>
          
          <div class="endpoint">
            <strong>POST</strong> /api/mongo/auth/login
            <div style="font-size: 14px; margin-top: 5px;">Login user - Body: {email, password}</div>
          </div>
          
          <div class="endpoint">
            <strong>GET</strong> /api/mongo/student/profile
            <div style="font-size: 14px; margin-top: 5px;">Get student profile (requires JWT token)</div>
          </div>
          
          <div class="endpoint">
            <strong>POST</strong> /api/mongo/items
            <div style="font-size: 14px; margin-top: 5px;">Create item - Body: {title, description} (requires JWT token)</div>
          </div>
          
          <div class="endpoint">
            <strong>GET</strong> /api/mongo/items
            <div style="font-size: 14px; margin-top: 5px;">Get all items (requires JWT token)</div>
          </div>
        </div>
      </div>
      
      <script>
        // Check MongoDB connection status
        fetch('/api/health')
          .then(response => response.json())
          .then(data => {
            const dbStatusEl = document.createElement('div');
            dbStatusEl.className = data.mongodb === 'Connected' ? 'db-status connected' : 'db-status disconnected';
            dbStatusEl.textContent = 'Database: ' + (data.mongodb || 'Checking...');
            
            // Insert after server info
            const serverInfo = document.querySelector('div:nth-child(3)');
            if (serverInfo) {
              serverInfo.appendChild(dbStatusEl);
            }
            
            // Update status badge color
            const statusEl = document.querySelector('.status');
            if (data.success) {
              statusEl.style.background = '#4ade80';
            } else {
              statusEl.style.background = '#f87171';
              statusEl.textContent = '⚠️ Server Issues';
            }
          })
          .catch(err => {
            console.log('Health check failed:', err);
          });
      </script>
    </body>
    </html>
  `);
}

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 Play2Learn Server Running        ║
║   📍 Port: ${PORT}                        ║
║   🌐 http://localhost:${PORT}            ║
║   🍃 Database: MongoDB Atlas          ║
║   📱 Mode: ${process.env.NODE_ENV || 'development'}        ║
╚═══════════════════════════════════════╝
  `);
  
  // Log frontend search paths
  console.log('\n🔍 Searching for frontend in these paths:');
  possibleFrontendPaths.forEach((p, i) => {
    console.log(`  ${i+1}. ${p}`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

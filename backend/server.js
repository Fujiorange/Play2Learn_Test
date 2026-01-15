// server.js - Play2Learn Backend (MongoDB Only)
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
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

// ==================== MONGODB STUDENT ROUTES ====================
const mongoStudentRoutes = require('./routes/mongoStudentRoutes');
app.use('/api/mongo/student', authenticateToken, mongoStudentRoutes);

// ==================== MONGODB ITEM ROUTES (Your test routes) ====================

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 Play2Learn Server Running        ║
║   📍 Port: ${PORT}                        ║
║   🌐 http://localhost:${PORT}            ║
║   🍃 Database: MongoDB Atlas          ║
╚═══════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Middleware to authenticate P2L Admins
const authenticateP2LAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = mongoose.connection.db;
    const admin = await db.collection('users').findOne({ _id: mongoose.Types.ObjectId(decoded.userId), role: 'p2ladmin' });
    if (!admin) return res.status(403).json({ error: 'Access restricted to P2L Admins' });

    req.user = admin;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// ==================== Register P2L Admin ====================
// Public endpoint - allows creation of admin accounts
router.post('/register-admin', async (req, res) => {
  try {
    // Check MongoDB connection status
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const CONNECTED_STATE = 1;
    if (mongoose.connection.readyState !== CONNECTED_STATE) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database connection unavailable. Please try again later.' 
      });
    }

    const { email, password, name } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      });
    }

    const User = require('../models/User');

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin name from email if not provided
    const adminName = name || email.split('@')[0];

    // Create new admin user
    const newAdmin = new User({
      name: adminName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'p2ladmin',
      emailVerified: true,
      accountActive: true
    });

    await newAdmin.save();

    res.status(201).json({ 
      success: true, 
      message: 'Admin registration successful',
      user: {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (err) {
    console.error('Admin registration error:', err);
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred during registration';
    
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      errorMessage = 'Database connection error. Please try again later.';
    } else if (err.code === 11000) {
      // Duplicate key error (email already exists, but caught by validation)
      errorMessage = 'Email already registered';
    } else if (err.message) {
      // Log the actual error for debugging but don't expose internal details
      console.error('Detailed error:', err.message, err.stack);
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

// ==================== Default Health Check Endpoint ====================
router.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'success',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Health check failed' });
  }
});

// Other Admin Functions...
module.exports = router;

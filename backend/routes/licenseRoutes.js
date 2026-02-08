// backend/routes/licenseRoutes.js - License management routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const License = require('../models/License');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Authentication middleware
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

// Authorization middleware - P2L Admin only
function requireP2LAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'p2ladmin' && req.user.role !== 'Platform Admin')) {
    return res.status(403).json({ error: 'Access denied. P2L Admin privileges required.' });
  }
  next();
}

// GET /api/licenses - List all licenses
router.get('/licenses', authenticateToken, async (req, res) => {
  try {
    const licenses = await License.find({}).sort({ createdAt: 1 });
    return res.json({ success: true, licenses });
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch licenses' });
  }
});

// GET /api/licenses/:id - Get a single license
router.get('/licenses/:id', authenticateToken, async (req, res) => {
  try {
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ success: false, error: 'License not found' });
    }
    return res.json({ success: true, license });
  } catch (error) {
    console.error('Error fetching license:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch license' });
  }
});

// POST /api/licenses - Create a new license (P2L Admin only)
router.post('/licenses', authenticateToken, requireP2LAdmin, async (req, res) => {
  try {
    const {
      name,
      type,
      priceMonthly,
      priceYearly,
      maxTeachers,
      maxStudents,
      maxClasses,
      description,
      isActive
    } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Name and type are required' });
    }

    // Validate type is in allowed enum values
    const allowedTypes = ['trial', 'starter', 'professional', 'enterprise'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid license type. Must be one of: ${allowedTypes.join(', ')}` 
      });
    }

    const newLicense = new License({
      name,
      type,
      priceMonthly: priceMonthly || 0,
      priceYearly: priceYearly || 0,
      maxTeachers: maxTeachers || 1,
      maxStudents: maxStudents || 5,
      maxClasses: maxClasses || 1,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    });

    await newLicense.save();
    return res.json({ success: true, license: newLicense });
  } catch (error) {
    console.error('Error creating license:', error);
    
    // Provide specific error messages
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        error: `Validation error: ${messages.join(', ')}` 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create license' 
    });
  }
});

// PUT /api/licenses/:id - Update a license (P2L Admin only)
router.put('/licenses/:id', authenticateToken, requireP2LAdmin, async (req, res) => {
  try {
    const {
      name,
      priceMonthly,
      priceYearly,
      maxTeachers,
      maxStudents,
      maxClasses,
      description,
      isActive
    } = req.body;

    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ success: false, error: 'License not found' });
    }

    // Update fields
    if (name !== undefined) license.name = name;
    if (priceMonthly !== undefined) license.priceMonthly = priceMonthly;
    if (priceYearly !== undefined) license.priceYearly = priceYearly;
    if (maxTeachers !== undefined) license.maxTeachers = maxTeachers;
    if (maxStudents !== undefined) license.maxStudents = maxStudents;
    if (maxClasses !== undefined) license.maxClasses = maxClasses;
    if (description !== undefined) license.description = description;
    if (isActive !== undefined) license.isActive = isActive;

    await license.save();
    return res.json({ success: true, license });
  } catch (error) {
    console.error('Error updating license:', error);
    
    // Provide specific error messages
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        error: `Validation error: ${messages.join(', ')}` 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update license' 
    });
  }
});

// DELETE /api/licenses/:id - Delete a license (P2L Admin only)
router.delete('/licenses/:id', authenticateToken, requireP2LAdmin, async (req, res) => {
  try {
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ success: false, error: 'License not found' });
    }

    // Prevent deletion of trial license
    if (license.type === 'trial') {
      return res.status(400).json({ success: false, error: 'Cannot delete the trial license' });
    }

    await License.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'License deleted successfully' });
  } catch (error) {
    console.error('Error deleting license:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete license' });
  }
});

module.exports = router;

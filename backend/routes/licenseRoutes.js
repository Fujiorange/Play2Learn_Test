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

    console.log('📝 Creating license:', { name, type, priceMonthly, priceYearly });

    // Validation
    if (!name || !type) {
      console.error('❌ Validation failed: Missing name or type');
      return res.status(400).json({ success: false, error: 'Name and type are required' });
    }

    // Validate enum type
    const validTypes = ['free', 'paid'];
    if (!validTypes.includes(type.toLowerCase())) {
      console.error('❌ Validation failed: Invalid type', type);
      return res.status(400).json({ 
        success: false, 
        error: `Invalid license type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Validate prices are non-negative
    if (priceMonthly < 0 || priceYearly < 0) {
      console.error('❌ Validation failed: Negative prices');
      return res.status(400).json({ success: false, error: 'Prices cannot be negative' });
    }

    // Check if license name already exists
    const existingByName = await License.findOne({ name });
    if (existingByName) {
      console.error('❌ License name already exists:', name);
      return res.status(400).json({ success: false, error: 'License name already exists' });
    }

    const newLicense = new License({
      name,
      type: type.toLowerCase(),
      priceMonthly: priceMonthly || 0,
      priceYearly: priceYearly || 0,
      maxTeachers: maxTeachers || 1,
      maxStudents: maxStudents || 5,
      maxClasses: maxClasses || 1,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    });

    await newLicense.save();
    console.log('✅ License created successfully:', newLicense._id);
    return res.json({ success: true, license: newLicense });
  } catch (error) {
    console.error('❌ Error creating license:', error.message);
    console.error('Error details:', error);
    
    // Check for MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        error: `License ${field} already exists` 
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

    console.log('📝 Updating license:', req.params.id);

    const license = await License.findById(req.params.id);
    if (!license) {
      console.error('❌ License not found:', req.params.id);
      return res.status(404).json({ success: false, error: 'License not found' });
    }

    // Validate prices if provided
    if (priceMonthly !== undefined && priceMonthly < 0) {
      return res.status(400).json({ success: false, error: 'Monthly price cannot be negative' });
    }
    if (priceYearly !== undefined && priceYearly < 0) {
      return res.status(400).json({ success: false, error: 'Yearly price cannot be negative' });
    }

    // Check for duplicate name if name is being changed
    if (name !== undefined && name !== license.name) {
      const existingByName = await License.findOne({ name });
      if (existingByName) {
        console.error('❌ License name already exists:', name);
        return res.status(400).json({ success: false, error: 'License name already exists' });
      }
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
    console.log('✅ License updated successfully:', license._id);
    return res.json({ success: true, license });
  } catch (error) {
    console.error('❌ Error updating license:', error.message);
    console.error('Error details:', error);
    
    // Check for MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        error: `License ${field} already exists` 
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
    console.log('🗑️ Deleting license:', req.params.id);
    
    const license = await License.findById(req.params.id);
    if (!license) {
      console.error('❌ License not found:', req.params.id);
      return res.status(404).json({ success: false, error: 'License not found' });
    }

    // Check if license is deletable
    if (license.isDeletable === false) {
      console.error('❌ Cannot delete protected license:', license.name);
      return res.status(403).json({ 
        success: false, 
        error: 'This license is protected and cannot be deleted' 
      });
    }

    await License.findByIdAndDelete(req.params.id);
    console.log('✅ License deleted successfully:', req.params.id);
    return res.json({ success: true, message: 'License deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting license:', error.message);
    console.error('Error details:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete license' 
    });
  }
});

module.exports = router;

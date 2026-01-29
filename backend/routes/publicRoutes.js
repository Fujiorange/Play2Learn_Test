// backend/routes/publicRoutes.js - Public routes (no authentication required)
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const LandingPage = require('../models/LandingPage');

// ==================== RATE LIMITING ====================

// Rate limiter for public landing page endpoint
// Allow 100 requests per 15 minutes per IP
const landingPageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// ==================== PUBLIC LANDING PAGE ROUTE ====================

// Get active landing page (public - no auth required)
router.get('/landing', landingPageLimiter, async (req, res) => {
  try {
    // Get the active landing page
    let landingPage = await LandingPage.findOne({ is_active: true });
    
    if (!landingPage) {
      // If no active page, get the most recent one
      landingPage = await LandingPage.findOne().sort({ createdAt: -1 });
    }
    
    if (!landingPage) {
      // If no landing page exists at all, return empty structure with default message
      return res.json({
        success: true,
        blocks: [],
        message: 'No landing page configured yet'
      });
    }

    // Return only visible blocks, sorted by order
    const visibleBlocks = (landingPage.blocks || [])
      .filter(block => block.is_visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json({
      success: true,
      blocks: visibleBlocks
    });
  } catch (error) {
    console.error('Get public landing page error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch landing page' 
    });
  }
});

module.exports = router;

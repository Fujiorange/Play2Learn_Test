const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const User = require('../models/User');
const School = require('../models/School');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const LandingPage = require('../models/LandingPage');
const Testimonial = require('../models/Testimonial');
const Maintenance = require('../models/Maintenance');
const { sendSchoolAdminWelcomeEmail } = require('../services/emailService');
const { generateTempPassword } = require('../utils/passwordGenerator');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware to authenticate P2L Admins
const authenticateP2LAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await User.findById(decoded.userId);
    if (!admin || (admin.role !== 'p2ladmin' && admin.role !== 'Platform Admin')) {
      return res.status(403).json({ error: 'Access restricted to P2L Admins' });
    }

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
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    const isConnected = dbState === 1;
    
    res.json({
      success: true,
      status: 'healthy',
      database: {
        status: dbStatus,
        connected: isConnected,
        type: 'MongoDB'
      },
      server: {
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Health check error:', err);
    return res.status(500).json({ 
      success: false,
      status: 'unhealthy',
      error: 'Health check failed' 
    });
  }
});

// ==================== Dashboard Statistics ====================
router.get('/dashboard-stats', authenticateP2LAdmin, async (req, res) => {
  try {
    // Get counts for dashboard
    const [schoolsCount, adminsCount, questionsCount, quizzesCount] = await Promise.all([
      School.countDocuments(),
      User.countDocuments({ role: 'School Admin' }),
      Question.countDocuments({ is_active: true }),
      Quiz.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        schools: schoolsCount,
        admins: adminsCount,
        questions: questionsCount,
        quizzes: quizzesCount
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics' 
    });
  }
});

// ==================== SCHOOL MANAGEMENT ROUTES ====================

// Get all schools
router.get('/schools', authenticateP2LAdmin, async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: schools
    });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch schools' 
    });
  }
});

// Get single school
router.get('/schools/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        error: 'School not found' 
      });
    }
    res.json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch school' 
    });
  }
});

// Create school
router.post('/schools', authenticateP2LAdmin, async (req, res) => {
  try {
    const { organization_name, organization_type, plan, plan_info, contact } = req.body;
    
    // Validate required fields
    if (!organization_name || !plan || !plan_info) {
      return res.status(400).json({ 
        success: false, 
        error: 'organization_name, plan, and plan_info are required' 
      });
    }

    const school = new School({
      organization_name,
      organization_type: organization_type || 'school',
      plan,
      plan_info,
      contact: contact || ''
    });

    await school.save();

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: school
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create school' 
    });
  }
});

// Update school
router.put('/schools/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { organization_name, organization_type, plan, plan_info, contact, is_active } = req.body;
    
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        error: 'School not found' 
      });
    }

    // Update fields if provided
    if (organization_name) school.organization_name = organization_name;
    if (organization_type) school.organization_type = organization_type;
    if (plan) school.plan = plan;
    if (plan_info) school.plan_info = plan_info;
    if (contact !== undefined) school.contact = contact;
    if (is_active !== undefined) school.is_active = is_active;

    await school.save();

    res.json({
      success: true,
      message: 'School updated successfully',
      data: school
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update school' 
    });
  }
});

// Delete school
router.delete('/schools/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        error: 'School not found' 
      });
    }

    res.json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete school' 
    });
  }
});

// Get school admins
router.get('/schools/:id/admins', authenticateP2LAdmin, async (req, res) => {
  try {
    const schoolId = req.params.id;

    // Find users who are school-admins for this school
    const admins = await User.find({
      schoolId: schoolId,
      role: 'School Admin'
    }).select('-password');

    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('Get school admins error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch school admins' 
    });
  }
});

// Create/assign school admin
router.post('/schools/:id/admins', authenticateP2LAdmin, async (req, res) => {
  try {
    const { email, name } = req.body;
    const schoolId = req.params.id;
    
    // Validate required fields
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }
    
    // Validate school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        error: 'School not found' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword('school');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Create school admin
    const admin = new User({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'School Admin',
      schoolId: schoolId,
      emailVerified: true,
      accountActive: true,
      requirePasswordChange: true
    });

    await admin.save();
    
    // Send welcome email with credentials
    try {
      await sendSchoolAdminWelcomeEmail(admin, tempPassword, school.organization_name);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue even if email fails - admin is still created
    }

    res.status(201).json({
      success: true,
      message: 'School admin created successfully',
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        tempPassword: tempPassword // Return temp password so P2L admin can share it if email fails
      }
    });
  } catch (error) {
    console.error('Create school admin error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create school admin' 
    });
  }
});

// Create multiple school admins (batch creation)
router.post('/school-admins', authenticateP2LAdmin, async (req, res) => {
  try {
    const { schoolId, admins } = req.body;
    
    // Validate required fields
    if (!schoolId || !admins || !Array.isArray(admins) || admins.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'School ID and admins array are required' 
      });
    }
    
    // Validate school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        error: 'School not found' 
      });
    }

    const created = [];
    const errors = [];

    // Process each admin
    for (const adminData of admins) {
      try {
        const { email, name, contact } = adminData;
        
        if (!email) {
          errors.push({
            email: email || 'unknown',
            error: 'Email is required'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          errors.push({
            email: email,
            error: 'Email already registered'
          });
          continue;
        }

        // Generate temporary password
        const tempPassword = generateTempPassword('school');
        
        // Hash password
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Create school admin
        const admin = new User({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          contact: contact || null,
          password: hashedPassword,
          role: 'School Admin',
          schoolId: schoolId,
          emailVerified: true,
          accountActive: true,
          requirePasswordChange: true
        });

        await admin.save();
        
        // Send welcome email with credentials
        try {
          await sendSchoolAdminWelcomeEmail(admin, tempPassword, school.organization_name);
        } catch (emailError) {
          console.error('Email sending error for', email, ':', emailError);
          // Continue even if email fails - admin is still created
        }

        created.push({
          success: true,
          id: admin._id,
          email: admin.email,
          name: admin.name,
          tempPassword: tempPassword // Return temp password so P2L admin can share it
        });
      } catch (error) {
        console.error('Error creating admin:', adminData.email, error);
        errors.push({
          email: adminData.email,
          error: error.message || 'Failed to create admin'
        });
      }
    }

    // Prepare the response
    const isSuccess = created.length > 0;
    const responseData = {
      success: isSuccess,
      message: `Created ${created.length} admin(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      created: created,
      errors: errors.length > 0 ? errors : undefined
    };
    
    // Add error field when no admins were created (for frontend compatibility)
    if (!isSuccess && errors.length > 0) {
      responseData.error = errors.map(e => `${e.email}: ${e.error}`).join('; ');
    }
    
    res.status(isSuccess ? 201 : 400).json(responseData);
  } catch (error) {
    console.error('Create school admins error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      success: false, 
      error: `Failed to create school admins: ${error.message}` 
    });
  }
});

// Update school admin
router.put('/school-admins/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, contact, accountActive } = req.body;
    
    // Find the admin
    const admin = await User.findById(id);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    // Ensure this is a school admin
    if (admin.role !== 'School Admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'This user is not a school admin' 
      });
    }
    
    // Check if email is being changed and if new email exists
    if (email && email.toLowerCase() !== admin.email.toLowerCase()) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email already in use' 
        });
      }
      admin.email = email.toLowerCase();
    }
    
    // Update fields
    if (name) admin.name = name;
    if (contact !== undefined) admin.contact = contact;
    if (accountActive !== undefined) admin.accountActive = accountActive;
    
    await admin.save();
    
    res.json({
      success: true,
      message: 'School admin updated successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        contact: admin.contact,
        accountActive: admin.accountActive
      }
    });
  } catch (error) {
    console.error('Update school admin error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update school admin' 
    });
  }
});

// Delete school admin
router.delete('/school-admins/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the admin
    const admin = await User.findById(id);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    // Ensure this is a school admin
    if (admin.role !== 'School Admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'This user is not a school admin' 
      });
    }
    
    // Delete the admin
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'School admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete school admin error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete school admin' 
    });
  }
});

// Reset school admin password
router.post('/school-admins/:id/reset-password', authenticateP2LAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the admin
    const admin = await User.findById(id);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    // Ensure this is a school admin
    if (admin.role !== 'School Admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'This user is not a school admin' 
      });
    }
    
    // Get school information
    const school = await School.findById(admin.schoolId);
    const schoolName = school ? school.organization_name : 'Unknown School';
    
    // Generate new temporary password
    const tempPassword = generateTempPassword('school');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Update admin with new password and require password change
    admin.password = hashedPassword;
    admin.requirePasswordChange = true;
    await admin.save();
    
    // Send email with new credentials
    try {
      await sendSchoolAdminWelcomeEmail(admin, tempPassword, schoolName);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue even if email fails - password is reset
    }
    
    // Return temp password for one-time viewing by P2L admin
    // Note: This is intentional - P2L admin needs the password to share with the school admin
    // The password is only returned once and should be viewed immediately
    res.json({
      success: true,
      message: 'Password reset successfully',
      tempPassword: tempPassword,
      adminId: admin._id,
      email: admin.email,
      name: admin.name
    });
  } catch (error) {
    console.error('Reset school admin password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset password' 
    });
  }
});

// ==================== QUESTION MANAGEMENT ROUTES ====================

// Get all questions
router.get('/questions', authenticateP2LAdmin, async (req, res) => {
  try {
    const { subject, topic, difficulty, grade, is_active } = req.query;
    
    const filter = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = parseInt(difficulty);
    if (grade) filter.grade = grade;
    if (is_active !== undefined) filter.is_active = is_active === 'true';

    const questions = await Question.find(filter)
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch questions' 
    });
  }
});

// Get unique subjects
router.get('/questions-subjects', authenticateP2LAdmin, async (req, res) => {
  try {
    const subjects = await Question.distinct('subject');
    res.json({
      success: true,
      data: subjects.filter(s => s && s.trim()).sort() // Filter out empty/null values and sort alphabetically
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subjects' 
    });
  }
});

// Get unique topics
router.get('/questions-topics', authenticateP2LAdmin, async (req, res) => {
  try {
    const topics = await Question.distinct('topic');
    res.json({
      success: true,
      data: topics.filter(t => t && t.trim()).sort() // Filter out empty/null values and sort alphabetically
    });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch topics' 
    });
  }
});

// Get unique grades
router.get('/questions-grades', authenticateP2LAdmin, async (req, res) => {
  try {
    const grades = await Question.distinct('grade');
    
    // Custom sort to order by grade level number (Primary 1, Primary 2, etc.)
    const sortedGrades = grades
      .filter(g => g && g.trim().length > 0)
      .sort((a, b) => {
        // Extract number from grade string (e.g., "Primary 1" -> 1)
        const matchA = a.match(/\d+/);
        const matchB = b.match(/\d+/);
        
        // If both have numbers, sort numerically
        if (matchA && matchB) {
          return parseInt(matchA[0]) - parseInt(matchB[0]);
        }
        
        // If only one has a number, prioritize the one with a number
        if (matchA && !matchB) return -1;
        if (!matchA && matchB) return 1;
        
        // If neither has a number, sort alphabetically
        return a.localeCompare(b);
      });
    
    res.json({
      success: true,
      data: sortedGrades
    });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch grades' 
    });
  }
});

// Get question statistics (counts by difficulty)
router.get('/questions-stats', authenticateP2LAdmin, async (req, res) => {
  try {
    const stats = {};
    
    // Count active questions for each difficulty level
    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      const count = await Question.countDocuments({ 
        difficulty, 
        is_active: true 
      });
      stats[difficulty] = count;
    }
    
    // Also get total count
    const totalActive = await Question.countDocuments({ is_active: true });
    const totalInactive = await Question.countDocuments({ is_active: false });
    
    res.json({
      success: true,
      data: {
        byDifficulty: stats,
        totalActive,
        totalInactive,
        total: totalActive + totalInactive
      }
    });
  } catch (error) {
    console.error('Get question stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch question statistics' 
    });
  }
});

// Get single question
router.get('/questions/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('created_by', 'name email');
    
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch question' 
    });
  }
});

// Create question
router.post('/questions', authenticateP2LAdmin, async (req, res) => {
  try {
    const { text, choices, answer, difficulty, subject, topic, grade, is_active } = req.body;
    
    // Validate required fields
    if (!text || !answer) {
      return res.status(400).json({ 
        success: false, 
        error: 'text and answer are required' 
      });
    }

    const question = new Question({
      text,
      choices: choices || [],
      answer,
      difficulty: difficulty || 2,
      subject: subject || 'General',
      topic: topic || '',
      grade: grade || 'Primary 1',
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user._id
    });

    await question.save();

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create question' 
    });
  }
});

// Update question
router.put('/questions/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { text, choices, answer, difficulty, subject, topic, grade, is_active } = req.body;
    
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    // Update fields if provided
    if (text) question.text = text;
    if (choices) question.choices = choices;
    if (answer) question.answer = answer;
    if (difficulty !== undefined) question.difficulty = difficulty;
    if (subject) question.subject = subject;
    if (topic !== undefined) question.topic = topic;
    if (grade !== undefined) question.grade = grade;
    if (is_active !== undefined) question.is_active = is_active;

    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update question' 
    });
  }
});

// Delete question
router.delete('/questions/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete question' 
    });
  }
});

// Bulk delete questions
router.post('/questions/bulk-delete', authenticateP2LAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide an array of question IDs' 
      });
    }

    const result = await Question.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} question(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete questions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete questions' 
    });
  }
});

// CSV upload for questions
router.post('/questions/upload-csv', authenticateP2LAdmin, upload.single('file'), async (req, res) => {
  const filePath = req.file?.path;
  
  if (!filePath) {
    return res.status(400).json({ 
      success: false, 
      error: 'No file uploaded' 
    });
  }

  const results = [];
  const errors = [];
  let lineNumber = 1; // Start at 1 for header

  try {
    // Parse CSV file
    const parsePromise = new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          lineNumber++;
          
          // Normalize field names (handle case-insensitive headers)
          const normalizedRow = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = row[key];
          });

          // Validate required fields
          const text = normalizedRow.text || normalizedRow.question;
          const answer = normalizedRow.answer || normalizedRow['correct answer'];
          
          if (!text || !answer) {
            errors.push({
              line: lineNumber,
              error: 'Missing required fields: text and answer are required',
              data: row
            });
            return;
          }

          // Parse choices (can be comma-separated or individual columns)
          let choices = [];
          if (normalizedRow.choices) {
            // If choices are comma-separated
            choices = normalizedRow.choices.split(',').map(c => c.trim()).filter(c => c);
          } else {
            // Check for choice1, choice2, choice3, choice4, etc.
            const choiceKeys = Object.keys(normalizedRow).filter(k => k.startsWith('choice'));
            choices = choiceKeys.map(k => normalizedRow[k]).filter(c => c && c.trim());
          }

          // Parse difficulty (default to 3 if not provided or invalid)
          let difficulty = parseInt(normalizedRow.difficulty) || 3;
          if (difficulty < 1 || difficulty > 5) {
            difficulty = 3;
          }

          results.push({
            text: text.trim(),
            choices: choices,
            answer: answer.trim(),
            difficulty: difficulty,
            subject: normalizedRow.subject || 'General',
            topic: normalizedRow.topic || '',
            grade: normalizedRow.grade || 'Primary 1',
            is_active: normalizedRow.is_active !== 'false' && normalizedRow.is_active !== '0'
          });
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    await parsePromise;

    // Delete uploaded file
    fs.unlinkSync(filePath);

    // If all rows failed, return error
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid questions found in CSV',
        errors: errors
      });
    }

    // Save questions to database
    const savedQuestions = [];
    for (const questionData of results) {
      try {
        const question = new Question({
          ...questionData,
          created_by: req.user._id
        });
        await question.save();
        savedQuestions.push(question);
      } catch (dbError) {
        errors.push({
          error: 'Failed to save question',
          data: questionData,
          message: dbError.message
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${savedQuestions.length} questions`,
      data: {
        total: results.length,
        successful: savedQuestions.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    
    // Clean up file if it exists
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process CSV file',
      message: error.message 
    });
  }
});

// ==================== QUIZ MANAGEMENT ROUTES ====================

// Get all quizzes
router.get('/quizzes', authenticateP2LAdmin, async (req, res) => {
  try {
    const { is_adaptive, is_active } = req.query;
    
    const filter = {};
    if (is_adaptive !== undefined) filter.is_adaptive = is_adaptive === 'true';
    if (is_active !== undefined) filter.is_active = is_active === 'true';

    const quizzes = await Quiz.find(filter)
      .populate('created_by', 'name email')
      .populate('questions.question_id', 'text difficulty subject')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch quizzes' 
    });
  }
});

// Get single quiz
router.get('/quizzes/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('created_by', 'name email')
      .populate('questions.question_id', 'text choices answer difficulty subject topic');
    
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found' 
      });
    }

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch quiz' 
    });
  }
});

// Create quiz
router.post('/quizzes', authenticateP2LAdmin, async (req, res) => {
  try {
    const { title, description, questions, is_adaptive, is_active, quiz_type } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        error: 'title is required' 
      });
    }

    // Populate questions with full details from Question references
    const populatedQuestions = [];
    if (questions && questions.length > 0) {
      // Fetch all questions in parallel for better performance
      const questionIds = questions.map(q => q.question_id).filter(id => id);
      const questionDocs = await Question.find({ _id: { $in: questionIds } });
      
      // Create a map for quick lookup
      const questionMap = new Map(questionDocs.map(doc => [doc._id.toString(), doc]));
      
      // Populate questions in order, log warnings for missing questions
      for (const q of questions) {
        if (q.question_id) {
          const questionDoc = questionMap.get(q.question_id.toString());
          if (questionDoc) {
            populatedQuestions.push({
              question_id: questionDoc._id,
              text: questionDoc.text,
              choices: questionDoc.choices,
              answer: questionDoc.answer,
              difficulty: questionDoc.difficulty
            });
          } else {
            console.warn(`⚠️ Question not found: ${q.question_id}`);
          }
        }
      }
      
      if (populatedQuestions.length !== questionIds.length) {
        console.warn(`⚠️ Some questions were not found. Expected ${questionIds.length}, got ${populatedQuestions.length}`);
      }
    }

    const finalQuizType = quiz_type || (is_adaptive ? 'adaptive' : 'placement');

    const quiz = new Quiz({
      title,
      description: description || '',
      quiz_type: finalQuizType,
      questions: populatedQuestions,
      is_adaptive: is_adaptive !== undefined ? is_adaptive : (finalQuizType === 'adaptive'),
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user._id
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create quiz' 
    });
  }
});

// Update quiz
router.put('/quizzes/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { title, description, questions, is_adaptive, is_active, quiz_type } = req.body;
    
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found' 
      });
    }

    // Update fields if provided
    if (title) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions) quiz.questions = questions;
    if (is_adaptive !== undefined) quiz.is_adaptive = is_adaptive;
    if (is_active !== undefined) quiz.is_active = is_active;
    if (quiz_type !== undefined) quiz.quiz_type = quiz_type;

    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update quiz' 
    });
  }
});

// Delete quiz
router.delete('/quizzes/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found' 
      });
    }

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete quiz' 
    });
  }
});

// Generate adaptive quiz with specific difficulty distribution
router.post('/quizzes/generate-adaptive', authenticateP2LAdmin, async (req, res) => {
  try {
    const { title, description, difficulty_distribution, target_correct, difficulty_progression } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        error: 'title is required' 
      });
    }

    // difficulty_distribution should be like: { 1: 10, 2: 10, 3: 10 }
    // meaning 10 questions of difficulty 1, 10 of difficulty 2, etc.
    if (!difficulty_distribution || typeof difficulty_distribution !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'difficulty_distribution is required and must be an object' 
      });
    }

    const questions = [];
    const missingQuestions = [];
    
    // First, check if there are ANY questions in the database
    const totalQuestions = await Question.countDocuments({ is_active: true });
    if (totalQuestions === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active questions found in the question bank. Please add questions before creating a quiz.',
        suggestion: 'You can add questions by: (1) Using the Question Bank page in P2L Admin, (2) Uploading a CSV file, or (3) Running the seed script: node backend/seed-questions.js',
        totalQuestions: 0
      });
    }
    
    // Check availability for all difficulty levels
    for (const [difficulty, count] of Object.entries(difficulty_distribution)) {
      const diff = parseInt(difficulty);
      const questionCount = parseInt(count);
      
      if (questionCount > 0) {
        const availableCount = await Question.countDocuments({ 
          difficulty: diff,
          is_active: true 
        });
        
        if (availableCount < questionCount) {
          missingQuestions.push({
            difficulty: diff,
            needed: questionCount,
            available: availableCount,
            missing: questionCount - availableCount
          });
        }
      }
    }
    
    // If any difficulty level doesn't have enough questions, return detailed error
    if (missingQuestions.length > 0) {
      const errorDetails = missingQuestions.map(m => 
        `Difficulty ${m.difficulty}: need ${m.needed}, have ${m.available} (missing ${m.missing})`
      ).join('; ');
      
      return res.status(400).json({ 
        success: false, 
        error: `Not enough active questions in question bank. ${errorDetails}. Please add more questions or adjust your quiz configuration.`,
        suggestion: 'Add more questions at the required difficulty levels using the Question Bank page, or reduce the number of questions requested for each difficulty level.',
        missingQuestions,
        totalQuestions
      });
    }
    
    // Fetch and select questions for each difficulty level
    for (const [difficulty, count] of Object.entries(difficulty_distribution)) {
      const diff = parseInt(difficulty);
      const questionCount = parseInt(count);
      
      if (questionCount > 0) {
        const availableQuestions = await Question.find({ 
          difficulty: diff,
          is_active: true 
        });
        
        // Randomly select questions
        const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, questionCount);
        
        selected.forEach(q => {
          questions.push({
            question_id: q._id,
            text: q.text,
            choices: q.choices,
            answer: q.answer,
            difficulty: q.difficulty
          });
        });
      }
    }

    const quiz = new Quiz({
      title,
      description: description || '',
      quiz_type: 'adaptive',
      questions,
      is_adaptive: true,
      is_active: true,
      adaptive_config: {
        target_correct_answers: target_correct || 10,
        difficulty_progression: difficulty_progression || 'gradual',
        starting_difficulty: 1
      },
      created_by: req.user._id
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: 'Adaptive quiz created successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Generate adaptive quiz error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate adaptive quiz' 
    });
  }
});

// ==================== LANDING PAGE MANAGEMENT ROUTES ====================

// Get landing page
router.get('/landing', authenticateP2LAdmin, async (req, res) => {
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
    const blocks = (landingPage.blocks || []).map(block => {
      if (block.type === 'testimonials') {
        // Inject display testimonials into the testimonial block for preview
        return {
          ...block.toObject ? block.toObject() : block,
          custom_data: {
            ...(block.custom_data || {}),
            testimonials: testimonialData
          }
        };
      }
      return block.toObject ? block.toObject() : block;
    });

    res.json({
      success: true,
      blocks: blocks,
      id: landingPage._id,
      is_active: landingPage.is_active,
      version: landingPage.version
    });
  } catch (error) {
    console.error('Get landing page error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch landing page' 
    });
  }
});

// Create/Save landing page
router.post('/landing', authenticateP2LAdmin, async (req, res) => {
  try {
    const { blocks } = req.body;
    
    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({ 
        success: false, 
        error: 'blocks array is required' 
      });
    }

    // Deactivate all existing landing pages
    await LandingPage.updateMany({}, { is_active: false });

    // Create new landing page
    const landingPage = new LandingPage({
      blocks,
      is_active: true,
      version: 1,
      updated_by: req.user._id
    });

    await landingPage.save();

    res.status(201).json({
      success: true,
      message: 'Landing page saved successfully',
      data: landingPage
    });
  } catch (error) {
    console.error('Save landing page error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save landing page' 
    });
  }
});

// Update landing page
router.put('/landing/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { blocks } = req.body;
    
    const landingPage = await LandingPage.findById(req.params.id);
    if (!landingPage) {
      return res.status(404).json({ 
        success: false, 
        error: 'Landing page not found' 
      });
    }

    // Update the landing page
    landingPage.blocks = blocks || landingPage.blocks;
    landingPage.version = (landingPage.version || 1) + 1;
    landingPage.updated_by = req.user._id;

    await landingPage.save();

    res.json({
      success: true,
      message: 'Landing page updated successfully',
      data: landingPage
    });
  } catch (error) {
    console.error('Update landing page error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update landing page' 
    });
  }
});

// Delete landing page
router.delete('/landing', authenticateP2LAdmin, async (req, res) => {
  try {
    // Delete all landing pages or just the active one
    const result = await LandingPage.deleteMany({ is_active: true });
    
    res.json({
      success: true,
      message: 'Landing page(s) deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete landing page error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete landing page' 
    });
  }
});

// Get pricing plans from landing page
router.get('/landing/pricing-plans', authenticateP2LAdmin, async (req, res) => {
  try {
    // Get the active landing page
    let landingPage = await LandingPage.findOne({ is_active: true });
    
    if (!landingPage) {
      // If no active page, get the most recent one
      landingPage = await LandingPage.findOne().sort({ createdAt: -1 });
    }
    
    if (!landingPage) {
      return res.json({
        success: true,
        plans: [],
        message: 'No landing page found'
      });
    }

    // Find the pricing block
    const pricingBlock = landingPage.blocks.find(block => block.type === 'pricing');
    
    if (!pricingBlock || !pricingBlock.custom_data || !pricingBlock.custom_data.plans) {
      return res.json({
        success: true,
        plans: [],
        message: 'No pricing block found in landing page'
      });
    }

    // Extract and transform pricing plans to match school management format
    const plans = pricingBlock.custom_data.plans.map(plan => {
      // Generate consistent ID - try to match known plan types, otherwise use normalized name
      const normalizedName = (plan.name || '').toLowerCase().trim();
      let planId;
      
      // Match against known plan types for consistency
      if (normalizedName.includes('starter') || normalizedName.includes('basic')) {
        planId = 'starter';
      } else if (normalizedName.includes('professional') || normalizedName.includes('pro')) {
        planId = 'professional';
      } else if (normalizedName.includes('enterprise') || normalizedName.includes('business')) {
        planId = 'enterprise';
      } else {
        // Fallback: sanitize name to create ID
        planId = normalizedName.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
      
      return {
        id: planId,
        name: plan.name,
        description: plan.description,
        price: plan.price?.yearly || 0, // Use yearly price
        teacher_limit: plan.teachers || 0,
        student_limit: plan.students || 0,
        features: plan.features || [],
        popular: plan.popular || false
      };
    });

    res.json({
      success: true,
      plans: plans,
      message: `Found ${plans.length} pricing plan(s)`
    });
  } catch (error) {
    console.error('Get pricing plans error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch pricing plans from landing page' 
    });
  }
});

// ==================== TESTIMONIAL MANAGEMENT ====================

// Get testimonials for landing page display (MUST be before /:id route)
router.get('/testimonials/landing-page', authenticateP2LAdmin, async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ 
      display_on_landing: true 
    })
      .sort({ created_at: -1 })
      .limit(10);

    res.json({
      success: true,
      testimonials: testimonials.map(t => ({
        id: t._id,
        name: t.student_name,
        role: t.user_role,
        title: t.title,
        rating: t.rating,
        quote: t.message,
        created_at: t.created_at,
      }))
    });
  } catch (error) {
    console.error('Get landing page testimonials error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch landing page testimonials' 
    });
  }
});

// Get all testimonials with filtering
router.get('/testimonials', authenticateP2LAdmin, async (req, res) => {
  try {
    const { 
      minRating, 
      sentiment, 
      approved, 
      userRole, 
      page = 1, 
      limit = 50 
    } = req.query;

    const query = {};
    
    // Apply filters
    if (minRating) query.rating = { $gte: parseInt(minRating) };
    if (sentiment) query.sentiment_label = sentiment;
    if (approved !== undefined) query.approved = approved === 'true';
    if (userRole) query.user_role = userRole;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const testimonials = await Testimonial.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Testimonial.countDocuments(query);

    res.json({
      success: true,
      testimonials: testimonials.map(t => ({
        id: t._id,
        student_name: t.student_name,
        student_email: t.student_email,
        title: t.title,
        rating: t.rating,
        message: t.message,
        approved: t.approved,
        display_on_landing: t.display_on_landing,
        user_role: t.user_role,
        sentiment_score: t.sentiment_score,
        sentiment_label: t.sentiment_label,
        created_at: t.created_at,
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch testimonials' 
    });
  }
});

// Update testimonial display status
router.put('/testimonials/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { display_on_landing } = req.body;

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ 
        success: false, 
        error: 'Testimonial not found' 
      });
    }

    // Allow setting display_on_landing regardless of approval status
    if (display_on_landing !== undefined) {
      testimonial.display_on_landing = display_on_landing;
    }

    await testimonial.save();

    res.json({
      success: true,
      message: 'Testimonial updated successfully',
      testimonial: {
        id: testimonial._id,
        approved: testimonial.approved,
        display_on_landing: testimonial.display_on_landing,
      }
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update testimonial' 
    });
  }
});

// Delete testimonial
router.delete('/testimonials/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndDelete(id);
    
    if (!testimonial) {
      return res.status(404).json({ 
        success: false, 
        error: 'Testimonial not found' 
      });
    }

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete testimonial' 
    });
  }
});

// ==================== MAINTENANCE BROADCAST ROUTES ====================

// Get all maintenance broadcasts
router.get('/maintenance', authenticateP2LAdmin, async (req, res) => {
  try {
    const broadcasts = await Maintenance.find()
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: broadcasts
    });
  } catch (error) {
    console.error('Get maintenance broadcasts error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch maintenance broadcasts' 
    });
  }
});

// Create maintenance broadcast
router.post('/maintenance', authenticateP2LAdmin, async (req, res) => {
  try {
    const { title, message, type, target_roles, start_date, end_date } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and message are required' 
      });
    }

    const broadcast = new Maintenance({
      title,
      message,
      type: type || 'info',
      target_roles: target_roles || ['all'],
      start_date: start_date || Date.now(),
      end_date: end_date || null,
      is_active: true,
      created_by: req.user._id
    });

    await broadcast.save();

    res.status(201).json({
      success: true,
      message: 'Maintenance broadcast created successfully',
      data: broadcast
    });
  } catch (error) {
    console.error('Create maintenance broadcast error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create maintenance broadcast' 
    });
  }
});

// Update maintenance broadcast
router.put('/maintenance/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { title, message, type, target_roles, start_date, end_date, is_active } = req.body;
    
    const broadcast = await Maintenance.findById(req.params.id);
    if (!broadcast) {
      return res.status(404).json({ 
        success: false, 
        error: 'Maintenance broadcast not found' 
      });
    }

    if (title) broadcast.title = title;
    if (message) broadcast.message = message;
    if (type) broadcast.type = type;
    if (target_roles) broadcast.target_roles = target_roles;
    if (start_date !== undefined) broadcast.start_date = start_date;
    if (end_date !== undefined) broadcast.end_date = end_date;
    if (is_active !== undefined) broadcast.is_active = is_active;

    await broadcast.save();

    res.json({
      success: true,
      message: 'Maintenance broadcast updated successfully',
      data: broadcast
    });
  } catch (error) {
    console.error('Update maintenance broadcast error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update maintenance broadcast' 
    });
  }
});

// Delete maintenance broadcast
router.delete('/maintenance/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const broadcast = await Maintenance.findByIdAndDelete(req.params.id);
    if (!broadcast) {
      return res.status(404).json({ 
        success: false, 
        error: 'Maintenance broadcast not found' 
      });
    }

    res.json({
      success: true,
      message: 'Maintenance broadcast deleted successfully'
    });
  } catch (error) {
    console.error('Delete maintenance broadcast error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete maintenance broadcast' 
    });
  }
});

// ==================== USER MANAGEMENT ====================
// Get all users with optional filtering by school and role
router.get('/users', authenticateP2LAdmin, async (req, res) => {
  try {
    const { schoolId, role } = req.query;
    
    // Build filter object
    const filter = {};
    if (schoolId) {
      filter.schoolId = schoolId;
    }
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('_id name email role schoolId accountActive createdAt')
      .sort({ createdAt: -1 });

    // Get school names for users with schoolId
    const schoolIds = [...new Set(users.filter(u => u.schoolId).map(u => u.schoolId))];
    const schools = await School.find({ _id: { $in: schoolIds } }).select('_id organization_name');
    const schoolMap = {};
    schools.forEach(s => {
      schoolMap[s._id.toString()] = s.organization_name;
    });

    // Add school name to users
    const usersWithSchool = users.map(user => ({
      ...user.toObject(),
      schoolName: user.schoolId ? (schoolMap[user.schoolId] || 'Unknown') : 'N/A'
    }));

    res.json({
      success: true,
      data: usersWithSchool
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users' 
    });
  }
});

// Get all schools for dropdown filter
router.get('/users/schools', authenticateP2LAdmin, async (req, res) => {
  try {
    const schools = await School.find().select('_id organization_name');
    res.json({
      success: true,
      data: schools
    });
  } catch (error) {
    console.error('Get schools for users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch schools' 
    });
  }
});

// Bulk delete users
// Note: This performs a simple delete. Associated data cleanup (sessions, assignments, etc.)
// should be handled separately or through a scheduled cleanup job if needed.
router.post('/users/bulk-delete', authenticateP2LAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'User IDs array is required' 
      });
    }

    // Prevent deletion of admin users that are currently logged in
    const currentAdminId = req.user._id.toString();
    if (ids.includes(currentAdminId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete your own account' 
      });
    }

    const result = await User.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} user(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete users' 
    });
  }
});

// ==================== SUPPORT TICKET MANAGEMENT ====================
const SupportTicket = require('../models/SupportTicket');

// Get all website-related support tickets
router.get('/support-tickets', authenticateP2LAdmin, async (req, res) => {
  try {
    const { status, sortBy, sortOrder, search } = req.query;
    
    // Build query - only website-related tickets
    const query = { category: 'website' };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Build sort object
    const sortOptions = {};
    const validSortFields = ['created_at', 'updated_at', 'status', 'priority'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
    
    let tickets = await SupportTicket.find(query)
      .populate('user_id', 'name email school')
      .populate('school_id', 'name')
      .sort(sortOptions)
      .lean();
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      tickets = tickets.filter(ticket => 
        (ticket.user_name && ticket.user_name.toLowerCase().includes(searchLower)) ||
        (ticket.user_email && ticket.user_email.toLowerCase().includes(searchLower)) ||
        (ticket.subject && ticket.subject.toLowerCase().includes(searchLower)) ||
        (ticket.message && ticket.message.toLowerCase().includes(searchLower)) ||
        // Legacy field support
        (ticket.student_name && ticket.student_name.toLowerCase().includes(searchLower)) ||
        (ticket.student_email && ticket.student_email.toLowerCase().includes(searchLower))
      );
    }
    
    res.json({
      success: true,
      data: tickets.map(ticket => ({
        _id: ticket._id,
        user_name: ticket.user_name || ticket.student_name,
        user_email: ticket.user_email || ticket.student_email,
        user_role: ticket.user_role || 'Student',
        school_name: ticket.school_name || (ticket.school_id && ticket.school_id.name) || 'N/A',
        subject: ticket.subject,
        category: ticket.category,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        admin_response: ticket.admin_response,
        responded_at: ticket.responded_at
      })),
      total: tickets.length
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch support tickets' 
    });
  }
});

// Get single support ticket
router.get('/support-tickets/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user_id', 'name email school')
      .populate('school_id', 'name')
      .lean();
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    // If ticket is 'open' and admin is viewing it, change status to 'pending'
    if (ticket.status === 'open') {
      await SupportTicket.findByIdAndUpdate(req.params.id, { 
        status: 'pending',
        updated_at: new Date()
      });
      ticket.status = 'pending';
    }
    
    res.json({
      success: true,
      data: {
        _id: ticket._id,
        user_name: ticket.user_name || ticket.student_name,
        user_email: ticket.user_email || ticket.student_email,
        user_role: ticket.user_role || 'Student',
        school_name: ticket.school_name || (ticket.school_id && ticket.school_id.name) || 'N/A',
        subject: ticket.subject,
        category: ticket.category,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        admin_response: ticket.admin_response,
        responded_at: ticket.responded_at
      }
    });
  } catch (error) {
    console.error('Get support ticket error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch support ticket' 
    });
  }
});

// Reply to a support ticket
router.post('/support-tickets/:id/reply', authenticateP2LAdmin, async (req, res) => {
  try {
    const { response } = req.body;
    
    if (!response || response.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Response message is required' 
      });
    }
    
    const ticket = await SupportTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    // Update ticket with admin response
    ticket.admin_response = response;
    ticket.responded_by = req.user._id;
    ticket.responded_at = new Date();
    ticket.updated_at = new Date();
    
    await ticket.save();
    
    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        _id: ticket._id,
        admin_response: ticket.admin_response,
        responded_at: ticket.responded_at,
        status: ticket.status
      }
    });
  } catch (error) {
    console.error('Reply to support ticket error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send reply' 
    });
  }
});

// Close a support ticket
router.post('/support-tickets/:id/close', authenticateP2LAdmin, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    ticket.status = 'closed';
    ticket.closed_at = new Date();
    ticket.updated_at = new Date();
    
    await ticket.save();
    
    res.json({
      success: true,
      message: 'Ticket closed successfully',
      data: {
        _id: ticket._id,
        status: ticket.status,
        closed_at: ticket.closed_at
      }
    });
  } catch (error) {
    console.error('Close support ticket error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to close ticket' 
    });
  }
});

// Get support ticket statistics
router.get('/support-tickets-stats', authenticateP2LAdmin, async (req, res) => {
  try {
    const [openCount, pendingCount, closedCount] = await Promise.all([
      SupportTicket.countDocuments({ category: 'website', status: 'open' }),
      SupportTicket.countDocuments({ category: 'website', status: 'pending' }),
      SupportTicket.countDocuments({ category: 'website', status: 'closed' })
    ]);
    
    res.json({
      success: true,
      data: {
        open: openCount,
        pending: pendingCount,
        closed: closedCount,
        total: openCount + pendingCount + closedCount
      }
    });
  } catch (error) {
    console.error('Get support ticket stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch ticket statistics' 
    });
  }
});

// ==================== SKILL POINTS CONFIGURATION ====================
const SkillPointsConfig = require('../models/SkillPointsConfig');

// Get skill points configuration
router.get('/skill-points-config', authenticateP2LAdmin, async (req, res) => {
  try {
    const config = await SkillPointsConfig.getConfig();
    
    res.json({
      success: true,
      data: {
        difficultyPoints: config.difficultyPoints,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    console.error('Get skill points config error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch skill points configuration' 
    });
  }
});

// Update skill points configuration
router.put('/skill-points-config', authenticateP2LAdmin, async (req, res) => {
  try {
    const { difficultyPoints } = req.body;
    
    if (!difficultyPoints) {
      return res.status(400).json({ 
        success: false, 
        error: 'difficultyPoints configuration is required' 
      });
    }
    
    // Validate the structure
    const requiredLevels = ['1', '2', '3', '4', '5'];
    for (const level of requiredLevels) {
      if (!difficultyPoints[level] || 
          typeof difficultyPoints[level].correct !== 'number' || 
          typeof difficultyPoints[level].wrong !== 'number') {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid configuration for difficulty level ${level}. Each level must have 'correct' and 'wrong' numeric values.` 
        });
      }
    }
    
    let config = await SkillPointsConfig.findOne({ configId: 'default' });
    
    if (!config) {
      config = new SkillPointsConfig({ configId: 'default' });
    }
    
    config.difficultyPoints = difficultyPoints;
    config.updatedAt = new Date();
    config.updatedBy = req.user._id;
    
    await config.save();
    
    res.json({
      success: true,
      message: 'Skill points configuration updated successfully',
      data: {
        difficultyPoints: config.difficultyPoints,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    console.error('Update skill points config error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update skill points configuration' 
    });
  }
});

// Other Admin Functions...
module.exports = router;

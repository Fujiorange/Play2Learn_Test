// server.js - Backend Server for Play2Learn
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'play2learn',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });

// ==================== AUTHENTICATION ROUTES ====================

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const {
    name,
    email,
    password,
    contact,
    gender,
    organizationName,
    organizationType,
    businessRegistrationNumber,
    role
  } = req.body;

  let connection;
  
  try {
    // Validation
    if (!name || !email || !password || !organizationName || !organizationType || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'All required fields must be filled' 
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

    connection = await pool.getConnection();

    // Check if email already exists
    const [existingUsers] = await connection.query(
      'SELECT email FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const [result] = await connection.query(
      `INSERT INTO users (
        name, email, password_hash, contact, gender,
        organization_name, organization_type, business_registration_number,
        role, approval_status, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', TRUE)`,
      [
        name,
        email,
        passwordHash,
        contact,
        gender,
        organizationName,
        organizationType,
        businessRegistrationNumber || null,
        role
      ]
    );

    const userId = result.insertId;

    // Create role-specific entry
    await createRoleSpecificEntry(connection, userId, role);

    // Generate JWT token
    const token = jwt.sign(
      { userId, email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get complete user data
    const [userData] = await connection.query(
      `SELECT user_id, name, email, role, organization_name, organization_type, 
              contact, gender, is_active, approval_status, created_at
       FROM users WHERE user_id = ?`,
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userData[0]
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.' 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  let connection;

  try {
    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and role are required' 
      });
    }

    connection = await pool.getConnection();

    // Get user from database
    const [users] = await connection.query(
      `SELECT user_id, name, email, password_hash, role, organization_name, 
              organization_type, contact, gender, is_active, approval_status
       FROM users 
       WHERE email = ? AND role = ?`,
      [email, role]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email, password, or role' 
      });
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account is deactivated. Please contact support.' 
      });
    }

    // Check approval status
    if (user.approval_status === 'pending') {
      return res.status(403).json({ 
        success: false, 
        error: 'Account is pending approval' 
      });
    }

    if (user.approval_status === 'rejected') {
      return res.status(403).json({ 
        success: false, 
        error: 'Account has been rejected' 
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email, password, or role' 
      });
    }

    // Update last login
    await connection.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = ?',
      [user.user_id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password hash from response
    delete user.password_hash;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed. Please try again.' 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get current user (protected route)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.query(
      `SELECT user_id, name, email, role, organization_name, organization_type,
              contact, gender, is_active, approval_status, created_at, last_login
       FROM users 
       WHERE user_id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user data' 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Logout endpoint (optional - mainly for token invalidation in future)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a production app, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// ==================== HELPER FUNCTIONS ====================

// Create role-specific table entries
async function createRoleSpecificEntry(connection, userId, role) {
  try {
    switch (role) {
      case 'student':
        await connection.query(
          'INSERT INTO students (user_id, grade_level, points, level) VALUES (?, ?, ?, ?)',
          [userId, 'Not Set', 0, 1]
        );
        break;
      
      case 'teacher':
        await connection.query(
          'INSERT INTO teachers (user_id) VALUES (?)',
          [userId]
        );
        break;
      
      case 'parent':
        await connection.query(
          'INSERT INTO parents (user_id) VALUES (?)',
          [userId]
        );
        break;
      
      case 'school-admin':
        await connection.query(
          'INSERT INTO school_admins (user_id) VALUES (?)',
          [userId]
        );
        break;
      
      case 'platform-admin':
        await connection.query(
          'INSERT INTO platform_admins (user_id, admin_level) VALUES (?, ?)',
          [userId, 'moderator']
        );
        break;
    }
  } catch (error) {
    console.error('Error creating role-specific entry:', error);
    throw error;
  }
}

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

// ==================== ADDITIONAL ROUTES ====================

// Get user dashboard data based on role
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const { userId, role } = req.user;

    let dashboardData = {};

    switch (role) {
      case 'student':
        const [studentData] = await connection.query(
          `SELECT s.*, u.name, u.email, u.organization_name
           FROM students s
           JOIN users u ON s.user_id = u.user_id
           WHERE s.user_id = ?`,
          [userId]
        );
        
        const [enrollments] = await connection.query(
          `SELECT COUNT(*) as total_courses FROM enrollments WHERE student_id = ?`,
          [studentData[0].student_id]
        );

        dashboardData = {
          ...studentData[0],
          total_courses: enrollments[0].total_courses
        };
        break;

      case 'teacher':
        const [teacherData] = await connection.query(
          `SELECT t.*, u.name, u.email, u.organization_name
           FROM teachers t
           JOIN users u ON t.user_id = u.user_id
           WHERE t.user_id = ?`,
          [userId]
        );

        const [courses] = await connection.query(
          `SELECT COUNT(*) as total_courses FROM courses WHERE teacher_id = ?`,
          [teacherData[0].teacher_id]
        );

        dashboardData = {
          ...teacherData[0],
          total_courses: courses[0].total_courses
        };
        break;

      case 'parent':
      case 'school-admin':
      case 'platform-admin':
        // Add specific queries for other roles
        dashboardData = { message: 'Dashboard data for ' + role };
        break;
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load dashboard data' 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Play2Learn Server Running        ║
║   📍 Port: ${PORT}                        ║
║   🌐 http://localhost:${PORT}            ║
║   💾 Database: MySQL                   ║
╚════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});
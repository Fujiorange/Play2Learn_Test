// routes/mongoAuthRoutes.js - MongoDB Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      contact,
      gender,
      dateOfBirth,
      organizationName,
      organizationType,
      businessRegistrationNumber,
      role
    } = req.body;

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

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check if email already exists
    const existingUser = await usersCollection.findOne({ email: email });

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user document
    const newUser = {
      name,
      email,
      password_hash: passwordHash,
      contact: contact || null,
      gender: gender || null,
      date_of_birth: dateOfBirth || null,
      organization_name: organizationName,
      organization_type: organizationType,
      business_registration_number: businessRegistrationNumber || null,
      role,
      approval_status: 'approved',
      is_active: true,
      created_at: new Date(),
      last_login: null
    };

    // Insert user
    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId;

    console.log('✅ User created:', userId, 'Role:', role);

    // Create role-specific entry
    await createRoleSpecificEntry(db, userId, role, name, email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: userId.toString(), email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      _id: userId,
      user_id: userId.toString(),
      name,
      email,
      role,
      organization_name: organizationName,
      organization_type: organizationType,
      contact,
      gender,
      date_of_birth: dateOfBirth,
      is_active: true,
      approval_status: 'approved',
      created_at: newUser.created_at
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('MongoDB Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// ==================== LOGIN (UPDATED - SUPPORTS BOTH SCHEMAS) ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log('🔐 Login attempt:', { email, role });

    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and role are required' 
      });
    }

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find user by email only (we'll check role separately)
    const user = await usersCollection.findOne({ email: email });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email, password, or role' 
      });
    }

    console.log('✅ User found:', user.email);
    console.log('   User role in DB:', user.role);
    console.log('   Requested role:', role);

    // Check role (case-insensitive comparison)
    const userRoleLower = (user.role || '').toLowerCase();
    const requestedRoleLower = (role || '').toLowerCase();

    if (userRoleLower !== requestedRoleLower) {
      console.log('❌ Role mismatch');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email, password, or role' 
      });
    }

    // Check if account is active (support both field names)
    const isActive = user.is_active !== undefined ? user.is_active : user.accountActive;
    if (isActive === false) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account is deactivated. Please contact support.' 
      });
    }

    // Check approval status (if field exists)
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

    // Verify password (support both field names: password_hash and password)
    const passwordHash = user.password_hash || user.password;
    
    if (!passwordHash) {
      console.log('❌ No password hash found for user');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email, password, or role' 
      });
    }

    console.log('🔑 Checking password...');
    const passwordMatch = await bcrypt.compare(password, passwordHash);

    if (!passwordMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email, password, or role' 
      });
    }

    console.log('✅ Password valid');

    // Update last login
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { last_login: new Date() } }
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for:', email);

    // Remove password hash from response
    const userData = {
      user_id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization_name: user.organization_name,
      organization_type: user.organization_type,
      contact: user.contact,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_active: isActive,
      approval_status: user.approval_status,
      created_at: user.created_at,
      last_login: user.last_login,
      // Add additional fields for students (CSV imported users)
      gradeLevel: user.gradeLevel,
      class: user.class,
      username: user.username
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('MongoDB Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed. Please try again.' 
    });
  }
});

// ==================== GET CURRENT USER (Token Verification) ====================
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    console.log('🔍 /me route called');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.userId);
    } catch (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Get user from database
    const user = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.userId) 
    });

    if (!user) {
      console.log('❌ User not found:', decoded.userId);
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Check if account is active (support both field names)
    const isActive = user.is_active !== undefined ? user.is_active : user.accountActive;
    if (isActive === false) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account is deactivated' 
      });
    }

    console.log('✅ User data retrieved for:', user.email);

    // Return user data (without password)
    const userData = {
      user_id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization_name: user.organization_name,
      organization_type: user.organization_type,
      contact: user.contact,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_active: isActive,
      approval_status: user.approval_status,
      created_at: user.created_at,
      // Add additional fields for students
      gradeLevel: user.gradeLevel,
      class: user.class,
      username: user.username
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user data' 
    });
  }
});

// ==================== LOGOUT ====================
router.post('/logout', async (req, res) => {
  try {
    console.log('👋 Logout request received');
    
    // For now, just return success
    // Frontend handles clearing localStorage
    // You could add token blacklisting here if needed
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed' 
    });
  }
});

// ==================== UPDATE PROFILE ====================
router.put('/update-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }

    const { name, contact, gender, date_of_birth } = req.body;
    const userId = new mongoose.Types.ObjectId(decoded.userId);

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Update user profile
    const updateData = {
      updated_at: new Date()
    };

    if (name) updateData.name = name;
    if (contact !== undefined) updateData.contact = contact;
    if (gender) updateData.gender = gender;
    if (date_of_birth) updateData.date_of_birth = date_of_birth;

    const result = await usersCollection.updateOne(
      { _id: userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne({ _id: userId });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        contact: updatedUser.contact,
        gender: updatedUser.gender,
        date_of_birth: updatedUser.date_of_birth,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update profile' 
    });
  }
});

// ==================== HELPER FUNCTION (UPDATED) ====================
async function createRoleSpecificEntry(db, userId, role, name, email) {
  try {
    const timestamp = new Date();
    
    switch (role.toLowerCase()) {  // Make case-insensitive
      case 'student':
        const studentDoc = {
          user_id: userId,
          name,
          email,
          grade_level: 'Primary 1',
          class: null,
          school_id: null,
          parent_id: null,
          points: 0,
          level: 1,
          current_profile: null,
          consecutive_fails: 0,
          placement_completed: false,
          streak: 0,
          total_quizzes: 0,
          average_score: 0,
          badges: [],
          achievements: [],
          last_active: timestamp,
          is_active: true,
          created_at: timestamp,
          updated_at: timestamp
        };
        
        const result = await db.collection('students').insertOne(studentDoc);
        console.log('✅ Student profile created:', result.insertedId);
        break;
      
      case 'teacher':
        await db.collection('teachers').insertOne({
          user_id: userId,
          name,
          email,
          subject: 'Mathematics',
          school_id: null,
          classes: [],
          students: [],
          is_active: true,
          created_at: timestamp,
          updated_at: timestamp
        });
        console.log('✅ Teacher profile created');
        break;
      
      case 'parent':
        await db.collection('parents').insertOne({
          user_id: userId,
          name,
          email,
          phone_number: null,
          children: [],
          is_active: true,
          created_at: timestamp,
          updated_at: timestamp
        });
        console.log('✅ Parent profile created');
        break;
      
      case 'school-admin':
        await db.collection('school_admins').insertOne({
          user_id: userId,
          name,
          email,
          school_id: null,
          is_active: true,
          created_at: timestamp,
          updated_at: timestamp
        });
        console.log('✅ School Admin profile created');
        break;
      
      case 'platform-admin':
        await db.collection('platform_admins').insertOne({
          user_id: userId,
          name,
          email,
          admin_level: 'moderator',
          created_at: timestamp,
          updated_at: timestamp
        });
        console.log('✅ Platform Admin profile created');
        break;
    }
  } catch (error) {
    console.error('Error creating role-specific entry:', error);
    throw error;
  }
}

module.exports = router;
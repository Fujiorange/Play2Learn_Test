const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

function normalizeRole(role) {
  if (!role) return role;
  const lower = role.toLowerCase();
  if (lower.includes('platform') || lower === 'p2ladmin') return 'p2ladmin';
  if (lower.includes('school') || lower === 'schooladmin') return 'school-admin';
  if (lower.includes('teacher')) return 'Teacher';
  if (lower.includes('student')) return 'Student';
  if (lower.includes('parent')) return 'Parent';
  if (lower.includes('trial')) return 'Trial User';
  return role;
}

router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role, schoolId,
      class: studentClass, gradeLevel, username, subject,
      contact, gender, date_of_birth,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and role are required' });
    }

    const normalizedRole = normalizeRole(role);
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ success: false, error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name, email: email.toLowerCase(), password: hashedPassword, role: normalizedRole,
      schoolId: schoolId || null, class: studentClass || null, gradeLevel: gradeLevel || null,
      username: username || null, subject: subject || null, contact: contact || null,
      gender: gender || null, date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
      emailVerified: true, accountActive: true,
    });

    await newUser.save();
    return res.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required' });

    // Use direct MongoDB query to get ALL fields including permissions
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    // ========== FIX #1: CHECK IF ACCOUNT IS DISABLED ==========
    if (user.accountActive === false) {
      console.log(`🚫 Login blocked - account disabled: ${email}`);
      return res.status(403).json({ 
        success: false, 
        error: 'Your account has been disabled. Please contact your administrator.' 
      });
    }

    // Check both 'password' and 'password_hash' fields
    const storedPassword = user.password || user.password_hash;
    if (!storedPassword) {
      console.error('❌ No password field found for user:', email);
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, storedPassword);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    // Include permissions in JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email, 
        role: user.role,
        name: user.name,
        permissions: user.permissions || null
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    console.log(`✅ Login successful: ${user.email} (${user.role})`);
    console.log(`📤 Login returning permissions:`, user.permissions);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        profile_picture: user.profile_picture,
        schoolId: user.schoolId,
        class: user.class,
        gradeLevel: user.gradeLevel,
        subject: user.subject,
        emailVerified: user.emailVerified,
        accountActive: user.accountActive,
        permissions: user.permissions || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Use direct MongoDB query to get ALL fields including permissions
    const db = mongoose.connection.db;
    const userDoc = await db.collection('users').findOne(
      { _id: new mongoose.Types.ObjectId(decoded.userId) },
      { projection: { password: 0, password_hash: 0 } }
    );
    
    if (!userDoc) return res.status(404).json({ success: false, error: 'User not found' });

    // ========== FIX #2: CHECK IF ACCOUNT IS DISABLED ==========
    if (userDoc.accountActive === false) {
      return res.status(403).json({ 
        success: false, 
        error: 'Your account has been disabled.' 
      });
    }

    console.log('📤 /me returning permissions:', userDoc.permissions);

    return res.json({
      success: true,
      user: {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        contact: userDoc.contact,
        gender: userDoc.gender,
        date_of_birth: userDoc.date_of_birth,
        profile_picture: userDoc.profile_picture,
        schoolId: userDoc.schoolId,
        class: userDoc.class,
        gradeLevel: userDoc.gradeLevel,
        subject: userDoc.subject,
        emailVerified: userDoc.emailVerified,
        accountActive: userDoc.accountActive,
        permissions: userDoc.permissions || null,
      },
    });
  } catch (error) {
    console.error('/me error:', error);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
});

router.put('/update-profile', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, contact, gender, date_of_birth, profile_picture, profilePicture } = req.body;

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (name) user.name = name;
    if (contact !== undefined) user.contact = contact;
    if (gender !== undefined) user.gender = gender;
    if (date_of_birth !== undefined) user.date_of_birth = date_of_birth;
    if (profile_picture !== undefined) user.profile_picture = profile_picture;
    if (profilePicture !== undefined) user.profile_picture = profilePicture;

    user.updatedAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        contact: user.contact, gender: user.gender, date_of_birth: user.date_of_birth,
        profile_picture: user.profile_picture, schoolId: user.schoolId, class: user.class,
        gradeLevel: user.gradeLevel, subject: user.subject, emailVerified: user.emailVerified,
        accountActive: user.accountActive,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

router.put('/update-picture', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { profile_picture, profilePicture } = req.body;

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.profile_picture = profile_picture ?? profilePicture ?? null;
    user.updatedAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Profile picture updated successfully',
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        contact: user.contact, gender: user.gender, date_of_birth: user.date_of_birth,
        profile_picture: user.profile_picture, schoolId: user.schoolId, class: user.class,
        gradeLevel: user.gradeLevel, subject: user.subject, emailVerified: user.emailVerified,
        accountActive: user.accountActive,
      },
    });
  } catch (error) {
    console.error('Update picture error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update profile picture' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

function normalizeRole(role) {
  if (!role) return role;
  const lower = role.toLowerCase();
  if (lower.includes('platform')) return 'Platform Admin';
  if (lower.includes('school')) return 'School Admin';
  if (lower.includes('teacher')) return 'Teacher';
  if (lower.includes('student')) return 'Student';
  if (lower.includes('parent')) return 'Parent';
  if (lower.includes('trial student')) return 'Trial Student';
  if (lower.includes('trial teacher')) return 'Trial Teacher';
  return role;
}

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      schoolId,
      class: studentClass,
      gradeLevel,
      username,
      subject,
      contact,
      gender,
      date_of_birth,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and role are required' });
    }

    const normalizedRole = normalizeRole(role);

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ success: false, error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,  // ✅ Using 'password' field
      role: normalizedRole,
      schoolId: schoolId || null,
      class: studentClass || null,
      gradeLevel: gradeLevel || null,
      username: username || null,
      subject: subject || null,
      contact: contact || null,
      gender: gender || null,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
      emailVerified: true,
      accountActive: true,
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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    // ✅ FIXED: Now only checking 'password' field (standardized)
    if (!user.password) {
      console.error('❌ No password field found for user:', email);
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    // Role is automatically determined from the database, not from user input
    // This improves security by preventing role spoofing attempts
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

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
        requirePasswordChange: user.requirePasswordChange,
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
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    return res.json({
      success: true,
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
        requirePasswordChange: user.requirePasswordChange,
      },
    });
  } catch (error) {
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
      },
    });
  } catch (error) {
    console.error('Update picture error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update profile picture' });
  }
});

router.put('/change-password', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { oldPassword, newPassword } = req.body;

    // Validate required fields
    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'New password is required' });
    }

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // If old password is provided, verify it (for regular password changes)
    // If not provided, only allow if requirePasswordChange is true (first-time login)
    if (oldPassword) {
      const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidOldPassword) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }
    } else if (!user.requirePasswordChange) {
      // If no old password and not required to change, reject
      return res.status(400).json({ 
        success: false, 
        error: 'Current password is required' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear requirePasswordChange flag
    // Also clear tempPassword so user is removed from pending credentials page
    user.password = hashedPassword;
    user.requirePasswordChange = false;
    user.tempPassword = null;
    user.updatedAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

module.exports = router;
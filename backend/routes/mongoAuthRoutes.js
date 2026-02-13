const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const School = require('../models/School');
const License = require('../models/License');
const MarketSurvey = require('../models/MarketSurvey');
const RegistrationPIN = require('../models/RegistrationPIN');
const { sendVerificationPIN } = require('../services/emailService');
const { generateSixDigitPIN } = require('../utils/pinGenerator');
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

// POST /register-school-admin - Step 1: Send verification PIN
router.post('/register-school-admin', async (req, res) => {
  try {
    const {
      email,
      password,
      institutionName,
      referralSource,
    } = req.body;

    // Validation - only email, password, and institutionName required
    if (!email || !password || !institutionName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and institution name are required' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Check if institution name already exists
    // Escape special regex characters to prevent regex injection
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedInstitutionName = escapeRegex(institutionName);
    
    const existingSchool = await School.findOne({ 
      organization_name: new RegExp(`^${escapedInstitutionName}$`, 'i') 
    });
    if (existingSchool) {
      return res.status(400).json({ 
        success: false, 
        error: 'An organization with this name already exists. Please use a different name.' 
      });
    }

    // Generate 6-digit PIN
    const pin = generateSixDigitPIN();
    
    // Set expiry time to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store or update registration data with PIN
    await RegistrationPIN.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        email: email.toLowerCase(),
        pin: pin,
        registrationData: {
          institutionName: institutionName,
          password: hashedPassword,
          referralSource: referralSource || null
        },
        expiresAt: expiresAt,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Send verification PIN email
    const emailResult = await sendVerificationPIN(email.toLowerCase(), pin, institutionName);
    
    if (!emailResult.success) {
      // If email fails, delete the PIN record
      await RegistrationPIN.deleteOne({ email: email.toLowerCase() });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send verification email. Please try again.' 
      });
    }

    console.log(`📧 Verification PIN sent to ${email} for institution: ${institutionName}`);
    console.log(`   PIN expires at: ${expiresAt.toISOString()}`);

    return res.json({ 
      success: true, 
      message: 'Verification PIN sent to your email. Please check your inbox.',
      email: email.toLowerCase(),
      expiresIn: 15 // minutes
    });
  } catch (error) {
    console.error('Registration PIN generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// POST /verify-pin - Step 2: Verify PIN and create school/admin
router.post('/verify-pin', async (req, res) => {
  try {
    const { email, pin } = req.body;

    // Validation
    if (!email || !pin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and PIN are required' 
      });
    }

    // Find the registration record
    const registrationRecord = await RegistrationPIN.findOne({ 
      email: email.toLowerCase() 
    });

    if (!registrationRecord) {
      return res.status(404).json({ 
        success: false, 
        error: 'No pending registration found for this email. Please register again.' 
      });
    }

    // Check if PIN has expired
    if (registrationRecord.isExpired()) {
      await RegistrationPIN.deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ 
        success: false, 
        error: 'PIN has expired. Please register again to receive a new PIN.' 
      });
    }

    // Verify PIN
    if (registrationRecord.pin !== pin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid PIN. Please check and try again.' 
      });
    }

    // PIN is valid - proceed with school and admin creation
    const { institutionName, password, referralSource } = registrationRecord.registrationData;

    // Find the trial license
    const trialLicense = await License.findOne({ 
      name: 'Free Trial',
      type: 'free',
      isActive: true 
    });
    
    if (!trialLicense) {
      console.error('❌ Trial license not found in database');
      return res.status(500).json({ 
        success: false, 
        error: 'Trial license not configured. Please contact support.' 
      });
    }

    // Create school with free trial license
    const newSchool = new School({
      organization_name: institutionName,
      organization_type: 'school',
      licenseId: trialLicense._id,
      licenseExpiresAt: null, // Free trial is perpetual (no expiration)
      contact: email.toLowerCase(), // Use email as contact
      is_active: true,
      current_teachers: 0,
      current_students: 0,
      current_classes: 0
    });

    await newSchool.save();

    // Generate user-friendly name from email
    // e.g., "john.doe@example.com" -> "John Doe"
    const emailPrefix = email.split('@')[0];
    const nameParts = emailPrefix.split(/[._-]/).filter(part => part.length > 0);
    const displayName = nameParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ') || emailPrefix;

    // Create institute admin user
    const newUser = new User({
      name: displayName,
      email: email.toLowerCase(),
      password: password, // Already hashed
      role: 'School Admin',
      schoolId: newSchool._id.toString(),
      contact: null,
      gender: null,
      date_of_birth: null,
      emailVerified: true,
      isTrialUser: true
    });

    await newUser.save();

    // Log referral source if provided (for analytics)
    if (referralSource) {
      console.log(`📊 New institute registration - Referral source: ${referralSource}`);
      
      // Save to market survey
      const surveyEntry = new MarketSurvey({
        type: 'registration_referral',
        reason: referralSource,
        otherReason: null,
        schoolId: newSchool._id,
        schoolName: newSchool.organization_name,
        userEmail: email.toLowerCase()
      });
      await surveyEntry.save();
    }

    // Delete the registration record after successful creation
    await RegistrationPIN.deleteOne({ email: email.toLowerCase() });

    console.log(`✅ Institute registered after PIN verification: ${email} for ${institutionName}`);
    console.log(`   License: ${trialLicense.name} (Teachers: 0/${trialLicense.maxTeachers}, Students: 0/${trialLicense.maxStudents}, Classes: 0/${trialLicense.maxClasses})`);

    return res.json({ 
      success: true, 
      message: 'Email verified successfully! Your institute has been registered.',
      schoolId: newSchool._id
    });
  } catch (error) {
    console.error('PIN verification error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Verification failed. Please try again.' 
    });
  }
});

// POST /resend-pin - Resend verification PIN
router.post('/resend-pin', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    // Find the registration record
    const registrationRecord = await RegistrationPIN.findOne({ 
      email: email.toLowerCase() 
    });

    if (!registrationRecord) {
      return res.status(404).json({ 
        success: false, 
        error: 'No pending registration found for this email. Please register again.' 
      });
    }

    // Generate new 6-digit PIN
    const newPin = generateSixDigitPIN();
    
    // Set new expiry time to 15 minutes from now
    const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Update the registration record with new PIN and expiry
    registrationRecord.pin = newPin;
    registrationRecord.expiresAt = newExpiresAt;
    registrationRecord.createdAt = new Date();
    await registrationRecord.save();

    // Send new verification PIN email
    const emailResult = await sendVerificationPIN(
      email.toLowerCase(), 
      newPin, 
      registrationRecord.registrationData.institutionName
    );
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send verification email. Please try again.' 
      });
    }

    console.log(`📧 New verification PIN sent to ${email}`);
    console.log(`   New PIN expires at: ${newExpiresAt.toISOString()}`);

    return res.json({ 
      success: true, 
      message: 'New verification PIN sent to your email. Please check your inbox.',
      email: email.toLowerCase(),
      expiresIn: 15 // minutes
    });
  } catch (error) {
    console.error('Resend PIN error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to resend PIN. Please try again.' 
    });
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
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role, schoolId: user.schoolId }, JWT_SECRET, { expiresIn: '7d' });

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
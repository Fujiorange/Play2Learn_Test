// backend/routes/mongoTeacherRoutes.js - Complete Teacher Routes
// ✅ Dashboard with stats
// ✅ Profile management
// ✅ Student monitoring (class details, student details, quiz results, points, skill matrix, leaderboard)
// ✅ Quiz launching (adaptive quizzes)
// ✅ Communication with students and parents

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const MathProfile = require('../models/MathProfile');
const MathSkill = require('../models/MathSkill');
const SupportTicket = require('../models/SupportTicket');
const Class = require('../models/Class');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// ==================== MESSAGE SCHEMA ====================
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, required: true },
  receiverRole: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

// ==================== AUTHENTICATION MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Middleware to verify teacher role
const authenticateTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || (user.role !== 'Teacher' && user.role !== 'Trial Teacher')) {
      return res.status(403).json({ success: false, error: 'Access restricted to teachers' });
    }

    req.teacher = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

router.use(authenticateToken);
router.use(authenticateTeacher);

// ==================== DASHBOARD ====================
router.get('/dashboard', async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const teacher = req.teacher;

    // Get assigned classes and subjects
    const assignedClasses = teacher.assignedClasses || [];
    const assignedSubjects = teacher.assignedSubjects || [];

    // === FIX: Convert class IDs to names for display ===
    let assignedClassNames = assignedClasses; // Default to what we have

    if (assignedClasses.length > 0 && /^[a-f\d]{24}$/i.test(assignedClasses[0].toString())) {
      // We have ObjectIds - convert to names
      const classDocs = await Class.find({
        _id: { $in: assignedClasses }
      }).select('class_name');

      assignedClassNames = classDocs.map(c => c.class_name);
      console.log('📊 Dashboard - Converted class IDs to names:', assignedClassNames);
    }
    // === END FIX ===

    console.log('📊 Teacher dashboard for:', teacher.email);
    console.log('📊 Assigned class IDs:', assignedClasses);
    console.log('📊 Assigned class names:', assignedClassNames);
    console.log('📊 Teacher schoolId:', teacher.schoolId);

    // Count students - if no assigned classes, count all students in same school
    let totalStudents = 0;
    if (assignedClasses.length > 0) {
      // Use IDs for database queries (Student documents reference IDs)
      totalStudents = await User.countDocuments({
        role: 'Student',
        class: { $in: assignedClasses }  // This must be IDs
      });
    } else if (teacher.schoolId) {
      totalStudents = await User.countDocuments({
        role: 'Student',
        schoolId: teacher.schoolId
      });
      console.log('📊 Using schoolId fallback, found', totalStudents, 'students');
    }

    // Count active quizzes visible to this teacher (launched for their school/classes)
    let teacherClassNames = [];
    
    if (assignedClasses.length > 0) {
      const isObjectId = /^[a-f\d]{24}$/i.test(assignedClasses[0].toString());
      if (isObjectId) {
        const classDocs = await Class.find({
          _id: { $in: assignedClasses }
        }).select('class_name');
        teacherClassNames = classDocs.map(c => c.class_name);
      } else {
        teacherClassNames = assignedClasses;
      }
    }

    // Count quizzes that are active and visible to this teacher
    let quizQuery = {
      is_active: true,
      is_launched: true,
      $or: [
        { launch_end_date: null },
        { launch_end_date: { $gte: new Date() } }
      ]
    };

    // Filter by teacher's school/classes if they have any
    if (teacher.schoolId || teacherClassNames.length > 0) {
      quizQuery.$and = [
        quizQuery.$or ? { $or: quizQuery.$or } : {},
        {
          $or: [
            { launched_for_school: teacher.schoolId?.toString() },
            { launched_for_classes: { $in: teacherClassNames } },
            // Launched for ALL (no restrictions)
            { 
              $and: [
                { $or: [{ launched_for_classes: { $size: 0 } }, { launched_for_classes: { $exists: false } }] },
                { $or: [{ launched_for_school: null }, { launched_for_school: { $exists: false } }] }
              ]
            }
          ]
        }
      ];
      delete quizQuery.$or;
    }

    const activeQuizzes = await Quiz.countDocuments(quizQuery);
    console.log('📊 Active quizzes for teacher:', activeQuizzes);

    // Get recent quiz attempts from students
    let studentQuery = { role: 'Student' };
    if (assignedClasses.length > 0) {
      studentQuery.class = { $in: assignedClasses }; // Use IDs here too
    } else if (teacher.schoolId) {
      studentQuery.schoolId = teacher.schoolId;
    }
    const students = await User.find(studentQuery).select('_id');

    const studentIds = students.map(s => s._id);

    const recentAttempts = await QuizAttempt.countDocuments({
      userId: { $in: studentIds },
      startedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Calculate average performance
    const completedAttempts = await QuizAttempt.find({
      userId: { $in: studentIds },
      is_completed: true
    }).select('correct_count total_answered');

    let avgPerformance = 0;
    if (completedAttempts.length > 0) {
      const totalCorrect = completedAttempts.reduce((sum, a) => sum + (a.correct_count || 0), 0);
      const totalAnswered = completedAttempts.reduce((sum, a) => sum + (a.total_answered || 0), 0);
      avgPerformance = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    }

    res.json({
      success: true,
      data: {
        total_courses: assignedClassNames.length,
        total_students: totalStudents,
        active_assignments: activeQuizzes,
        avg_performance: avgPerformance,
        recent_attempts: recentAttempts,
        assigned_classes: assignedClassNames, // Send names to frontend
        assigned_subjects: assignedSubjects
      }
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
});

// ==================== PROFILE MANAGEMENT ====================
router.get('/profile', async (req, res) => {
  try {
    const teacher = await User.findById(req.user.userId)
      .select('-password -verificationToken');

    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }

    res.json({ success: true, user: teacher });
  } catch (error) {
    console.error('Get teacher profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to load profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, contact, gender, date_of_birth } = req.body;

    const teacher = await User.findById(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }

    if (name) teacher.name = name;
    if (contact !== undefined) teacher.contact = contact;
    if (gender !== undefined) teacher.gender = gender;
    if (date_of_birth !== undefined) teacher.date_of_birth = date_of_birth;

    await teacher.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: teacher.name,
        email: teacher.email,
        contact: teacher.contact,
        gender: teacher.gender,
        date_of_birth: teacher.date_of_birth,
        role: teacher.role,
        assignedClasses: teacher.assignedClasses,
        assignedSubjects: teacher.assignedSubjects
      }
    });
  } catch (error) {
    console.error('Update teacher profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

router.put('/profile/picture', async (req, res) => {
  try {
    const { profile_picture } = req.body;

    const teacher = await User.findById(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }

    teacher.profile_picture = profile_picture;
    await teacher.save();

    res.json({
      success: true,
      message: 'Profile picture updated',
      user: { profile_picture: teacher.profile_picture }
    });
  } catch (error) {
    console.error('Update teacher picture error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile picture' });
  }
});

// ==================== STUDENT MONITORING ====================

// Get students in assigned classes
router.get('/students', async (req, res) => {
  try {
    const teacher = req.teacher;
    const assignedClasses = teacher.assignedClasses || [];

    if (assignedClasses.length === 0) {
      return res.json({ success: true, students: [], message: 'No classes assigned' });
    }

    const { className, search } = req.query;

    let filter = {
      role: 'Student',
      class: { $in: assignedClasses }
    };

    if (className && className !== 'all') {
      filter.class = className;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const students = await User.find(filter)
      .select('name email class gradeLevel profile_picture accountActive createdAt')
      .sort({ name: 1 });

    // Get math profiles for all students
    const studentIds = students.map(s => s._id);
    const mathProfiles = await MathProfile.find({ student_id: { $in: studentIds } });
    const profileMap = {};
    mathProfiles.forEach(mp => {
      profileMap[mp.student_id.toString()] = mp;
    });

    // Combine data
    const studentsWithStats = students.map(student => {
      const profile = profileMap[student._id.toString()];
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        class: student.class,
        gradeLevel: student.gradeLevel,
        profile_picture: student.profile_picture,
        accountActive: student.accountActive,
        points: profile?.total_points || 0,
        level: profile?.current_profile || 1,
        streak: profile?.streak || 0,
        placementCompleted: profile?.placement_completed || false
      };
    });

    res.json({ success: true, students: studentsWithStats });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, error: 'Failed to load students' });
  }
});

// Get single student details
router.get('/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacher = req.teacher;
    const assignedClasses = teacher.assignedClasses || [];

    const student = await User.findById(studentId)
      .select('-password -verificationToken');

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Verify teacher has access to this student's class
    if (!assignedClasses.includes(student.class)) {
      return res.status(403).json({ success: false, error: 'Access denied to this student' });
    }

    // Get math profile
    const mathProfile = await MathProfile.findOne({ student_id: studentId });

    // Get quiz attempts
    const quizAttempts = await QuizAttempt.find({ userId: studentId })
      .populate('quizId', 'title quiz_type')
      .sort({ startedAt: -1 })
      .limit(20);

    // Get skills
    const skills = await MathSkill.find({ student_id: studentId });

    res.json({
      success: true,
      student: {
        ...student.toObject(),
        mathProfile: mathProfile,
        quizAttempts: quizAttempts,
        skills: skills
      }
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ success: false, error: 'Failed to load student details' });
  }
});

// Get student quiz results
router.get('/students/:studentId/quiz-results', async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacher = req.teacher;

    // Verify access
    const student = await User.findById(studentId);
    if (!student || !teacher.assignedClasses?.includes(student.class)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const attempts = await QuizAttempt.find({ userId: studentId })
      .populate('quizId', 'title description quiz_type adaptive_config')
      .sort({ startedAt: -1 });

    const results = attempts.map(attempt => ({
      attemptId: attempt._id,
      quizTitle: attempt.quizId?.title || 'Unknown Quiz',
      quizType: attempt.quizId?.quiz_type || 'adaptive',
      correct_count: attempt.correct_count,
      total_answered: attempt.total_answered,
      accuracy: attempt.total_answered > 0
        ? Math.round((attempt.correct_count / attempt.total_answered) * 100)
        : 0,
      is_completed: attempt.is_completed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt
    }));

    res.json({ success: true, results });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ success: false, error: 'Failed to load quiz results' });
  }
});

// Get student skill matrix
router.get('/students/:studentId/skills', async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacher = req.teacher;

    // Verify access
    const student = await User.findById(studentId);
    if (!student || !teacher.assignedClasses?.includes(student.class)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const skills = await MathSkill.find({ student_id: studentId });

    res.json({ success: true, skills });
  } catch (error) {
    console.error('Get student skills error:', error);
    res.status(500).json({ success: false, error: 'Failed to load skills' });
  }
});

// Get class leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const teacher = req.teacher;
    const assignedClasses = teacher.assignedClasses || [];
    const { className } = req.query;

    let filter = {
      role: 'Student',
      class: { $in: assignedClasses }
    };

    if (className && className !== 'all' && assignedClasses.includes(className)) {
      filter.class = className;
    }

    const students = await User.find(filter).select('_id name class profile_picture');
    const studentIds = students.map(s => s._id);

    const mathProfiles = await MathProfile.find({ student_id: { $in: studentIds } });
    const profileMap = {};
    mathProfiles.forEach(mp => {
      profileMap[mp.student_id.toString()] = mp;
    });

    const leaderboard = students.map(student => {
      const profile = profileMap[student._id.toString()];
      return {
        _id: student._id,
        name: student.name,
        class: student.class,
        profile_picture: student.profile_picture,
        points: profile?.total_points || 0,
        level: profile?.current_profile || 1,
        streak: profile?.streak || 0
      };
    }).sort((a, b) => b.points - a.points);

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load leaderboard' });
  }
});

// Get class performance summary
router.get('/class-performance', async (req, res) => {
  try {
    const teacher = req.teacher;
    const assignedClasses = teacher.assignedClasses || [];

    const classStats = [];

    for (const className of assignedClasses) {
      const students = await User.find({ role: 'Student', class: className }).select('_id');
      const studentIds = students.map(s => s._id);

      const mathProfiles = await MathProfile.find({ student_id: { $in: studentIds } });

      const totalPoints = mathProfiles.reduce((sum, mp) => sum + (mp.total_points || 0), 0);
      const avgPoints = students.length > 0 ? Math.round(totalPoints / students.length) : 0;
      const avgLevel = students.length > 0
        ? Math.round(mathProfiles.reduce((sum, mp) => sum + (mp.current_profile || 1), 0) / mathProfiles.length)
        : 1;

      classStats.push({
        className,
        totalStudents: students.length,
        averagePoints: avgPoints,
        averageLevel: avgLevel
      });
    }

    res.json({ success: true, classStats });
  } catch (error) {
    console.error('Get class performance error:', error);
    res.status(500).json({ success: false, error: 'Failed to load class performance' });
  }
});

// ==================== QUIZ MANAGEMENT ====================

// Get available quizzes (created by P2L admin) - FIXED: Filter by teacher's school/classes
router.get('/available-quizzes', async (req, res) => {
  try {
    const teacher = req.teacher;
    
    // Get teacher's class names (for matching launched_for_classes)
    let teacherClassNames = [];
    
    if (teacher.assignedClasses?.length > 0) {
      const firstClass = teacher.assignedClasses[0];
      const isObjectId = /^[a-f\d]{24}$/i.test(firstClass.toString());
      
      if (isObjectId) {
        const classDocs = await Class.find({
          _id: { $in: teacher.assignedClasses }
        }).select('class_name');
        teacherClassNames = classDocs.map(c => c.class_name);
      } else {
        teacherClassNames = teacher.assignedClasses;
      }
    }

    console.log('🎯 Teacher school:', teacher.schoolId);
    console.log('🎯 Teacher classes:', teacherClassNames);

    // Build query - show quizzes that are relevant to this teacher
    let query = {
      is_active: true,
      quiz_type: 'adaptive'
    };

    // If teacher has school/classes, filter by them
    // Otherwise show all active quizzes
    if (teacher.schoolId || teacherClassNames.length > 0) {
      query.$or = [
        // Launched for this teacher's school
        { launched_for_school: teacher.schoolId?.toString() },
        // Launched for teacher's classes (case-insensitive match)
        { launched_for_classes: { $in: teacherClassNames } },
        // Not launched yet (available to all)
        { is_launched: false },
        // Launched for ALL (empty arrays/null school means everyone)
        { 
          is_launched: true,
          $and: [
            { $or: [{ launched_for_classes: { $size: 0 } }, { launched_for_classes: { $exists: false } }] },
            { $or: [{ launched_for_school: null }, { launched_for_school: { $exists: false } }] }
          ]
        }
      ];
    }

    const quizzes = await Quiz.find(query)
      .select('title description quiz_type adaptive_config is_launched launched_by launched_for_classes launched_for_school launch_start_date launch_end_date createdAt')
      .sort({ createdAt: -1 });

    console.log('📚 Found', quizzes.length, 'quizzes for teacher');

    // Mark which ones are launched by this teacher
    const quizzesWithStatus = quizzes.map(quiz => ({
      ...quiz.toObject(),
      launchedByMe: quiz.launched_by?.toString() === req.user.userId
    }));

    res.json({ success: true, quizzes: quizzesWithStatus });
  } catch (error) {
    console.error('Get available quizzes error:', error);
    res.status(500).json({ success: false, error: 'Failed to load quizzes' });
  }
});

// Get quizzes launched by this teacher
router.get('/my-launched-quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      launched_by: req.user.userId,
      is_launched: true
    })
      .select('title description quiz_type adaptive_config launched_at launched_for_classes launch_start_date launch_end_date')
      .sort({ launched_at: -1 });

    res.json({ success: true, quizzes });
  } catch (error) {
    console.error('Get launched quizzes error:', error);
    res.status(500).json({ success: false, error: 'Failed to load launched quizzes' });
  }
});

// Launch a quiz for assigned classes
router.post('/launch-quiz', async (req, res) => {
  try {
    const { quizId, classes, startDate, endDate } = req.body;
    const teacher = req.teacher;

    if (!quizId) {
      return res.status(400).json({ success: false, error: 'Quiz ID is required' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    if (quiz.quiz_type !== 'adaptive') {
      return res.status(400).json({ success: false, error: 'Only adaptive quizzes can be launched by teachers' });
    }

    // === FIX: Convert class IDs to names ===
    console.log('🔍 Teacher assignedClasses (IDs):', teacher.assignedClasses);
    console.log('🔍 Request classes (names):', classes);

    // Get the Class model

    // Step 1: Look up what classes these IDs represent
    const classDocs = await Class.find({
      _id: { $in: teacher.assignedClasses || [] }
    }).select('_id class_name');

    console.log('📚 Teacher classes from DB:', classDocs);

    // Create map of Name -> ID (for storage) and collect teacher's class names
    const nameToIdMap = {};
    const teacherClassNames = [];

    classDocs.forEach(c => {
      nameToIdMap[c.class_name.toLowerCase()] = c._id.toString();
      teacherClassNames.push(c.class_name.toLowerCase());
    });

    console.log('🗺️ Name -> ID map:', nameToIdMap);
    console.log('👨‍🏫 Teacher class names:', teacherClassNames);

    // Step 2: Check if requested classes match teacher's classes
    const requestedClasses = (classes || []).map(c => c.toString().toLowerCase().trim());
    console.log('🎯 Requested classes (normalized):', requestedClasses);

    // Find which requested classes teacher actually teaches
    const validClassNames = requestedClasses.filter(c =>
      teacherClassNames.includes(c)
    );

    console.log('✅ Valid class names:', validClassNames);

    if (validClassNames.length === 0) {
      // Show teacher's actual class NAMES (not IDs) in error message
      const teacherClassDisplayNames = classDocs.map(c => c.class_name).join(', ');
      return res.status(400).json({
        success: false,
        error: `No valid classes selected. You teach: ${teacherClassDisplayNames || 'no classes'}. You selected: ${classes?.join(', ') || 'none'}`
      });
    }

    // Step 3: Convert valid names back to IDs for storage
    const validClassIds = validClassNames.map(name =>
      nameToIdMap[name.toLowerCase()]
    ).filter(id => id);

    console.log('🎯 Valid class IDs for storage:', validClassIds);
    // === END FIX ===

    // Update quiz with launch info
    quiz.is_launched = true;
    quiz.launched_by = req.user.userId;
    quiz.launched_at = new Date();
    quiz.launched_for_classes = validClassIds; // Store IDs
    quiz.launch_start_date = startDate ? new Date(startDate) : new Date();
    quiz.launch_end_date = endDate ? new Date(endDate) : null;

    await quiz.save();

    res.json({
      success: true,
      message: `Quiz launched successfully for classes: ${validClassNames.join(', ')}`,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        launched_for_classes: validClassNames,
        launch_start_date: quiz.launch_start_date,
        launch_end_date: quiz.launch_end_date
      }
    });
  } catch (error) {
    console.error('Launch quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to launch quiz: ' + error.message });
  }
});

// Revoke quiz launch
router.post('/revoke-quiz/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    // Verify teacher launched this quiz
    if (quiz.launched_by?.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only revoke quizzes you launched' });
    }

    quiz.is_launched = false;
    quiz.launched_by = null;
    quiz.launched_at = null;
    quiz.launched_for_classes = [];
    quiz.launch_start_date = null;
    quiz.launch_end_date = null;

    await quiz.save();

    res.json({ success: true, message: 'Quiz launch revoked' });
  } catch (error) {
    console.error('Revoke quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke quiz' });
  }
});

// ==================== ASSIGNED CLASSES INFO ====================

// Get assigned classes
router.get('/my-classes', async (req, res) => {
  try {
    const teacher = req.teacher;
    const assignedClassIds = teacher.assignedClasses || [];

    let classNames = [];

    if (assignedClassIds.length > 0) {
      const firstClass = assignedClassIds[0];
      const isObjectId = typeof firstClass === 'string' && /^[a-f\d]{24}$/i.test(firstClass);

      if (isObjectId) {
        const objectIds = assignedClassIds.map(id => {
          try { return new mongoose.Types.ObjectId(id); }
          catch (e) { return null; }
        }).filter(id => id !== null);

        const classes = await Class.find({ _id: { $in: objectIds } }).select('class_name');
        classNames = classes.map(c => c.class_name);
        console.log('📚 Resolved class names:', classNames);
      } else {
        classNames = assignedClassIds;
      }
    }

    res.json({
      success: true,
      classes: classNames,
      classIds: assignedClassIds,
      subjects: teacher.assignedSubjects || []
    });
  } catch (error) {
    console.error('Get my classes error:', error);
    res.status(500).json({ success: false, error: 'Failed to load classes' });
  }
});

// ==================== SUPPORT TICKETS ====================
// FIXED: Uses SupportTicket model with correct fields for School Admin visibility

router.post('/support-tickets', async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const teacher = req.teacher;
    const { subject, description, category, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, error: 'Subject and description are required' });
    }

    const ticket = await SupportTicket.create({
      user_id: teacherId,
      user_name: teacher.name || 'Unknown Teacher',
      user_email: teacher.email || 'unknown@email.com',
      user_role: 'Teacher',
      school_id: teacher.schoolId || teacher.school,
      school_name: teacher.schoolName || '',
      subject: subject,
      category: category || 'school',
      message: description,
      status: 'open',
      priority: priority || 'normal'
    });

    console.log('✅ Teacher ticket created:', ticket._id);

    res.status(201).json({
      success: true,
      ticketId: ticket._id,
      ticket: {
        _id: ticket._id,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        created_at: ticket.created_at
      }
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to create support ticket' });
  }
});

router.get('/support-tickets', async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const tickets = await SupportTicket.find({ user_id: teacherId })
      .sort({ created_at: -1 })
      .lean();

    const formattedTickets = tickets.map(ticket => ({
      _id: ticket._id,
      id: `#${ticket._id.toString().slice(-6).toUpperCase()}`,
      subject: ticket.subject,
      category: ticket.category,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      created_at: ticket.created_at,
      admin_response: ticket.admin_response,
      responded_at: ticket.responded_at,
      hasReply: !!ticket.admin_response
    }));

    res.json({ success: true, tickets: formattedTickets });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ success: false, error: 'Failed to load support tickets' });
  }
});

router.get('/support-tickets/:ticketId', async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      user_id: teacherId
    }).lean();

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({
      success: true,
      ticket: {
        _id: ticket._id,
        subject: ticket.subject,
        category: ticket.category,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        admin_response: ticket.admin_response,
        responded_at: ticket.responded_at
      }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to load ticket' });
  }
});

// ==================== TESTIMONIALS ====================
router.post('/testimonials', async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const teacher = req.teacher;
    const { content, rating } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const db = mongoose.connection.db;

    const testimonial = {
      userId: new mongoose.Types.ObjectId(teacherId),
      userName: teacher.name,
      userRole: 'Teacher',
      content,
      rating: rating || 5,
      approved: false,
      createdAt: new Date()
    };

    await db.collection('testimonials').insertOne(testimonial);

    res.json({ success: true, message: 'Testimonial submitted successfully' });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit testimonial' });
  }
});


module.exports = router;
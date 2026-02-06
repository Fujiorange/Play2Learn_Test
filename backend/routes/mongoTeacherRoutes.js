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
    
    // Count students in assigned classes
    let totalStudents = 0;
    if (assignedClasses.length > 0) {
      totalStudents = await User.countDocuments({
        role: 'Student',
        class: { $in: assignedClasses }
      });
    }
    
    // Count active quizzes launched by this teacher
    const activeQuizzes = await Quiz.countDocuments({
      launched_by: teacherId,
      is_launched: true,
      $or: [
        { launch_end_date: null },
        { launch_end_date: { $gte: new Date() } }
      ]
    });
    
    // Get recent quiz attempts from students in assigned classes
    const students = await User.find({
      role: 'Student',
      class: { $in: assignedClasses }
    }).select('_id');
    
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
        total_courses: assignedClasses.length,
        total_students: totalStudents,
        active_assignments: activeQuizzes,
        avg_performance: avgPerformance,
        recent_attempts: recentAttempts,
        assigned_classes: assignedClasses,
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

// Get available quizzes (created by P2L admin)
router.get('/available-quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ 
      is_active: true,
      quiz_type: 'adaptive'
    })
    .select('title description quiz_type adaptive_config is_launched launched_by launched_for_classes createdAt')
    .sort({ createdAt: -1 });
    
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
    
    // Verify teacher has access to the classes
    const targetClasses = classes || teacher.assignedClasses || [];
    const validClasses = targetClasses.filter(c => teacher.assignedClasses?.includes(c));
    
    if (validClasses.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid classes selected' });
    }
    
    // Update quiz with launch info
    quiz.is_launched = true;
    quiz.launched_by = req.user.userId;
    quiz.launched_at = new Date();
    quiz.launched_for_classes = validClasses;
    quiz.launch_start_date = startDate ? new Date(startDate) : new Date();
    quiz.launch_end_date = endDate ? new Date(endDate) : null;
    
    await quiz.save();
    
    res.json({
      success: true,
      message: 'Quiz launched successfully',
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        launched_for_classes: validClasses,
        launch_start_date: quiz.launch_start_date,
        launch_end_date: quiz.launch_end_date
      }
    });
  } catch (error) {
    console.error('Launch quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to launch quiz' });
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

// ==================== COMMUNICATION ====================

// Get conversations (with parents and students)
router.get('/conversations', async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const teacher = req.teacher;
    const assignedClasses = teacher.assignedClasses || [];
    
    // Get students in assigned classes
    const students = await User.find({
      role: 'Student',
      class: { $in: assignedClasses }
    }).select('_id name class');
    
    const studentIds = students.map(s => s._id);
    
    // Get parents of these students
    const parents = await User.find({
      role: 'Parent',
      'linkedStudents.studentId': { $in: studentIds }
    }).select('_id name linkedStudents');
    
    // Get recent messages
    const recentMessages = await Message.find({
      $or: [
        { senderId: teacherId },
        { receiverId: teacherId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(100);
    
    // Build conversation list
    const conversationMap = {};
    
    recentMessages.forEach(msg => {
      const otherId = msg.senderId.toString() === teacherId 
        ? msg.receiverId.toString() 
        : msg.senderId.toString();
      
      if (!conversationMap[otherId]) {
        conversationMap[otherId] = {
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          unreadCount: msg.receiverId.toString() === teacherId && !msg.read ? 1 : 0
        };
      } else if (msg.receiverId.toString() === teacherId && !msg.read) {
        conversationMap[otherId].unreadCount++;
      }
    });
    
    // Build conversations list with user info
    const conversations = [];
    
    // Add parent conversations
    parents.forEach(parent => {
      const conv = conversationMap[parent._id.toString()];
      conversations.push({
        userId: parent._id,
        name: parent.name,
        role: 'Parent',
        lastMessage: conv?.lastMessage || '',
        lastMessageTime: conv?.lastMessageTime || null,
        unreadCount: conv?.unreadCount || 0
      });
    });
    
    // Add student conversations
    students.forEach(student => {
      const conv = conversationMap[student._id.toString()];
      conversations.push({
        userId: student._id,
        name: student.name,
        role: 'Student',
        class: student.class,
        lastMessage: conv?.lastMessage || '',
        lastMessageTime: conv?.lastMessageTime || null,
        unreadCount: conv?.unreadCount || 0
      });
    });
    
    // Sort by last message time
    conversations.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
    
    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, error: 'Failed to load conversations' });
  }
});

// Get messages with a specific user
router.get('/messages/:userId', async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { userId } = req.params;
    
    const messages = await Message.find({
      $or: [
        { senderId: teacherId, receiverId: userId },
        { senderId: userId, receiverId: teacherId }
      ]
    })
    .sort({ createdAt: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { senderId: userId, receiverId: teacherId, read: false },
      { read: true }
    );
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to load messages' });
  }
});

// Send a message
router.post('/messages', async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { receiverId, message } = req.body;
    
    if (!receiverId || !message) {
      return res.status(400).json({ success: false, error: 'Receiver ID and message are required' });
    }
    
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, error: 'Recipient not found' });
    }
    
    const newMessage = new Message({
      senderId: teacherId,
      receiverId: receiverId,
      senderRole: 'Teacher',
      receiverRole: receiver.role,
      message: message.trim()
    });
    
    await newMessage.save();
    
    res.json({
      success: true,
      message: 'Message sent',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// ==================== ASSIGNED CLASSES INFO ====================

// Get assigned classes
router.get('/my-classes', async (req, res) => {
  try {
    const teacher = req.teacher;
    
    res.json({
      success: true,
      classes: teacher.assignedClasses || [],
      subjects: teacher.assignedSubjects || []
    });
  } catch (error) {
    console.error('Get my classes error:', error);
    res.status(500).json({ success: false, error: 'Failed to load classes' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { authMiddleware } = require('../middleware/auth');

// ========================================
// PARENT DASHBOARD ENDPOINTS
// ========================================

/**
 * @route   GET /api/mongo/parent/dashboard
 * @desc    Get parent dashboard data with linked students
 * @access  Private (Parent only)
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // Verify user is a parent
    if (req.user.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Parent role required.'
      });
    }

    // Get parent with linkedStudents
    const parent = await User.findById(req.user.id).select('-password');
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    // Check if parent has any linked students
    if (!parent.linkedStudents || parent.linkedStudents.length === 0) {
      return res.json({
        success: true,
        parent: {
          _id: parent._id,
          name: parent.name,
          email: parent.email,
          linkedStudents: []
        },
        defaultChild: null,
        message: 'No children linked to this account'
      });
    }

    // Get full details for all linked students
    const studentIds = parent.linkedStudents.map(ls => ls.studentId);
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'Student'
    }).select('name email class gradeLevel gender dateOfBirth');

    // Enrich linkedStudents with full student data
    const enrichedLinkedStudents = parent.linkedStudents.map(linkedStudent => {
      const fullStudent = students.find(s => s._id.toString() === linkedStudent.studentId.toString());
      
      if (fullStudent) {
        return {
          studentId: fullStudent._id,
          studentName: fullStudent.name,
          studentEmail: fullStudent.email,
          relationship: linkedStudent.relationship || 'Parent',
          gradeLevel: fullStudent.gradeLevel || 'Primary 1',
          class: fullStudent.class || 'N/A',
          gender: fullStudent.gender,
          dateOfBirth: fullStudent.dateOfBirth
        };
      }
      
      // Fallback if student not found (shouldn't happen)
      return linkedStudent;
    });

    // Return dashboard data with default child (first one)
    res.json({
      success: true,
      parent: {
        _id: parent._id,
        name: parent.name,
        email: parent.email,
        contactNumber: parent.contactNumber,
        gender: parent.gender,
        linkedStudents: enrichedLinkedStudents
      },
      defaultChild: enrichedLinkedStudents[0], // Auto-select first child
      totalChildren: enrichedLinkedStudents.length
    });

  } catch (error) {
    console.error('Error fetching parent dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load parent dashboard',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/mongo/parent/child/:studentId/stats
 * @desc    Get specific child's statistics and performance data
 * @access  Private (Parent only)
 */
router.get('/child/:studentId/stats', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify user is a parent
    if (req.user.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Parent role required.'
      });
    }

    // Get parent and verify this student is linked to them
    const parent = await User.findById(req.user.id);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    // Check if this student is linked to the parent
    const isLinked = parent.linkedStudents?.some(
      ls => ls.studentId.toString() === studentId
    );

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        error: 'This student is not linked to your account'
      });
    }

    // Get student details
    const student = await User.findById(studentId).select('name email class gradeLevel gender dateOfBirth');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Get student profile
    const profile = await StudentProfile.findOne({ userId: studentId });

    // Get quiz attempts for the student
    const quizAttempts = await QuizAttempt.find({ 
      userId: studentId 
    })
    .sort({ completedAt: -1 })
    .limit(10)
    .populate('quizId', 'title topic difficulty');

    // Calculate statistics
    const totalQuizzes = quizAttempts.length;
    const averageScore = totalQuizzes > 0 
      ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizzes 
      : 0;

    // Get recent quiz results
    const recentQuizzes = quizAttempts.slice(0, 5).map(attempt => ({
      quizTitle: attempt.quizId?.title || 'Unknown Quiz',
      topic: attempt.quizId?.topic || 'General',
      score: attempt.score,
      maxScore: 100,
      percentage: attempt.score,
      completedAt: attempt.completedAt,
      difficulty: attempt.quizId?.difficulty
    }));

    // Calculate overall grade based on average score
    let overallGrade = 'N/A';
    if (averageScore >= 90) overallGrade = 'A';
    else if (averageScore >= 80) overallGrade = 'B';
    else if (averageScore >= 70) overallGrade = 'C';
    else if (averageScore >= 60) overallGrade = 'D';
    else if (averageScore > 0) overallGrade = 'F';

    // Get upcoming assignments (mock for now - will be real when assignment system is built)
    const upcomingAssignments = [];

    res.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        class: student.class || 'N/A',
        gradeLevel: student.gradeLevel || 'Primary 1',
        gender: student.gender,
        dateOfBirth: student.dateOfBirth
      },
      stats: {
        // Performance metrics
        overallGrade,
        averageScore: Math.round(averageScore),
        totalQuizzesCompleted: totalQuizzes,
        
        // Profile data
        currentLevel: profile?.currentLevel || 1,
        totalPoints: profile?.totalPoints || 0,
        badges: profile?.badges || [],
        streak: profile?.loginStreak || 0,
        
        // Recent activities
        recentQuizzes,
        
        // Upcoming
        upcomingAssignments,
        assignmentsDue: upcomingAssignments.length,
        
        // Attendance (placeholder - will be real when attendance system is built)
        attendance: '95%'
      }
    });

  } catch (error) {
    console.error('Error fetching child stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load child statistics',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/mongo/parent/child/:studentId/activities
 * @desc    Get specific child's recent activities
 * @access  Private (Parent only)
 */
router.get('/child/:studentId/activities', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Verify user is a parent
    if (req.user.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Parent role required.'
      });
    }

    // Get parent and verify this student is linked to them
    const parent = await User.findById(req.user.id);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    // Check if this student is linked to the parent
    const isLinked = parent.linkedStudents?.some(
      ls => ls.studentId.toString() === studentId
    );

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        error: 'This student is not linked to your account'
      });
    }

    // Get recent quiz attempts as activities
    const quizActivities = await QuizAttempt.find({ 
      userId: studentId 
    })
    .sort({ completedAt: -1 })
    .limit(limit)
    .populate('quizId', 'title topic difficulty');

    // Format activities
    const activities = quizActivities.map(attempt => ({
      type: 'quiz',
      title: `Completed ${attempt.quizId?.title || 'Quiz'}`,
      description: `${attempt.quizId?.topic || 'Mathematics'} - Score: ${attempt.score}%`,
      score: attempt.score,
      timestamp: attempt.completedAt,
      difficulty: attempt.quizId?.difficulty,
      icon: '📝'
    }));

    // TODO: Add other activity types when implemented:
    // - Assignments submitted
    // - Badges earned
    // - Level ups
    // - Login streaks

    res.json({
      success: true,
      activities,
      total: activities.length
    });

  } catch (error) {
    console.error('Error fetching child activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load child activities',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/mongo/parent/child/:studentId/performance
 * @desc    Get detailed performance breakdown by topic/subject
 * @access  Private (Parent only)
 */
router.get('/child/:studentId/performance', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify user is a parent
    if (req.user.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Parent role required.'
      });
    }

    // Get parent and verify this student is linked to them
    const parent = await User.findById(req.user.id);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    // Check if this student is linked to the parent
    const isLinked = parent.linkedStudents?.some(
      ls => ls.studentId.toString() === studentId
    );

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        error: 'This student is not linked to your account'
      });
    }

    // Get all quiz attempts for the student
    const quizAttempts = await QuizAttempt.find({ 
      userId: studentId 
    }).populate('quizId', 'title topic difficulty');

    // Group performance by topic
    const topicPerformance = {};
    
    quizAttempts.forEach(attempt => {
      const topic = attempt.quizId?.topic || 'General Mathematics';
      
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = {
          topic,
          totalAttempts: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          recentAttempts: []
        };
      }
      
      topicPerformance[topic].totalAttempts++;
      topicPerformance[topic].totalScore += attempt.score;
      topicPerformance[topic].bestScore = Math.max(
        topicPerformance[topic].bestScore, 
        attempt.score
      );
      
      // Keep last 3 attempts for each topic
      if (topicPerformance[topic].recentAttempts.length < 3) {
        topicPerformance[topic].recentAttempts.push({
          score: attempt.score,
          date: attempt.completedAt
        });
      }
    });

    // Calculate averages
    Object.values(topicPerformance).forEach(topic => {
      topic.averageScore = Math.round(topic.totalScore / topic.totalAttempts);
      
      // Determine grade
      const avg = topic.averageScore;
      if (avg >= 90) topic.grade = 'A';
      else if (avg >= 80) topic.grade = 'B';
      else if (avg >= 70) topic.grade = 'C';
      else if (avg >= 60) topic.grade = 'D';
      else topic.grade = 'F';
      
      // Determine progress (comparing recent vs overall)
      if (topic.recentAttempts.length > 0) {
        const recentAvg = topic.recentAttempts.reduce((sum, a) => sum + a.score, 0) / topic.recentAttempts.length;
        const diff = recentAvg - topic.averageScore;
        
        if (diff > 5) topic.progress = 'improving';
        else if (diff < -5) topic.progress = 'declining';
        else topic.progress = 'stable';
      } else {
        topic.progress = 'stable';
      }
    });

    const performanceData = Object.values(topicPerformance);

    // Calculate overall performance
    const overallAverage = performanceData.length > 0
      ? Math.round(performanceData.reduce((sum, t) => sum + t.averageScore, 0) / performanceData.length)
      : 0;

    res.json({
      success: true,
      overallPerformance: {
        averageScore: overallAverage,
        totalQuizzes: quizAttempts.length,
        topicsStudied: performanceData.length
      },
      topicBreakdown: performanceData
    });

  } catch (error) {
    console.error('Error fetching child performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load child performance',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/mongo/parent/children/summary
 * @desc    Get summary of all linked children (for comparison view)
 * @access  Private (Parent only)
 */
router.get('/children/summary', authMiddleware, async (req, res) => {
  try {
    // Verify user is a parent
    if (req.user.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Parent role required.'
      });
    }

    // Get parent with linkedStudents
    const parent = await User.findById(req.user.id);
    
    if (!parent || !parent.linkedStudents || parent.linkedStudents.length === 0) {
      return res.json({
        success: true,
        children: [],
        message: 'No children linked to this account'
      });
    }

    // Get all linked students
    const studentIds = parent.linkedStudents.map(ls => ls.studentId);
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'Student'
    }).select('name email class gradeLevel');

    // Get summary stats for each child
    const childrenSummary = await Promise.all(
      students.map(async (student) => {
        // Get quiz attempts
        const quizAttempts = await QuizAttempt.find({ userId: student._id });
        const averageScore = quizAttempts.length > 0
          ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length)
          : 0;

        // Get profile
        const profile = await StudentProfile.findOne({ userId: student._id });

        // Determine grade
        let grade = 'N/A';
        if (averageScore >= 90) grade = 'A';
        else if (averageScore >= 80) grade = 'B';
        else if (averageScore >= 70) grade = 'C';
        else if (averageScore >= 60) grade = 'D';
        else if (averageScore > 0) grade = 'F';

        return {
          studentId: student._id,
          name: student.name,
          email: student.email,
          class: student.class || 'N/A',
          gradeLevel: student.gradeLevel || 'Primary 1',
          overallGrade: grade,
          averageScore,
          currentLevel: profile?.currentLevel || 1,
          totalPoints: profile?.totalPoints || 0,
          quizzesCompleted: quizAttempts.length,
          attendance: '95%' // Placeholder
        };
      })
    );

    res.json({
      success: true,
      children: childrenSummary,
      totalChildren: childrenSummary.length
    });

  } catch (error) {
    console.error('Error fetching children summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load children summary',
      details: error.message
    });
  }
});

module.exports = router;
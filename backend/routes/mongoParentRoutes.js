// backend/routes/mongoParentRoutes.js - COMPLETE WITH REAL PERFORMANCE DATA
// ✅ Phase 1: Dashboard, Children, Support Tickets
// ✅ Phase 2: Testimonials, Feedback, Performance (UPDATED), Progress
// ✅ Phase 2.5: Skill Matrix
// ✅ Phase 2.7: Performance Report with REAL DATA (NEW)

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// ==================== SCHOOL SCHEMA ====================
if (!mongoose.models.School) {
  const schoolSchema = new mongoose.Schema({
    organization_name: { type: String, required: true },
    organization_type: { type: String, default: 'school' },
    plan: { type: String, default: 'starter' },
    plan_info: { type: Object, default: {} },
    contact: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
    current_teachers: { type: Number, default: 0 },
    current_students: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  mongoose.model('School', schoolSchema);
}

const School = mongoose.model('School');

// ==================== MATHSKILL SCHEMA ====================
if (!mongoose.models.MathSkill) {
  const mathSkillSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill_name: { type: String, required: true },
    current_level: { type: Number, default: 0, min: 0, max: 5 },
    xp: { type: Number, default: 0 },
    unlocked: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
  });
  mathSkillSchema.index({ student_id: 1, skill_name: 1 }, { unique: true });
  mongoose.model('MathSkill', mathSkillSchema);
}

const MathSkill = mongoose.model('MathSkill');

// ==================== MATHPROFILE SCHEMA ====================
if (!mongoose.models.MathProfile) {
  const mathProfileSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    current_profile: { type: Number, default: 1, min: 1, max: 10 },
    placement_completed: { type: Boolean, default: false },
    total_points: { type: Number, default: 0 },
    consecutive_fails: { type: Number, default: 0 },
    quizzes_today: { type: Number, default: 0 },
    last_reset_date: { type: Date, default: Date.now },
    streak: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  mongoose.model('MathProfile', mathProfileSchema);
}

const MathProfile = mongoose.model('MathProfile');

// ==================== QUIZ SCHEMA (NEW FOR PHASE 2.7) ====================
if (!mongoose.models.Quiz) {
  const quizSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz_id: { type: String, required: true },
    quiz_type: { type: String, enum: ['placement', 'regular'], default: 'regular' },
    profile_level: { type: Number, required: true },
    score: { type: Number, required: true },
    total_questions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    points_earned: { type: Number, default: 0 },
    completed_at: { type: Date, default: Date.now }
  });
  mongoose.model('Quiz', quizSchema);
}

const Quiz = mongoose.model('Quiz');

// ==================== SUPPORT TICKET SCHEMA ====================
const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notes: [{ text: String, addedBy: String, addedAt: { type: Date, default: Date.now } }]
});

const ParentSupportTicket = mongoose.models.ParentSupportTicket || mongoose.model('ParentSupportTicket', supportTicketSchema, 'parent_support_tickets');

// ==================== TESTIMONIAL SCHEMA ====================
const testimonialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userRole: { type: String, default: 'Parent' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Testimonial = mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema);

// ==================== FEEDBACK SCHEMA ====================
const feedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String, required: true },
  subject: { type: String, required: true },
  category: { type: String, enum: ['academic', 'behavior', 'attendance', 'general'], default: 'general' },
  feedbackText: { type: String, required: true },
  sentiment: { type: String, enum: ['positive', 'neutral', 'concern'], default: 'neutral' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

// ==================== JWT AUTH MIDDLEWARE ====================
const authenticateParent = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      if (decoded.role !== 'Parent') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Parent role required.'
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// ========================================
// PARENT DASHBOARD ENDPOINTS (FROM PHASE 1)
// ========================================

router.get('/dashboard', authenticateParent, async (req, res) => {
  try {
    const parent = await User.findById(req.user.userId).select('-password');
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

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

    const studentIds = parent.linkedStudents.map(ls => ls.studentId);
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'Student'
    }).select('name email class gradeLevel gender date_of_birth contact');

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
          dateOfBirth: fullStudent.date_of_birth,
          contact: fullStudent.contact
        };
      }
      
      return linkedStudent;
    });

    res.json({
      success: true,
      parent: {
        _id: parent._id,
        name: parent.name,
        email: parent.email,
        contact: parent.contact,
        gender: parent.gender,
        linkedStudents: enrichedLinkedStudents
      },
      defaultChild: enrichedLinkedStudents[0],
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

router.get('/child/:studentId/stats', authenticateParent, async (req, res) => {
  try {
    const { studentId } = req.params;

    const parent = await User.findById(req.user.userId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    const isLinked = parent.linkedStudents?.some(
      ls => ls.studentId.toString() === studentId
    );

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        error: 'This student is not linked to your account'
      });
    }

    const student = await User.findById(studentId).select('name email class gradeLevel gender date_of_birth');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        class: student.class || 'N/A',
        gradeLevel: student.gradeLevel || 'Primary 1',
        gender: student.gender,
        dateOfBirth: student.date_of_birth
      },
      stats: {
        overallGrade: 'N/A',
        averageScore: 0,
        totalQuizzesCompleted: 0,
        currentLevel: 1,
        totalPoints: 0,
        badges: [],
        streak: 0,
        recentQuizzes: [],
        upcomingAssignments: [],
        assignmentsDue: 0,
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

router.get('/child/:studentId/activities', authenticateParent, async (req, res) => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const parent = await User.findById(req.user.userId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    const isLinked = parent.linkedStudents?.some(
      ls => ls.studentId.toString() === studentId
    );

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        error: 'This student is not linked to your account'
      });
    }

    res.json({
      success: true,
      activities: [],
      message: 'Activity tracking will be available soon'
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load activities',
      details: error.message
    });
  }
});

router.get('/children/summary', authenticateParent, async (req, res) => {
  try {
    const parent = await User.findById(req.user.userId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    if (!parent.linkedStudents || parent.linkedStudents.length === 0) {
      return res.json({
        success: true,
        children: [],
        message: 'No children linked to this account'
      });
    }

    const studentIds = parent.linkedStudents.map(ls => ls.studentId);
    
    // ✅ Get students with schoolId (string field)
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'Student'
    })
    .select('name email class gradeLevel gender date_of_birth schoolId');

    // ✅ Get unique school IDs and fetch school data manually
    const schoolIds = [...new Set(students.map(s => s.schoolId).filter(id => id))];
    
    let schoolMap = {};
    if (schoolIds.length > 0) {
      // Convert string IDs to ObjectIds and fetch schools
      const schools = await School.find({
        _id: { $in: schoolIds.map(id => new mongoose.Types.ObjectId(id)) }
      }).select('organization_name');
      
      // Create a map of schoolId -> school name
      schools.forEach(school => {
        schoolMap[school._id.toString()] = school.organization_name;
      });
    }

    const childrenSummary = students.map(student => ({
      studentId: student._id,
      name: student.name,
      email: student.email,
      class: student.class || 'N/A',
      gradeLevel: student.gradeLevel || 'Primary 1',
      schoolName: student.schoolId ? (schoolMap[student.schoolId] || 'N/A') : 'N/A', // ✅ Real school from database!
      gender: student.gender,
      dateOfBirth: student.date_of_birth,
      overallGrade: 'N/A' // Can be calculated from mathProfile later if needed
    }));

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

// ========================================
// SUPPORT TICKET ENDPOINTS (PHASE 2)
// ========================================

router.post('/support-tickets', authenticateParent, async (req, res) => {
  try {
    const { category, priority, subject, description } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        error: 'Category, subject, and description are required'
      });
    }

    const parent = await User.findById(req.user.userId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }


    // ✅ FIX: Map 'normal' to 'medium' for backward compatibility
    const priorityMap = {
      'normal': 'medium',
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'urgent'
    };
    const finalPriority = priorityMap[priority] || 'medium';
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    const newTicket = new ParentSupportTicket({
      ticketId,
      userId: parent._id,
      userEmail: parent.email,
      userName: parent.name,
      userRole: 'Parent',
      category,
      priority: finalPriority,
      subject,
      description,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newTicket.save();

    res.status(201).json({
      success: true,
      ticket: newTicket,
      message: 'Support ticket created successfully'
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket',
      details: error.message
    });
  }
});

router.get('/support-tickets', authenticateParent, async (req, res) => {
  try {
    const tickets = await ParentSupportTicket.find({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      tickets,
      totalTickets: tickets.length
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load support tickets',
      details: error.message
    });
  }
});

router.get('/support-tickets/:ticketId', authenticateParent, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await ParentSupportTicket.findOne({
      ticketId,
      userId: req.user.userId
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      ticket
    });

  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load ticket details',
      details: error.message
    });
  }
});

// ========================================
// TESTIMONIAL ENDPOINTS (PHASE 2)
// ========================================

router.post('/testimonials', authenticateParent, async (req, res) => {
  try {
    const { rating, title, message } = req.body;

    if (!rating || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Rating, title, and message are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    const parent = await User.findById(req.user.userId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    const newTestimonial = new Testimonial({
      userId: parent._id,
      userName: parent.name,
      userEmail: parent.email,
      student_name: parent.name, // ✅ Added for compatibility with student schema
      student_email: parent.email, // ✅ Added for compatibility
      approved: false, // ✅ Added for compatibility
      userRole: 'Parent',
      rating,
      title,
      message,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newTestimonial.save();

    res.status(201).json({
      success: true,
      testimonial: newTestimonial,
      message: 'Thank you for your testimonial! It will be reviewed by our team.'
    });

  } catch (error) {
    console.error('Error submitting testimonial:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit testimonial',
      details: error.message
    });
  }
});

router.get('/testimonials', authenticateParent, async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      testimonials,
      totalTestimonials: testimonials.length
    });

  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load testimonials',
      details: error.message
    });
  }
});

// ========================================
// FEEDBACK ENDPOINTS (PHASE 2)
// ========================================

router.get('/feedback', authenticateParent, async (req, res) => {
  try {
    const parent = await User.findById(req.user.userId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    if (!parent.linkedStudents || parent.linkedStudents.length === 0) {
      return res.json({
        success: true,
        feedback: [],
        message: 'No children linked to this account'
      });
    }

    const studentIds = parent.linkedStudents.map(ls => ls.studentId);

    const feedback = await Feedback.find({
      studentId: { $in: studentIds }
    })
    .sort({ createdAt: -1 })
    .populate('studentId', 'name email class')
    .populate('teacherId', 'name email subject');

    res.json({
      success: true,
      feedback,
      totalFeedback: feedback.length,
      unreadCount: feedback.filter(f => !f.isRead).length
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load feedback',
      details: error.message
    });
  }
});

router.put('/feedback/:feedbackId/mark-read', authenticateParent, async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    feedback.isRead = true;
    await feedback.save();

    res.json({
      success: true,
      feedback,
      message: 'Feedback marked as read'
    });

  } catch (error) {
    console.error('Error marking feedback as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback',
      details: error.message
    });
  }
});

// ========================================
// PERFORMANCE ENDPOINTS (PHASE 2)
// ========================================


// ==================== PERFORMANCE ENDPOINT (PHASE 2.7 - REAL DATA) ====================

router.get('/child/:studentId/performance', authenticateParent, async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log('📊 Parent requesting performance for student:', studentId);

    const parent = await User.findById(req.user.userId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    const isLinked = parent.linkedStudents?.some(
      ls => ls.studentId.toString() === studentId
    );

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        error: 'This student is not linked to your account'
      });
    }

    const student = await User.findById(studentId).select('name email class gradeLevel');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // ✅ FETCH REAL DATA FROM DATABASE
    
    // 1. Get Math Profile (for current_profile, streak, total_points)
    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    
    const currentProfile = mathProfile?.current_profile || 1;
    const streak = mathProfile?.streak || 0;
    const totalPoints = mathProfile?.total_points || 0;

    console.log('📊 MathProfile data:', { currentProfile, streak, totalPoints });

    // 2. Get Quiz Results (for totalQuizzes, highestScore, recentQuizzes)
    const allQuizzes = await Quiz.find({ 
      student_id: studentId,
      quiz_type: 'regular'
    }).sort({ completed_at: -1 });

    // ✅ FIX: Filter out unsubmitted quizzes (0/15 entries)
    const quizzes = allQuizzes.filter(quiz => {
      // A quiz is submitted if it has questions with student answers
      return quiz.questions && quiz.questions.some(q => 
        q.student_answer !== null && q.student_answer !== undefined
      );
    });

    const totalQuizzes = quizzes.length;

    let highestScore = 0;
    if (quizzes.length > 0) {
      highestScore = Math.max(...quizzes.map(q => q.percentage || 0));
    }

    console.log('📊 Quiz data:', { totalQuizzes, highestScore });

    // 3. Get recent quiz attempts for display (last 10)
    const recentQuizzes = quizzes.slice(0, 10).map(quiz => ({
      date: quiz.completed_at.toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      profile: quiz.profile_level,
      score: quiz.score,
      total: quiz.total_questions,
      percentage: quiz.percentage
    }));

    console.log('✅ Sending performance data to parent');

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        class: student.class,
        gradeLevel: student.gradeLevel
      },
      performance: {
        currentProfile: currentProfile,
        totalQuizzes: totalQuizzes,
        highestScore: highestScore,
        streak: streak,
        totalPoints: totalPoints,
        recentQuizzes: recentQuizzes,
        message: totalQuizzes === 0 ? 'Performance data will be available once student completes quizzes' : undefined
      }
    });

  } catch (error) {
    console.error('❌ Error fetching child performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load child performance',
      details: error.message
    });
  }
});


// ========================================
// PROGRESS ENDPOINTS (PHASE 2)
// ========================================

router.get('/child/:studentId/progress', authenticateParent, async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log('📈 Parent requesting progress for student:', studentId);

    const parent = await User.findById(req.user.userId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    const isLinked = parent.linkedStudents?.some(
      ls => ls.studentId.toString() === studentId
    );

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        error: 'This student is not linked to your account'
      });
    }

    const student = await User.findById(studentId).select('name email class gradeLevel');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // ✅ FETCH REAL DATA FROM DATABASE
    
    // Get Math Profile data
    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    
    const currentLevel = mathProfile?.current_profile || 1;
    const totalPoints = mathProfile?.total_points || 0;
    const streak = mathProfile?.streak || 0;

    // Get recent quiz attempts (last 10 for activities)
    const allRecentQuizzes = await Quiz.find({ 
      student_id: studentId,
      quiz_type: 'regular'
    })
    .sort({ completed_at: -1 });

    // ✅ FIX: Filter out unsubmitted quizzes (0/15 entries)
    const recentQuizzes = allRecentQuizzes.filter(quiz => {
      return quiz.questions && quiz.questions.some(q => 
        q.student_answer !== null && q.student_answer !== undefined
      );
    }).slice(0, 10);

    console.log('📈 Found', recentQuizzes.length, 'recent quizzes (filtered from', allRecentQuizzes.length, 'total)');

    // Format quiz data as "activities"
    const recentActivities = recentQuizzes.map(quiz => {
      const percentage = quiz.percentage || 0;
      const scoreEmoji = percentage >= 70 ? '🎉' : percentage >= 50 ? '📝' : '📚';
      
      return {
        description: `${scoreEmoji} Completed Profile ${quiz.profile_level} Quiz - Score: ${quiz.score}/${quiz.total_questions} (${percentage}%)`,
        timestamp: quiz.completed_at
      };
    });

    // Calculate overall progress (simple percentage based on profile level)
    const overallProgress = Math.round((currentLevel / 10) * 100);


    // ✅ NEW: Fetch student's earned badges
    const db = mongoose.connection.db;
    const studentEmail = student.email;
    
    // Get student's earned badges from student_badges collection
    const earnedBadges = await db.collection('student_badges')
      .find({ student_email: studentEmail })
      .toArray();
    
    console.log('🏆 Found', earnedBadges.length, 'earned badges for', studentEmail);
    
    // Get full badge details by looking up badge_id in badges collection
    const achievements = [];
    
    for (const earnedBadge of earnedBadges) {
      try {
        const badgeDetails = await db.collection('badges')
          .findOne({ _id: earnedBadge.badge_id });
        
        if (badgeDetails) {
          achievements.push({
            icon: badgeDetails.icon || '🏆',
            name: badgeDetails.name || 'Achievement',
            description: badgeDetails.description,
            earnedAt: earnedBadge.earned_at
          });
        }
      } catch (error) {
        console.error('❌ Error fetching badge details:', error);
      }
    }
    
    console.log('✅ Formatted', achievements.length, 'achievements for parent view');
    console.log('✅ Sending progress data with', recentActivities.length, 'activities');

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        class: student.class,
        gradeLevel: student.gradeLevel
      },
      progress: {
        overallProgress: overallProgress,
        currentLevel: currentLevel,
        totalPoints: totalPoints,
        streak: streak,
        achievements: achievements,
        recentActivities: recentActivities,
        message: recentActivities.length === 0 ? 'Progress data will be available once student completes quizzes' : undefined
      }
    });

  } catch (error) {
    console.error('❌ Error fetching child progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load child progress',
      details: error.message
    });
  }
});


// ========================================
// SKILL MATRIX ENDPOINT - CORRECTED VERSION (PHASE 2.5)
// ========================================

/**
 * @route   GET /api/mongo/parent/child/:studentId/skills
 * @desc    Get child's math skill matrix - READS FROM MATHSKILL COLLECTION
 * @access  Private (Parent only)
 */
router.get('/child/:studentId/skills', authenticateParent, async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log('📊 Parent requesting skills for student:', studentId);

    // Verify parent owns this child
    const parent = await User.findById(req.user.userId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    const isLinked = parent.linkedStudents?.some(
      ls => ls.studentId.toString() === studentId
    );

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        error: 'This student is not linked to your account'
      });
    }

    // Get student info
    const student = await User.findById(studentId).select('name email class gradeLevel');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // ✅ CRITICAL FIX: Read from MathProfile collection (where student saves profile!)
    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const currentProfile = mathProfile?.current_profile || 1;

    console.log('📊 Student profile:', currentProfile);

    // ✅ CRITICAL FIX: Read from MathSkill collection (where student saves skills!)
    const mathSkillsFromDB = await MathSkill.find({ student_id: studentId }).lean();

    console.log('📊 Found skills in MathSkill collection:', mathSkillsFromDB.length);

    let skills = [];
    
    if (mathSkillsFromDB.length > 0) {
      // Convert MathSkill documents to parent-friendly format
      skills = mathSkillsFromDB.map(skill => ({
        skill_name: skill.skill_name,
        current_level: skill.current_level || 0,
        xp: skill.xp || 0,
        max_level: 5, // Fixed max level
        percentage: skill.xp || 0, // XP is the percentage (0-100)
        unlocked: skill.unlocked !== undefined ? skill.unlocked : true
      }));

      console.log('✅ Using real skills from MathSkill collection');
      console.log('✅ Skills:', JSON.stringify(skills, null, 2));
    } else {
      // No skills yet - return defaults
      console.log('⚠️ No skills found, returning defaults');
      skills = [
        { skill_name: 'Addition', current_level: 0, xp: 0, max_level: 5, percentage: 0, unlocked: true },
        { skill_name: 'Subtraction', current_level: 0, xp: 0, max_level: 5, percentage: 0, unlocked: true },
        { skill_name: 'Multiplication', current_level: 0, xp: 0, max_level: 5, percentage: 0, unlocked: false },
        { skill_name: 'Division', current_level: 0, xp: 0, max_level: 5, percentage: 0, unlocked: false }
      ];
    }

    const response = {
      success: true,
      student: {
        id: student._id,
        name: student.name,
        class: student.class,
        gradeLevel: student.gradeLevel
      },
      currentProfile: currentProfile,
      skills: skills
    };

    console.log('✅ Sending response with', skills.length, 'skills');

    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching child skills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load child skill matrix',
      details: error.message
    });
  }
});

module.exports = router;
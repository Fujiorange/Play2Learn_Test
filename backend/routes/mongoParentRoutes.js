// backend/routes/mongoParentRoutes.js - WITH SKILL MATRIX ENDPOINT
// ✅ UPDATED: Added GET /api/mongo/parent/child/:studentId/skills
// ✅ Includes everything from Phase 2 + new skills endpoint

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// ==================== SUPPORT TICKET SCHEMA ====================
const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notes: [{ 
    text: String, 
    addedBy: String, 
    addedAt: { type: Date, default: Date.now } 
  }]
});

const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);

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

// ==================== INLINE JWT AUTH MIDDLEWARE ====================
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
      total: 0,
      message: 'Activity tracking will be available once quiz system is implemented'
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

router.get('/children/summary', authenticateParent, async (req, res) => {
  try {
    const parent = await User.findById(req.user.userId);
    
    if (!parent || !parent.linkedStudents || parent.linkedStudents.length === 0) {
      return res.json({
        success: true,
        children: [],
        message: 'No children linked to this account'
      });
    }

    const studentIds = parent.linkedStudents.map(ls => ls.studentId);
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'Student'
    }).select('name email class gradeLevel gender date_of_birth');

    const childrenSummary = students.map(student => {
      const linkInfo = parent.linkedStudents.find(
        ls => ls.studentId.toString() === student._id.toString()
      );

      return {
        studentId: student._id,
        name: student.name,
        email: student.email,
        class: student.class || 'N/A',
        gradeLevel: student.gradeLevel || 'Primary 1',
        gender: student.gender,
        dateOfBirth: student.date_of_birth,
        relationship: linkInfo?.relationship || 'Parent',
        overallGrade: 'N/A',
        averageScore: 0,
        currentLevel: 1,
        totalPoints: 0,
        quizzesCompleted: 0,
        attendance: '95%'
      };
    });

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
// SUPPORT TICKET ENDPOINTS (FROM PHASE 1)
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

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const ticketId = `TKT-${timestamp}-${random}`;

    const ticket = new SupportTicket({
      ticketId,
      userId: parent._id,
      userEmail: parent.email,
      userName: parent.name,
      userRole: 'Parent',
      category,
      priority: priority || 'medium',
      subject,
      description,
      status: 'open'
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: {
        ticketId: ticket.ticketId,
        category: ticket.category,
        priority: ticket.priority,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
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
    const tickets = await SupportTicket.find({ 
      userId: req.user.userId 
    })
    .sort({ createdAt: -1 })
    .select('-__v');

    res.json({
      success: true,
      tickets: tickets.map(ticket => ({
        id: ticket.ticketId,
        ticketId: ticket.ticketId,
        category: ticket.category,
        priority: ticket.priority,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        created: ticket.createdAt,
        updated: ticket.updatedAt,
        resolved: ticket.resolvedAt,
        notesCount: ticket.notes?.length || 0
      })),
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
    const ticket = await SupportTicket.findOne({
      ticketId: req.params.ticketId,
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
      ticket: {
        ticketId: ticket.ticketId,
        category: ticket.category,
        priority: ticket.priority,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt,
        notes: ticket.notes || []
      }
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

    const testimonial = new Testimonial({
      userId: parent._id,
      userName: parent.name,
      userEmail: parent.email,
      userRole: 'Parent',
      rating,
      title,
      message,
      isPublished: false
    });

    await testimonial.save();

    res.status(201).json({
      success: true,
      message: 'Testimonial submitted successfully! It will be reviewed before being published.',
      testimonial: {
        id: testimonial._id,
        rating: testimonial.rating,
        title: testimonial.title,
        createdAt: testimonial.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating testimonial:', error);
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
    })
    .sort({ createdAt: -1 })
    .select('-__v');

    res.json({
      success: true,
      testimonials: testimonials.map(t => ({
        id: t._id,
        rating: t.rating,
        title: t.title,
        message: t.message,
        isPublished: t.isPublished,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      })),
      total: testimonials.length
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
    
    if (!parent || !parent.linkedStudents || parent.linkedStudents.length === 0) {
      return res.json({
        success: true,
        feedback: [],
        message: 'No children linked to this account'
      });
    }

    const studentIds = parent.linkedStudents.map(ls => ls.studentId);
    
    const feedbackList = await Feedback.find({
      studentId: { $in: studentIds }
    })
    .sort({ createdAt: -1 })
    .populate('studentId', 'name email class gradeLevel')
    .select('-__v');

    res.json({
      success: true,
      feedback: feedbackList.map(f => ({
        id: f._id,
        child: f.studentId ? {
          id: f.studentId._id,
          name: f.studentId.name,
          class: f.studentId.class,
          gradeLevel: f.studentId.gradeLevel
        } : null,
        from: f.teacherName,
        subject: f.subject,
        category: f.category,
        message: f.feedbackText,
        sentiment: f.sentiment,
        isRead: f.isRead,
        date: f.createdAt
      })),
      total: feedbackList.length
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

router.put('/feedback/:id/mark-read', authenticateParent, async (req, res) => {
  try {
    const parent = await User.findById(req.user.userId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    const isLinked = parent.linkedStudents?.some(
      ls => ls.studentId.toString() === feedback.studentId.toString()
    );

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        error: 'This feedback is not for your children'
      });
    }

    feedback.isRead = true;
    await feedback.save();

    res.json({
      success: true,
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

router.get('/child/:studentId/performance', authenticateParent, async (req, res) => {
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

    const student = await User.findById(studentId).select('name email class gradeLevel');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        class: student.class,
        gradeLevel: student.gradeLevel
      },
      performance: {
        overallScore: 0,
        overallGrade: 'N/A',
        subjects: [
          {
            name: 'Mathematics',
            score: 0,
            grade: 'N/A',
            progress: 'stable',
            quizzesCompleted: 0,
            averageTime: 'N/A',
            strengths: [],
            weaknesses: []
          },
          {
            name: 'English',
            score: 0,
            grade: 'N/A',
            progress: 'stable',
            quizzesCompleted: 0,
            averageTime: 'N/A',
            strengths: [],
            weaknesses: []
          }
        ],
        recentQuizzes: [],
        message: 'Performance data will be available once student completes quizzes'
      }
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

// ========================================
// PROGRESS ENDPOINTS (PHASE 2)
// ========================================

router.get('/child/:studentId/progress', authenticateParent, async (req, res) => {
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

    const student = await User.findById(studentId).select('name email class gradeLevel');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        class: student.class,
        gradeLevel: student.gradeLevel
      },
      progress: {
        overallProgress: 0,
        currentLevel: 1,
        totalPoints: 0,
        streak: 0,
        subjects: [
          {
            name: 'Mathematics',
            currentLevel: 1,
            points: 0,
            progress: 0,
            completedTopics: 0,
            totalTopics: 10
          },
          {
            name: 'English',
            currentLevel: 1,
            points: 0,
            progress: 0,
            completedTopics: 0,
            totalTopics: 10
          }
        ],
        achievements: [],
        recentActivities: [],
        goalsProgress: [],
        message: 'Progress data will be available once student completes quizzes'
      }
    });

  } catch (error) {
    console.error('Error fetching child progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load child progress',
      details: error.message
    });
  }
});

// ========================================
// SKILL MATRIX ENDPOINT (NEW - PHASE 2.5)
// ========================================

/**
 * @route   GET /api/mongo/parent/child/:studentId/skills
 * @desc    Get child's math skill matrix (Addition, Subtraction, Multiplication, Division)
 * @access  Private (Parent only)
 */
router.get('/child/:studentId/skills', authenticateParent, async (req, res) => {
  try {
    const { studentId } = req.params;

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
    const student = await User.findById(studentId).select('name email class gradeLevel currentProfile mathSkills');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Get student's math skills (from mathSkills array in user document)
    const mathSkills = student.mathSkills || [];
    
    // If no skills exist, return default skills
    const defaultSkills = [
      { skill_name: 'Addition', current_level: 0, xp: 0, max_level: 5, percentage: 0, unlocked: true },
      { skill_name: 'Subtraction', current_level: 0, xp: 0, max_level: 5, percentage: 0, unlocked: true },
      { skill_name: 'Multiplication', current_level: 0, xp: 0, max_level: 5, percentage: 0, unlocked: false },
      { skill_name: 'Division', current_level: 0, xp: 0, max_level: 5, percentage: 0, unlocked: false }
    ];

    const skills = mathSkills.length > 0 ? mathSkills : defaultSkills;
    const currentProfile = student.currentProfile || 1;

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        class: student.class,
        gradeLevel: student.gradeLevel
      },
      currentProfile: currentProfile,
      skills: skills,
      message: skills.length === 0 ? 'Skills will be tracked once student completes quizzes' : null
    });

  } catch (error) {
    console.error('Error fetching child skills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load child skill matrix',
      details: error.message
    });
  }
});

module.exports = router;
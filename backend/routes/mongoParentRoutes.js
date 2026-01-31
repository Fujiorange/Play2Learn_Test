// backend/routes/mongoParentRoutes.js - Parent Routes with Support Tickets
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "Access token required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: "Invalid token" });
  }
}

router.use(authenticateToken);

// ==================== SUPPORT TICKETS ====================
router.post("/support-tickets", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { subject, description, priority, category } = req.body;
    
    // Get user name from token or DB lookup
    let userName = req.user.name;
    if (!userName) {
      const user = await db.collection('users').findOne({ email: req.user.email });
      userName = user?.name || 'Unknown';
    }
    
    const ticket = {
      user_id: req.user.userId,
      user_email: req.user.email,
      user_name: userName,
      user_role: 'parent',
      subject,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      responses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('supporttickets').insertOne(ticket);
    console.log(`🎫 Parent ticket created: ${subject} by ${userName}`);
    res.json({ success: true, ticket: { ...ticket, _id: result.insertedId } });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ success: false, error: "Failed to create ticket" });
  }
});

router.get("/support-tickets", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tickets = await db.collection('supporttickets')
      .find({ user_email: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, tickets });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ success: false, error: "Failed to load tickets" });
  }
});

// ==================== ANNOUNCEMENTS ====================
router.get("/announcements", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const now = new Date();
    
    const announcements = await db.collection('announcements')
      .find({
        $and: [
          { $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }] },
          { $or: [{ audience: 'all' }, { audience: 'parent' }, { audience: 'parents' }, { audience: { $exists: false } }] }
        ]
      })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(10)
      .toArray();
    
    res.json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load announcements" });
  }
});

// ==================== LINKED CHILDREN ====================
router.get("/children", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get parent's linked students
    const parent = await db.collection('users').findOne({ email: req.user.email });
    const linkedStudents = parent?.linkedStudents || [];
    
    if (linkedStudents.length === 0) {
      return res.json({ success: true, children: [] });
    }
    
    // Get student IDs
    const studentIds = linkedStudents.map(ls => {
      const id = ls.studentId || ls;
      try {
        return new mongoose.Types.ObjectId(id);
      } catch {
        return id;
      }
    });
    
    // Get children's data
    const children = await db.collection('users')
      .find({ _id: { $in: studentIds } })
      .project({ password: 0, password_hash: 0 })
      .toArray();
    
    // Enrich with student data and relationship
    const enrichedChildren = await Promise.all(children.map(async (child) => {
      const studentData = await db.collection('students').findOne({ 
        $or: [{ user_id: child._id }, { email: child.email }]
      });
      const mathProfile = await db.collection('mathprofiles').findOne({ student_id: child._id });
      
      // Find relationship from linkedStudents
      const linkInfo = linkedStudents.find(ls => {
        const linkId = (ls.studentId || ls).toString();
        return linkId === child._id.toString();
      });
      
      return {
        ...child,
        points: studentData?.points || mathProfile?.total_points || 0,
        level: mathProfile?.current_profile || 1,
        total_quizzes: studentData?.total_quizzes || 0,
        relationship: linkInfo?.relationship || 'Parent'
      };
    }));
    
    res.json({ success: true, children: enrichedChildren });
  } catch (error) {
    console.error("Get children error:", error);
    res.status(500).json({ success: false, error: "Failed to load children data" });
  }
});

// ==================== CHILD PERFORMANCE ====================
router.get("/child/:childId/performance", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { childId } = req.params;
    
    // Verify parent has access to this child
    const parent = await db.collection('users').findOne({ email: req.user.email });
    const linkedStudents = parent?.linkedStudents || [];
    const hasAccess = linkedStudents.some(ls => {
      const linkId = (ls.studentId || ls).toString();
      return linkId === childId;
    });
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "You don't have access to this child's data" });
    }
    
    const childObjectId = new mongoose.Types.ObjectId(childId);
    
    // Get child info
    const child = await db.collection('users').findOne({ _id: childObjectId });
    const studentData = await db.collection('students').findOne({ user_id: childObjectId });
    const mathProfile = await db.collection('mathprofiles').findOne({ student_id: childObjectId });
    
    // Get quiz history
    const quizzes = await db.collection('quizzes')
      .find({ student_id: childObjectId, quiz_type: 'regular' })
      .sort({ completed_at: -1 })
      .limit(10)
      .toArray();
    
    res.json({
      success: true,
      child: {
        name: child?.name,
        email: child?.email,
        class: child?.class,
        gradeLevel: child?.gradeLevel
      },
      performance: {
        points: studentData?.points || mathProfile?.total_points || 0,
        level: mathProfile?.current_profile || 1,
        total_quizzes: studentData?.total_quizzes || quizzes.length,
        streak: mathProfile?.streak || 0,
        badges: studentData?.badges?.length || 0
      },
      recentQuizzes: quizzes.map(q => ({
        date: q.completed_at,
        score: q.score,
        total: q.total_questions || 15,
        percentage: q.percentage,
        points_earned: q.points_earned
      }))
    });
  } catch (error) {
    console.error("Get child performance error:", error);
    res.status(500).json({ success: false, error: "Failed to load performance data" });
  }
});

module.exports = router;

// backend/routes/mongoTeacherRoutes.js - Complete Teacher Routes
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Auth middleware (backup - server.js also has one)
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

// Helper to convert string to ObjectId safely
function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    return null;
  }
}

// ==================== DASHBOARD ====================
router.get("/dashboard", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get teacher's assigned classes
    const user = await db.collection('users').findOne({ email: req.user.email });
    const assignedClasses = user?.classes || [];
    
    // Count students in those classes
    let studentCount = 0;
    if (assignedClasses.length > 0) {
      studentCount = await db.collection('users').countDocuments({
        role: { $regex: /student/i },
        class: { $in: assignedClasses }
      });
    }
    
    res.json({
      success: true,
      dashboard: {
        totalStudents: studentCount,
        totalClasses: assignedClasses.length,
        classes: assignedClasses
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load dashboard" });
  }
});

// ==================== CLASSES ====================
router.get("/classes", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get teacher's assigned classes
    const user = await db.collection('users').findOne({ email: req.user.email });
    const assignedClassNames = user?.classes || [];
    
    if (assignedClassNames.length === 0) {
      return res.json({ success: true, classes: [] });
    }
    
    // Get class details
    const classes = await db.collection('classes')
      .find({ name: { $in: assignedClassNames } })
      .toArray();
    
    // Enrich with student count
    const enrichedClasses = await Promise.all(classes.map(async (cls) => {
      const studentCount = await db.collection('users').countDocuments({
        role: { $regex: /student/i },
        class: cls.name
      });
      return { ...cls, studentCount };
    }));
    
    res.json({ success: true, classes: enrichedClasses });
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ success: false, error: "Failed to load classes" });
  }
});

router.get("/classes/:className/students", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { className } = req.params;
    
    // Verify teacher has access to this class
    const user = await db.collection('users').findOne({ email: req.user.email });
    const assignedClasses = user?.classes || [];
    
    if (!assignedClasses.includes(className)) {
      return res.status(403).json({ success: false, error: "You don't have access to this class" });
    }
    
    // Get students in the class
    const students = await db.collection('users')
      .find({ role: { $regex: /student/i }, class: className })
      .project({ password: 0, password_hash: 0 })
      .toArray();
    
    // Enrich with performance data
    const enrichedStudents = await Promise.all(students.map(async (student) => {
      const studentData = await db.collection('students').findOne({ 
        $or: [{ user_id: student._id }, { email: student.email }]
      });
      const mathProfile = await db.collection('mathprofiles').findOne({ student_id: student._id });
      
      return {
        ...student,
        points: studentData?.points || mathProfile?.total_points || 0,
        level: mathProfile?.current_profile || 1,
        total_quizzes: studentData?.total_quizzes || 0,
        streak: mathProfile?.streak || 0
      };
    }));
    
    res.json({ success: true, students: enrichedStudents });
  } catch (error) {
    console.error("Get class students error:", error);
    res.status(500).json({ success: false, error: "Failed to load students" });
  }
});

router.get("/classes/:className/leaderboard", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { className } = req.params;
    
    // Get students in the class with their points
    const students = await db.collection('users')
      .find({ role: { $regex: /student/i }, class: className })
      .project({ password: 0, password_hash: 0 })
      .toArray();
    
    // Get points for each student
    const leaderboard = await Promise.all(students.map(async (student) => {
      const mathProfile = await db.collection('mathprofiles').findOne({ student_id: student._id });
      const studentData = await db.collection('students').findOne({ 
        $or: [{ user_id: student._id }, { email: student.email }]
      });
      
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        points: studentData?.points || mathProfile?.total_points || 0,
        level: mathProfile?.current_profile || 1,
        total_quizzes: studentData?.total_quizzes || 0
      };
    }));
    
    // Sort by points descending
    leaderboard.sort((a, b) => b.points - a.points);
    
    // Add rank
    const rankedLeaderboard = leaderboard.map((student, index) => ({
      ...student,
      rank: index + 1
    }));
    
    res.json({ success: true, leaderboard: rankedLeaderboard });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load leaderboard" });
  }
});

// ==================== STUDENTS ====================
router.get("/students", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get teacher's assigned classes
    const user = await db.collection('users').findOne({ email: req.user.email });
    const assignedClasses = user?.classes || [];
    
    if (assignedClasses.length === 0) {
      return res.json({ success: true, students: [] });
    }
    
    // Get students in those classes
    const students = await db.collection('users')
      .find({
        role: { $regex: /student/i },
        class: { $in: assignedClasses }
      })
      .project({ password: 0, password_hash: 0 })
      .toArray();
    
    // Enrich with student data
    const enrichedStudents = await Promise.all(students.map(async (student) => {
      const studentData = await db.collection('students').findOne({ 
        $or: [{ user_id: student._id }, { email: student.email }]
      });
      const mathProfile = await db.collection('mathprofiles').findOne({ student_id: student._id });
      
      return {
        ...student,
        points: studentData?.points || mathProfile?.total_points || 0,
        level: mathProfile?.current_profile || 1,
        total_quizzes: studentData?.total_quizzes || 0
      };
    }));
    
    res.json({ success: true, students: enrichedStudents });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ success: false, error: "Failed to load students" });
  }
});

router.get("/students/:studentId", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { studentId } = req.params;
    const studentOid = toObjectId(studentId);
    
    if (!studentOid) {
      return res.status(400).json({ success: false, error: "Invalid student ID" });
    }
    
    // Get student
    const student = await db.collection('users').findOne(
      { _id: studentOid },
      { projection: { password: 0, password_hash: 0 } }
    );
    
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }
    
    // Verify teacher has access
    const teacher = await db.collection('users').findOne({ email: req.user.email });
    const assignedClasses = teacher?.classes || [];
    
    if (!assignedClasses.includes(student.class)) {
      return res.status(403).json({ success: false, error: "You don't have access to this student" });
    }
    
    // Get performance data
    const studentData = await db.collection('students').findOne({ 
      $or: [{ user_id: studentOid }, { email: student.email }]
    });
    const mathProfile = await db.collection('mathprofiles').findOne({ student_id: studentOid });
    
    // Get recent quizzes
    const recentQuizzes = await db.collection('quizzes')
      .find({ student_id: studentOid, quiz_type: 'regular' })
      .sort({ completed_at: -1 })
      .limit(10)
      .toArray();
    
    res.json({
      success: true,
      student: {
        ...student,
        points: studentData?.points || mathProfile?.total_points || 0,
        level: mathProfile?.current_profile || 1,
        total_quizzes: studentData?.total_quizzes || 0,
        streak: mathProfile?.streak || 0,
        badges: studentData?.badges || []
      },
      recentQuizzes: recentQuizzes.map(q => ({
        date: q.completed_at,
        score: q.score,
        total: q.total_questions || 15,
        percentage: q.percentage,
        points_earned: q.points_earned
      }))
    });
  } catch (error) {
    console.error("Get student details error:", error);
    res.status(500).json({ success: false, error: "Failed to load student details" });
  }
});

// ==================== POINTS MANAGEMENT ====================
router.post("/students/:studentId/adjust-points", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { studentId } = req.params;
    const { amount, reason } = req.body;
    const studentOid = toObjectId(studentId);
    
    if (!studentOid) {
      return res.status(400).json({ success: false, error: "Invalid student ID" });
    }
    
    if (typeof amount !== 'number') {
      return res.status(400).json({ success: false, error: "Amount must be a number" });
    }
    
    // Get student
    const student = await db.collection('users').findOne({ _id: studentOid });
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }
    
    // Verify teacher has access
    const teacher = await db.collection('users').findOne({ email: req.user.email });
    const assignedClasses = teacher?.classes || [];
    
    if (!assignedClasses.includes(student.class)) {
      return res.status(403).json({ success: false, error: "You don't have access to this student" });
    }
    
    // Update mathprofile
    const mathProfile = await db.collection('mathprofiles').findOneAndUpdate(
      { student_id: studentOid },
      { $inc: { total_points: amount } },
      { returnDocument: 'after' }
    );
    
    const newPoints = mathProfile?.total_points || amount;
    
    // Update students collection
    await db.collection('students').updateOne(
      { $or: [{ user_id: studentOid }, { email: student.email }] },
      { $set: { points: newPoints } }
    );
    
    // Log the transaction
    await db.collection('point_transactions').insertOne({
      student_id: studentOid,
      teacher_id: toObjectId(req.user.userId),
      teacher_email: req.user.email,
      amount,
      reason: reason || 'Manual adjustment by teacher',
      type: amount >= 0 ? 'award' : 'deduction',
      newBalance: newPoints,
      createdAt: new Date()
    });
    
    console.log(`📊 Points adjusted: ${student.email} ${amount >= 0 ? '+' : ''}${amount} by ${req.user.email}`);
    
    res.json({ 
      success: true, 
      message: `${Math.abs(amount)} points ${amount >= 0 ? 'awarded to' : 'deducted from'} ${student.name}`,
      newPoints 
    });
  } catch (error) {
    console.error("Adjust points error:", error);
    res.status(500).json({ success: false, error: "Failed to adjust points" });
  }
});

router.get("/students/:studentId/point-history", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { studentId } = req.params;
    const studentOid = toObjectId(studentId);
    
    if (!studentOid) {
      return res.status(400).json({ success: false, error: "Invalid student ID" });
    }
    
    const history = await db.collection('point_transactions')
      .find({ student_id: studentOid })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    res.json({ success: true, history });
  } catch (error) {
    console.error("Get point history error:", error);
    res.status(500).json({ success: false, error: "Failed to load point history" });
  }
});

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
      user_role: 'teacher',
      subject,
      description,
      priority: priority || 'normal',
      category: category || 'general',
      status: 'open',
      responses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('supporttickets').insertOne(ticket);
    console.log(`🎫 Teacher ticket created: ${subject} by ${userName}`);
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
    
    // Get teacher's schoolId
    const teacher = await db.collection('users').findOne({ _id: toObjectId(req.user.userId) });
    const schoolId = teacher?.schoolId || teacher?.school_id;
    
    const filter = {
      $and: [
        { $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }] },
        { $or: [{ audience: 'all' }, { audience: 'teacher' }, { audience: 'teachers' }, { audience: { $exists: false } }] }
      ]
    };
    if (schoolId) filter.schoolId = schoolId;
    
    const announcements = await db.collection('announcements')
      .find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(10)
      .toArray();
    
    res.json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load announcements" });
  }
});

module.exports = router;

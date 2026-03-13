// AEGIS — Student Controller
const Student = require('../models/Student');
const Violation = require('../models/Violation');
const { getStudentAnalytics, getSystemStats } = require('../services/trustScoreEngine');

/**
 * GET /api/students
 */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .sort({ trustScore: 1 }) // Lowest trust first
      .select('-__v');

    res.json({ students, total: students.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/student/:id
 */
exports.getStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findOne({ studentId: id });

    if (!student) {
      return res.status(404).json({ error: `Student ${id} not found` });
    }

    const analytics = await getStudentAnalytics(id);

    res.json({ student, analytics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/stats
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await getSystemStats();

    // Recent violations
    const recentViolations = await Violation.find()
      .sort({ timestamp: -1 })
      .limit(10);

    // Violation type distribution
    const violationPipeline = await Violation.aggregate([
      { $group: { _id: '$violation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Hourly heatmap (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const heatmapData = await Violation.aggregate([
      { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      stats,
      recentViolations,
      violationDistribution: violationPipeline,
      heatmap: heatmapData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/students
 * Create a student
 */
exports.createStudent = async (req, res) => {
  try {
    const { studentId, name, email, department } = req.body;

    if (!studentId || !name || !email) {
      return res.status(400).json({ error: 'studentId, name, and email are required' });
    }

    const student = await Student.create({ studentId, name, email, department });
    res.status(201).json({ success: true, student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Student ID or email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/student/:id/reset
 * Reset trust score
 */
exports.resetTrustScore = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findOneAndUpdate(
      { studentId: id },
      { trustScore: 100, riskLevel: 'TRUSTED', totalViolations: 0 },
      { new: true }
    );

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Clear violations
    await Violation.deleteMany({ studentId: id });

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

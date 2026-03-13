// AEGIS — Violation Controller
const Violation = require('../models/Violation');
const Student = require('../models/Student');
const { processViolation } = require('../services/trustScoreEngine');

/**
 * POST /api/violations
 * Receive a violation event from the Sentinel extension
 */
exports.createViolation = async (req, res) => {
  try {
    const { studentId, examId, violation, duration, timestamp, ...meta } = req.body;

    if (!studentId || !violation) {
      return res.status(400).json({ error: 'studentId and violation are required' });
    }

    // Verify student exists; auto-create if seeded studentId
    let student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ error: `Student ${studentId} not found` });
    }

    // Save violation
    const violationDoc = await Violation.create({
      studentId,
      examId: examId || 'UNKNOWN',
      violation,
      duration: duration || null,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      meta
    });

    // Update trust score
    const scoreResult = await processViolation(studentId, violation, meta);

    // Emit real-time update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('violation:new', {
        studentId,
        examId,
        violation,
        penalty: scoreResult.penalty,
        trustScore: scoreResult.trustScore,
        riskLevel: scoreResult.riskLevel,
        timestamp: violationDoc.timestamp,
        id: violationDoc._id
      });

      // Emit student update
      io.emit('student:update', {
        studentId,
        trustScore: scoreResult.trustScore,
        riskLevel: scoreResult.riskLevel,
        totalViolations: scoreResult.totalViolations
      });

      // Alert for high-risk transitions
      if (scoreResult.riskLevel === 'HIGH_RISK') {
        io.emit('alert:high_risk', {
          studentId,
          studentName: student.name,
          trustScore: scoreResult.trustScore,
          violation,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.status(201).json({
      success: true,
      violationId: violationDoc._id,
      penalty: scoreResult.penalty,
      trustScore: scoreResult.trustScore,
      riskLevel: scoreResult.riskLevel
    });

  } catch (err) {
    console.error('[AEGIS] Violation error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/violations/:studentId
 * Get all violations for a specific student
 */
exports.getViolationsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 100, skip = 0, examId } = req.query;

    const query = { studentId };
    if (examId) query.examId = examId;

    const violations = await Violation.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Violation.countDocuments(query);

    res.json({ violations, total, page: Math.floor(skip / limit) + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/violations
 * Get all violations (paginated)
 */
exports.getAllViolations = async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const violations = await Violation.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Violation.countDocuments();

    res.json({ violations, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

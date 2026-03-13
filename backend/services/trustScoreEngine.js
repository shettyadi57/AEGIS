// AEGIS — Trust Score Engine
// Core scoring and risk assessment logic

const Student = require('../models/Student');
const Violation = require('../models/Violation');

const PENALTIES = Violation.statics?.PENALTIES || {
  TAB_SWITCH: 5,
  TAB_HIDDEN: 3,
  COPY_ATTEMPT: 8,
  PASTE_ATTEMPT: 8,
  CUT_ATTEMPT: 5,
  SELECT_ALL: 3,
  DEVTOOLS_OPEN: 15,
  RIGHT_CLICK: 2,
  FULLSCREEN_EXIT: 5,
  KEYBOARD_SHORTCUT: 5,
  IDLE_DETECTED: 3,
  PRINT_SCREEN: 10,
  PRINT_ATTEMPT: 8,
  VIEW_SOURCE: 10,
  WINDOW_BLUR: 3,
  WINDOW_RESIZE: 3,
  NAVIGATION_CHANGE: 10,
  PAGE_UNLOAD: 15,
  MULTIPLE_FACES: 20,
  NO_FACE: 10,
  CAMERA_DISABLED: 15,
  CAMERA_OBSTRUCTED: 10,
  VOICE_DETECTED: 5,
  BACKGROUND_CONVERSATION: 12,
  MICROPHONE_DISABLED: 8,
  MICROPHONE_MUTED: 5,
  SAVE_ATTEMPT: 5
};

/**
 * Process a violation and update student trust score
 */
async function processViolation(studentId, violationType, meta = {}) {
  const penalty = PENALTIES[violationType] || 5;

  // Update student trust score atomically
  const student = await Student.findOneAndUpdate(
    { studentId },
    {
      $inc: {
        trustScore: -penalty,
        totalViolations: 1
      }
    },
    { new: true }
  );

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  // Clamp trust score to 0-100
  if (student.trustScore < 0) {
    student.trustScore = 0;
    await student.save();
  }

  // Recompute risk level
  student.riskLevel = computeRiskLevel(student.trustScore);
  await student.save();

  return {
    trustScore: student.trustScore,
    riskLevel: student.riskLevel,
    penalty,
    totalViolations: student.totalViolations
  };
}

/**
 * Compute risk level from trust score
 */
function computeRiskLevel(score) {
  if (score >= 90) return 'TRUSTED';
  if (score >= 70) return 'SUSPICIOUS';
  return 'HIGH_RISK';
}

/**
 * Calculate analytics for a student
 */
async function getStudentAnalytics(studentId) {
  const violations = await Violation.find({ studentId }).sort({ timestamp: 1 });

  const violationsByType = {};
  let totalPenalty = 0;

  violations.forEach(v => {
    violationsByType[v.violation] = (violationsByType[v.violation] || 0) + 1;
    totalPenalty += v.penalty || 0;
  });

  // Activity timeline (group by 5-minute intervals)
  const timeline = buildTimeline(violations);

  // Severity breakdown
  const severityBreakdown = {
    critical: violations.filter(v => (v.penalty || 0) >= 15).length,
    high: violations.filter(v => (v.penalty || 0) >= 8 && (v.penalty || 0) < 15).length,
    medium: violations.filter(v => (v.penalty || 0) >= 5 && (v.penalty || 0) < 8).length,
    low: violations.filter(v => (v.penalty || 0) < 5).length
  };

  return {
    totalViolations: violations.length,
    totalPenalty,
    violationsByType,
    timeline,
    severityBreakdown,
    violations
  };
}

/**
 * Build violation timeline grouped by minute
 */
function buildTimeline(violations) {
  if (violations.length === 0) return [];

  const grouped = {};
  violations.forEach(v => {
    const minute = new Date(v.timestamp);
    minute.setSeconds(0, 0);
    const key = minute.toISOString();

    if (!grouped[key]) grouped[key] = { time: key, count: 0, types: [] };
    grouped[key].count++;
    grouped[key].types.push(v.violation);
  });

  return Object.values(grouped).sort((a, b) => new Date(a.time) - new Date(b.time));
}

/**
 * Get system-wide stats
 */
async function getSystemStats() {
  const [totalStudents, activeStudents, highRiskCount, totalViolations] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ riskLevel: 'TRUSTED' }),
    Student.countDocuments({ riskLevel: 'HIGH_RISK' }),
    Violation.countDocuments()
  ]);

  return {
    totalStudents,
    activeStudents,
    highRiskCount,
    totalViolations,
    suspiciousCount: await Student.countDocuments({ riskLevel: 'SUSPICIOUS' })
  };
}

module.exports = {
  processViolation,
  computeRiskLevel,
  getStudentAnalytics,
  getSystemStats,
  PENALTIES
};

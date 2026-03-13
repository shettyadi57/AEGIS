// AEGIS — Seed Script
// Populates the database with demo data for testing

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Violation = require('../models/Violation');
const ExamSession = require('../models/ExamSession');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis';

const VIOLATION_TYPES = [
  'TAB_SWITCH', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'DEVTOOLS_OPEN',
  'RIGHT_CLICK', 'FULLSCREEN_EXIT', 'KEYBOARD_SHORTCUT', 'IDLE_DETECTED',
  'PRINT_SCREEN', 'WINDOW_BLUR', 'MULTIPLE_FACES', 'NO_FACE',
  'VOICE_DETECTED', 'BACKGROUND_CONVERSATION'
];

const PENALTIES = {
  TAB_SWITCH: 5, COPY_ATTEMPT: 8, PASTE_ATTEMPT: 8, DEVTOOLS_OPEN: 15,
  RIGHT_CLICK: 2, FULLSCREEN_EXIT: 5, KEYBOARD_SHORTCUT: 5, IDLE_DETECTED: 3,
  PRINT_SCREEN: 10, WINDOW_BLUR: 3, MULTIPLE_FACES: 20, NO_FACE: 10,
  VOICE_DETECTED: 5, BACKGROUND_CONVERSATION: 12
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateViolationsForStudent(studentId, examId, count, baseTime) {
  const violations = [];
  let trustScore = 100;

  for (let i = 0; i < count; i++) {
    const type = randomItem(VIOLATION_TYPES);
    const penalty = PENALTIES[type] || 5;
    trustScore = Math.max(0, trustScore - penalty);

    const timestamp = new Date(baseTime.getTime() + i * randomBetween(30000, 180000));

    violations.push({
      studentId,
      examId,
      violation: type,
      penalty,
      duration: type === 'TAB_SWITCH' ? randomBetween(2, 30) : null,
      timestamp,
      meta: { url: 'https://exam.aegis.local' }
    });
  }

  return { violations, finalScore: trustScore };
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Admin.deleteMany({}),
      Student.deleteMany({}),
      Violation.deleteMany({}),
      ExamSession.deleteMany({})
    ]);
    console.log('[Seed] Cleared existing data');

    // ─────────────────────────────────────────────
    // CREATE ADMINS
    // ─────────────────────────────────────────────
    const admins = await Admin.create([
      {
        name: 'Dr. Priya Sharma',
        email: 'admin@aegis.local',
        password: 'admin123',
        role: 'SUPER_ADMIN'
      },
      {
        name: 'Prof. Arjun Menon',
        email: 'proctor@aegis.local',
        password: 'proctor123',
        role: 'PROCTOR'
      },
      {
        name: 'Ms. Kavitha Reddy',
        email: 'auditor@aegis.local',
        password: 'auditor123',
        role: 'AUDITOR'
      }
    ]);
    console.log(`[Seed] Created ${admins.length} admins`);

    // ─────────────────────────────────────────────
    // CREATE EXAM SESSION
    // ─────────────────────────────────────────────
    const examStart = new Date();
    examStart.setHours(examStart.getHours() - 2);

    const exam = await ExamSession.create({
      examId: 'EXAM-CS501',
      title: 'Advanced Algorithms Mid-Term',
      subject: 'Computer Science',
      duration: 120,
      startTime: examStart,
      status: 'ACTIVE'
    });

    // ─────────────────────────────────────────────
    // CREATE STUDENTS WITH VARIED TRUST SCORES
    // ─────────────────────────────────────────────
    const studentData = [
      { studentId: 'S101', name: 'Aditya Kumar', email: 'aditya@student.aegis.local', department: 'Computer Science', violationCount: 1 },
      { studentId: 'S102', name: 'Priya Nair', email: 'priya@student.aegis.local', department: 'Computer Science', violationCount: 3 },
      { studentId: 'S103', name: 'Rohit Verma', email: 'rohit@student.aegis.local', department: 'Electronics', violationCount: 2 },
      { studentId: 'S104', name: 'Sneha Pillai', email: 'sneha@student.aegis.local', department: 'Mechanical', violationCount: 8 },
      { studentId: 'S105', name: 'Kiran Rao', email: 'kiran@student.aegis.local', department: 'Computer Science', violationCount: 12 },
      { studentId: 'S106', name: 'Meera Joshi', email: 'meera@student.aegis.local', department: 'Civil', violationCount: 0 },
      { studentId: 'S107', name: 'Arjun Singh', email: 'arjun@student.aegis.local', department: 'Computer Science', violationCount: 5 },
      { studentId: 'S108', name: 'Divya Krishnan', email: 'divya@student.aegis.local', department: 'Electronics', violationCount: 15 },
      { studentId: 'S109', name: 'Vijay Patel', email: 'vijay@student.aegis.local', department: 'Computer Science', violationCount: 7 },
      { studentId: 'S110', name: 'Ananya Sharma', email: 'ananya@student.aegis.local', department: 'Mechanical', violationCount: 4 }
    ];

    const allViolations = [];
    const studentsToCreate = [];

    for (const s of studentData) {
      const baseTime = new Date(examStart.getTime() + randomBetween(0, 600000));
      const { violations, finalScore } = generateViolationsForStudent(
        s.studentId, exam.examId, s.violationCount, baseTime
      );

      allViolations.push(...violations);

      const trustScore = Math.max(0, Math.min(100, finalScore));
      let riskLevel = 'TRUSTED';
      if (trustScore < 70) riskLevel = 'HIGH_RISK';
      else if (trustScore < 90) riskLevel = 'SUSPICIOUS';

      studentsToCreate.push({
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        department: s.department,
        trustScore,
        riskLevel,
        totalViolations: s.violationCount,
        currentExamId: exam._id
      });
    }

    await Student.insertMany(studentsToCreate);
    console.log(`[Seed] Created ${studentsToCreate.length} students`);

    if (allViolations.length > 0) {
      await Violation.insertMany(allViolations);
      console.log(`[Seed] Created ${allViolations.length} violation records`);
    }

    // ─────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────
    console.log(`
╔═══════════════════════════════════════════════╗
║            AEGIS Seed Complete                ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  Admin Accounts:                              ║
║  ─────────────────────────────────────────   ║
║  Email: admin@aegis.local                     ║
║  Pass:  admin123                              ║
║                                               ║
║  Email: proctor@aegis.local                   ║
║  Pass:  proctor123                            ║
║                                               ║
║  Demo Students: S101 – S110                   ║
║  Exam: EXAM-CS501                             ║
║                                               ║
╚═══════════════════════════════════════════════╝
    `);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error:', err);
    process.exit(1);
  }
}

seed();

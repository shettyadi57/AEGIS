// AEGIS — Violations Routes
const express = require('express');
const router = express.Router();
const {
  createViolation,
  getViolationsByStudent,
  getAllViolations
} = require('../controllers/violationController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Extension sends violations without JWT (uses X-AEGIS-Extension header)
router.post('/', optionalAuth, createViolation);

// Dashboard reads
router.get('/', protect, getAllViolations);
router.get('/:studentId', protect, getViolationsByStudent);

module.exports = router;

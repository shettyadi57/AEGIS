// AEGIS — Student Routes
const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudent,
  getStats,
  createStudent,
  resetTrustScore
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/students', protect, getAllStudents);
router.get('/student/:id', protect, getStudent);
router.post('/students', protect, createStudent);
router.put('/student/:id/reset', protect, resetTrustScore);
router.get('/stats', protect, getStats);

module.exports = router;

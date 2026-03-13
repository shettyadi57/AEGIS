// AEGIS — ExamSession Model
const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
  examId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: 'General'
  },
  duration: {
    type: Number, // minutes
    default: 60
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  students: [{
    type: String,
    ref: 'Student'
  }],
  proctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  totalViolations: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExamSession', examSessionSchema);

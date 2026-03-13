// AEGIS — Student Model
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    default: 'General'
  },
  currentExamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
    default: null
  },
  trustScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['TRUSTED', 'SUSPICIOUS', 'HIGH_RISK'],
    default: 'TRUSTED'
  },
  totalViolations: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compute risk level from trust score
studentSchema.methods.computeRiskLevel = function () {
  if (this.trustScore >= 90) return 'TRUSTED';
  if (this.trustScore >= 70) return 'SUSPICIOUS';
  return 'HIGH_RISK';
};

studentSchema.pre('save', function (next) {
  this.riskLevel = this.computeRiskLevel();
  next();
});

module.exports = mongoose.model('Student', studentSchema);

// AEGIS — Violation Model
const mongoose = require('mongoose');

const VIOLATION_PENALTIES = {
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

const violationSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    ref: 'Student',
    index: true
  },
  examId: {
    type: String,
    default: null
  },
  violation: {
    type: String,
    required: true,
    enum: Object.keys(VIOLATION_PENALTIES)
  },
  penalty: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: null
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Auto-set penalty on save
violationSchema.pre('save', function (next) {
  if (!this.penalty) {
    this.penalty = VIOLATION_PENALTIES[this.violation] || 5;
  }
  next();
});

violationSchema.statics.PENALTIES = VIOLATION_PENALTIES;

module.exports = mongoose.model('Violation', violationSchema);

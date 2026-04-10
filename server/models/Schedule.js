const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  day: {
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    required: true
  },
  timeSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  subject: {
    type: String,
    default: ''
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  year: {
    type: String,
    default: ''
  }
}, { timestamps: true });

scheduleSchema.index({ classroom: 1, day: 1, timeSlot: 1 }, { unique: true });

scheduleSchema.index(
  { faculty: 1, day: 1, timeSlot: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Schedule', scheduleSchema);

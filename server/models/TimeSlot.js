const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  }
}, { timestamps: true });

timeSlotSchema.index({ startTime: 1, endTime: 1 }, { unique: true });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);

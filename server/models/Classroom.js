const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Classroom name is required'],
    unique: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Classroom', classroomSchema);

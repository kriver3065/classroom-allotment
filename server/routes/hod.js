const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
// ADDED: reusable faculty conflict checker
const checkFacultyConflict = require('../middleware/checkFacultyConflict');

const router = express.Router();

router.use(protect);
router.use(authorize('HOD'));

// GET /api/hod/schedules — all schedules for the HOD's department
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find({ department: req.user.department })
      .populate('department')
      .populate('classroom')
      .populate('timeSlot')
      .populate('faculty', 'name email');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/hod/update-slot/:id — update subject, faculty, year (own department only)
router.put('/update-slot/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    if (!schedule.department || schedule.department.toString() !== req.user.department.toString()) {
      return res.status(403).json({ message: 'You can only edit your own department schedules' });
    }

    const { subject, faculty, year } = req.body;

    // ADDED: faculty conflict check before updating
    const conflict = await checkFacultyConflict({
      faculty,
      day: schedule.day,
      timeSlot: schedule.timeSlot,
      excludeId: schedule._id
    });
    if (conflict) {
      return res.status(400).json({
        message: 'This faculty is already assigned to another classroom at this time'
      });
    }

    schedule.subject = subject !== undefined ? subject : schedule.subject;
    schedule.faculty = faculty !== undefined ? faculty : schedule.faculty;
    schedule.year = year !== undefined ? year : schedule.year;
    await schedule.save();

    const populated = await Schedule.findById(schedule._id)
      .populate('department')
      .populate('classroom')
      .populate('timeSlot')
      .populate('faculty', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/hod/faculty — list faculty in HOD's department
router.get('/faculty', async (req, res) => {
  try {
    const faculty = await User.find({
      department: req.user.department,
      role: 'FACULTY',
      isApproved: true
    }).select('name email');
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

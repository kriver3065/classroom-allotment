const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Schedule = require('../models/Schedule');

const router = express.Router();

router.use(protect);
router.use(authorize('FACULTY'));

// GET /api/faculty/timetable — all schedules (read only)
router.get('/timetable', async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) {
      filter.department = req.query.department;
    }
    const schedules = await Schedule.find(filter)
      .populate('department')
      .populate('classroom')
      .populate('timeSlot')
      .populate('faculty', 'name email');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

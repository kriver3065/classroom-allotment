const express = require('express');
const { protect } = require('../middleware/auth');
const Schedule = require('../models/Schedule');
const Department = require('../models/Department');
const Classroom = require('../models/Classroom');
const TimeSlot = require('../models/TimeSlot');

const router = express.Router();

// GET /api/schedules/departments — list all departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find().populate('hod', 'name email');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/schedules/classrooms — list all classrooms
router.get('/classrooms', async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ name: 1 });
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/schedules/timeslots — list all timeslots
router.get('/timeslots', async (req, res) => {
  try {
    const timeslots = await TimeSlot.find().sort({ startTime: 1 });
    res.json(timeslots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.use(protect);// GET /api/schedules — filter by classroom or department
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.classroom) {
      filter.classroom = req.query.classroom;
    }
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

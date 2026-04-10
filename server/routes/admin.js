const express = require('express');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Department = require('../models/Department');
const Classroom = require('../models/Classroom');
const TimeSlot = require('../models/TimeSlot');
const Schedule = require('../models/Schedule');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

// ─── Pending Users ───
router.get('/pending-users', async (req, res) => {
  try {
    const users = await User.find({ isApproved: false }).populate('department').select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/approve-user/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User approved', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/reject-user/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User rejected and removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Departments CRUD ───
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find().populate('hod', 'name email');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/departments', async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/departments/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    await Schedule.updateMany({ department: req.params.id }, { department: null, subject: '', faculty: null, year: '' });
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Classrooms CRUD ───
router.get('/classrooms', async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ name: 1 });
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/classrooms', async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    res.status(201).json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/classrooms/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/classrooms/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    await Schedule.deleteMany({ classroom: req.params.id });
    res.json({ message: 'Classroom deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── TimeSlots CRUD ───
router.get('/timeslots', async (req, res) => {
  try {
    const timeslots = await TimeSlot.find().sort({ startTime: 1 });
    res.json(timeslots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/timeslots', async (req, res) => {
  try {
    const timeslot = await TimeSlot.create(req.body);
    res.status(201).json(timeslot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/timeslots/:id', async (req, res) => {
  try {
    const timeslot = await TimeSlot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!timeslot) return res.status(404).json({ message: 'TimeSlot not found' });
    res.json(timeslot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/timeslots/:id', async (req, res) => {
  try {
    const timeslot = await TimeSlot.findByIdAndDelete(req.params.id);
    if (!timeslot) return res.status(404).json({ message: 'TimeSlot not found' });
    await Schedule.deleteMany({ timeSlot: req.params.id });
    res.json({ message: 'TimeSlot deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Assign Slot (classroom-centric: admin assigns department to a slot) ───
router.post('/assign-slot', async (req, res) => {
  try {
    const { classroom, day, timeSlot, department, subject, faculty, year } = req.body;

    // Upsert: create if not exists, otherwise update department assignment
    let schedule = await Schedule.findOne({ classroom, day, timeSlot });

    if (schedule) {
      // Update existing slot
      schedule.department = department || null;
      schedule.subject = subject !== undefined ? subject : schedule.subject;
      schedule.faculty = faculty !== undefined ? faculty : schedule.faculty;
      schedule.year = year !== undefined ? year : schedule.year;
      await schedule.save();
    } else {
      // Create new slot
      schedule = await Schedule.create({
        classroom,
        day,
        timeSlot,
        department: department || null,
        subject: subject || '',
        faculty: faculty || null,
        year: year || ''
      });
    }

    const populated = await Schedule.findById(schedule._id)
      .populate('department')
      .populate('classroom')
      .populate('timeSlot')
      .populate('faculty', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This slot is already assigned' });
    }
    res.status(500).json({ message: error.message });
  }
});

// ─── Edit any schedule ───
router.put('/schedules/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('department')
      .populate('classroom')
      .populate('timeSlot')
      .populate('faculty', 'name email');
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Scheduling conflict detected' });
    }
    res.status(500).json({ message: error.message });
  }
});

router.delete('/schedules/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Get all users (for faculty assignment) ───
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ isApproved: true }).populate('department').select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Delete Slot (admin directly maps classroom, day, timeslot) ───
router.delete('/delete-slot', async (req, res) => {
  try {
    const { classroomId, day, timeSlotId } = req.body;
    const result = await Schedule.findOneAndDelete({ classroom: classroomId, day, timeSlot: timeSlotId });
    if (!result) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Delete User (HOD/FACULTY only) ───
router.delete('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'ADMIN') return res.status(403).json({ message: 'Cannot delete an Admin' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Change User Password ───
router.put('/user/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'ADMIN') return res.status(403).json({ message: 'Cannot change password of another Admin' });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

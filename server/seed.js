const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Department = require('./models/Department');
const Classroom = require('./models/Classroom');
const TimeSlot = require('./models/TimeSlot');
const Schedule = require('./models/Schedule');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Classroom.deleteMany({});
    await TimeSlot.deleteMany({});
    await Schedule.deleteMany({});
    console.log('Cleared existing data.');

    // Create departments
    const csDept = await Department.create({ name: 'Computer Science' });
    const eeDept = await Department.create({ name: 'Electrical Engineering' });
    const meDept = await Department.create({ name: 'Mechanical Engineering' });

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'ADMIN',
      isApproved: true
    });

    const hod = await User.create({
      name: 'HOD User',
      email: 'hod@test.com',
      password: 'hod123',
      role: 'HOD',
      department: csDept._id,
      isApproved: true
    });

    const faculty = await User.create({
      name: 'Faculty User',
      email: 'faculty@test.com',
      password: 'faculty123',
      role: 'FACULTY',
      department: csDept._id,
      isApproved: true
    });

    // Set HOD for CS department
    csDept.hod = hod._id;
    await csDept.save();

    // Create classrooms
    const classrooms = await Classroom.insertMany([
      { name: 'E101' },
      { name: 'E102' },
      { name: 'E103' },
      { name: 'E104' },
      { name: 'E105' }
    ]);

    // Create time slots (9:00 – 17:00, 1 hour each)
    const timeSlots = await TimeSlot.insertMany([
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '12:00', endTime: '13:00' },
      { startTime: '13:00', endTime: '14:00' },
      { startTime: '14:00', endTime: '15:00' },
      { startTime: '15:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '17:00' }
    ]);

    // Create classroom-centric schedules
    // E101: CS department slots
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const csSubjects = ['Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems', 'Computer Networks'];
    const csYears = ['CSE-2nd Year', 'CSE-3rd Year', 'CSE-2nd Year', 'CSE-3rd Year', 'CSE-4th Year'];

    for (let i = 0; i < 5; i++) {
      await Schedule.create({
        classroom: classrooms[0]._id,
        day: days[i],
        timeSlot: timeSlots[i]._id,
        department: csDept._id,
        subject: csSubjects[i],
        faculty: faculty._id,
        year: csYears[i]
      });
    }

    // E102: EE department slots
    const eeSubjects = ['Circuit Theory', 'Power Systems', 'Electromagnetics'];
    for (let i = 0; i < 3; i++) {
      await Schedule.create({
        classroom: classrooms[1]._id,
        day: days[i],
        timeSlot: timeSlots[i + 2]._id,
        department: eeDept._id,
        subject: eeSubjects[i],
        faculty: null,
        year: 'EE-2nd Year'
      });
    }

    // E101: Some EE slots in afternoon
    await Schedule.create({
      classroom: classrooms[0]._id,
      day: 'Mon',
      timeSlot: timeSlots[5]._id,
      department: eeDept._id,
      subject: 'Digital Electronics',
      faculty: null,
      year: 'EE-3rd Year'
    });

    // E103: unassigned slots (no department yet)
    await Schedule.create({
      classroom: classrooms[2]._id,
      day: 'Mon',
      timeSlot: timeSlots[0]._id,
      department: null,
      subject: '',
      faculty: null,
      year: ''
    });

    console.log('Seed data created successfully!');
    console.log('---');
    console.log('Test accounts:');
    console.log('  ADMIN  → admin@test.com / admin123');
    console.log('  HOD    → hod@test.com / hod123');
    console.log('  FACULTY→ faculty@test.com / faculty123');
    console.log('---');
    console.log(`Departments: ${[csDept.name, eeDept.name, meDept.name].join(', ')}`);
    console.log(`Classrooms: ${classrooms.map(c => c.name).join(', ')}`);
    console.log(`Time slots: ${timeSlots.length} slots (09:00–17:00)`);
    console.log('Schedules: classroom-centric entries created');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedData();

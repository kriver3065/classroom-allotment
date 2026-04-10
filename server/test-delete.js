const mongoose = require('mongoose');
const User = require('./models/User');
const Schedule = require('./models/Schedule');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const admin = await User.findOne({ role: 'ADMIN' });
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
  
  const schedule = await Schedule.findOne();
  if(!schedule) return console.log("No schedule found");
  
  console.log("Found schedule:", { classroom: schedule.classroom, day: schedule.day, timeSlot: schedule.timeSlot });
  
  try {
    const res = await fetch('http://localhost:5000/api/admin/delete-slot', {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        classroomId: schedule.classroom.toString(),
        day: schedule.day,
        timeSlotId: schedule.timeSlot.toString()
      })
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);
  } catch(e) {
    console.log("ERROR:", e);
  }
  process.exit(0);
}
run();

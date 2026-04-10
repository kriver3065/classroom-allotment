const Schedule = require('../models/Schedule');

/**
 * ADDED: Reusable faculty conflict check.
 *
 * Ensures a faculty member is not double-booked in two different classrooms
 * at the same day and timeSlot.
 *
 * @param {Object}  params
 * @param {String}  params.faculty   - Faculty user ID
 * @param {String}  params.day       - Day of the week
 * @param {String}  params.timeSlot  - TimeSlot ID
 * @param {String}  [params.excludeId] - Schedule _id to exclude (for updates)
 * @returns {Object|null} The conflicting schedule if found, otherwise null
 */
async function checkFacultyConflict({ faculty, day, timeSlot, excludeId }) {
  // Skip check if no faculty is being assigned
  if (!faculty) return null;

  const query = { faculty, day, timeSlot };

  // Exclude the current schedule so updates don't block themselves
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Schedule.findOne(query);
}

module.exports = checkFacultyConflict;

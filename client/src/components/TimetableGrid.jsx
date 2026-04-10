import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ModalForm from './ModalForm';
import API from '../api/axios';
import './TimetableGrid.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * TimetableGrid — renders a days×timeslots grid.
 *
 * Props:
 *  mode: 'classroom' | 'department'
 *  schedules, timeSlots, onRefresh
 *  classroomId (for classroom mode), departmentId (unused but kept)
 *  departments, allUsers (for modal selectors)
 */
const TimetableGrid = ({ schedules, timeSlots, mode, classroomId, departments, allUsers, onRefresh }) => {
  const { user } = useAuth();
  const [editModal, setEditModal] = useState(null);
  const [formData, setFormData] = useState({ department: '', subject: '', faculty: '', year: '' });
  const [saving, setSaving] = useState(false);

  const isClassroomMode = mode === 'classroom';
  const isReadOnly = mode === 'department';

  const userDeptId = user.department
    ? (typeof user.department === 'object' ? user.department._id : user.department)
    : null;

  const canClickCell = (schedule) => {
    if (isReadOnly) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'HOD' && schedule) {
      const schedDeptId = schedule.department
        ? (typeof schedule.department === 'object' ? schedule.department._id : schedule.department)
        : null;
      return schedDeptId && schedDeptId === userDeptId;
    }
    return false;
  };

  const canClickEmpty = () => {
    if (isReadOnly) return false;
    return user.role === 'ADMIN';
  };

  const getScheduleForCell = (day, slotId) => {
    return schedules.find(s => {
      const tsId = typeof s.timeSlot === 'object' ? s.timeSlot._id : s.timeSlot;
      return s.day === day && tsId === slotId;
    });
  };

  const handleCellClick = (day, slot, schedule) => {
    if (schedule && !canClickCell(schedule)) return;
    if (!schedule && !canClickEmpty()) return;

    if (user.role === 'ADMIN') {
      setFormData({
        department: schedule?.department ? (typeof schedule.department === 'object' ? schedule.department._id : schedule.department) : '',
        subject: schedule?.subject || '',
        faculty: schedule?.faculty ? (typeof schedule.faculty === 'object' ? schedule.faculty._id : schedule.faculty) : '',
        year: schedule?.year || ''
      });
    } else {
      // HOD: can only edit subject/faculty/year
      setFormData({
        department: '',
        subject: schedule?.subject || '',
        faculty: schedule?.faculty ? (typeof schedule.faculty === 'object' ? schedule.faculty._id : schedule.faculty) : '',
        year: schedule?.year || ''
      });
    }
    setEditModal({ day, slot, schedule });
  };

  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const { day, slot, schedule } = editModal;

      if (user.role === 'ADMIN') {
        if (schedule && schedule._id) {
          // Update existing slot
          await API.put(`/admin/schedules/${schedule._id}`, {
            department: formData.department || null,
            subject: formData.subject,
            faculty: formData.faculty || null,
            year: formData.year
          });
        } else {
          // Create new slot via assign-slot
          await API.post('/admin/assign-slot', {
            classroom: classroomId,
            day,
            timeSlot: slot._id,
            department: formData.department || null,
            subject: formData.subject,
            faculty: formData.faculty || null,
            year: formData.year
          });
        }
      } else if (user.role === 'HOD') {
        if (schedule && schedule._id) {
          await API.put(`/hod/update-slot/${schedule._id}`, {
            subject: formData.subject,
            faculty: formData.faculty || null,
            year: formData.year
          });
        }
      }

      setEditModal(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editModal || !editModal.schedule) return;
    if (!confirm('Are you sure you want to delete this assigned slot?')) return;
    
    setSaving(true);
    try {
      await API.delete('/admin/delete-slot', {
        data: {
          classroomId,
          day: editModal.day,
          timeSlotId: editModal.slot._id
        }
      });
      setEditModal(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const sortedSlots = [...timeSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="timetable-wrapper">
      <div className="timetable-scroll" id="timetable-grid">
        <table className="timetable-table">
          <thead>
            <tr>
              <th className="day-header">Day / Time</th>
              {sortedSlots.map(slot => (
                <th key={slot._id} className="slot-header">
                  {slot.startTime}–{slot.endTime}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td className="day-cell">{day}</td>
                {sortedSlots.map(slot => {
                  const schedule = getScheduleForCell(day, slot._id);
                  const clickable = schedule ? canClickCell(schedule) : canClickEmpty();
                  return (
                    <td
                      key={slot._id}
                      className={`schedule-cell ${clickable ? 'editable' : ''} ${schedule ? 'has-data' : ''}`}
                      onClick={() => handleCellClick(day, slot, schedule)}
                    >
                      {schedule ? (
                        <div className="cell-content">
                          {/* Classroom mode: show department badge */}
                          {isClassroomMode && schedule.department && (
                            <span className="cell-dept">
                              {typeof schedule.department === 'object' ? schedule.department.name : schedule.department}
                            </span>
                          )}
                          {/* Department mode: show classroom badge */}
                          {!isClassroomMode && schedule.classroom && (
                            <span className="cell-classroom">
                              {typeof schedule.classroom === 'object' ? schedule.classroom.name : schedule.classroom}
                            </span>
                          )}
                          {schedule.subject && <span className="cell-subject">{schedule.subject}</span>}
                          {schedule.faculty && typeof schedule.faculty === 'object' && (
                            <span className="cell-faculty">{schedule.faculty.name}</span>
                          )}
                          {schedule.year && <span className="cell-year">{schedule.year}</span>}
                          {/* Unassigned slot indicator in classroom mode */}
                          {isClassroomMode && !schedule.department && (
                            <span className="cell-unassigned">Unassigned</span>
                          )}
                        </div>
                      ) : (
                        <span className={`cell-empty ${clickable ? 'cell-empty-clickable' : ''}`}>
                          {clickable ? '+' : '—'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editModal && (
        <ModalForm
          title={user.role === 'ADMIN'
            ? (editModal.schedule ? 'Edit Slot' : 'Assign Slot')
            : 'Edit Schedule'
          }
          onClose={() => setEditModal(null)}
        >
          <div className="edit-info">
            <span className="edit-badge">{editModal.day}</span>
            <span className="edit-badge">{editModal.slot.startTime}–{editModal.slot.endTime}</span>
          </div>

          {/* Admin can assign department */}
          {user.role === 'ADMIN' && (
            <div className="form-group">
              <label>Department</label>
              <select
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="">— No Department —</option>
                {(departments || []).map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Enter subject name"
            />
          </div>
          <div className="form-group">
            <label>Faculty</label>
            <select
              value={formData.faculty}
              onChange={e => setFormData({ ...formData, faculty: e.target.value })}
            >
              <option value="">— Select Faculty —</option>
              {(allUsers || [])
                .filter(u => u.role === 'FACULTY' || u.role === 'HOD')
                .map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))
              }
            </select>
          </div>
          <div className="form-group">
            <label>Year</label>
            <input
              type="text"
              value={formData.year}
              onChange={e => setFormData({ ...formData, year: e.target.value })}
              placeholder="e.g. CSE-2nd Year"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            {user.role === 'ADMIN' && editModal.schedule && (
              <button className="btn-delete" onClick={handleDelete} disabled={saving} style={{ padding: '0.85rem', flex: 1, borderRadius: '12px' }}>
                Delete
              </button>
            )}
            <button className="btn-submit" onClick={handleSave} disabled={saving} style={{ flex: 1, margin: 0 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </ModalForm>
      )}
    </div>
  );
};

export default TimetableGrid;

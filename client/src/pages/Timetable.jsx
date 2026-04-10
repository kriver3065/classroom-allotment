import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import TimetableGrid from '../components/TimetableGrid';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './Timetable.css';

const Timetable = () => {
  const { departmentId } = useParams();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [department, setDepartment] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, slotsRes, deptRes] = await Promise.all([
        API.get(`/schedules?department=${departmentId}`),
        API.get('/schedules/timeslots'),
        API.get('/schedules/departments')
      ]);
      setSchedules(schedRes.data);
      setTimeSlots(slotsRes.data);
      const dept = deptRes.data.find(d => d._id === departmentId);
      setDepartment(dept);

      // Fetch users list for faculty assignment
      if (user.role === 'ADMIN') {
        const usersRes = await API.get('/admin/users');
        setAllUsers(usersRes.data);
      } else if (user.role === 'HOD') {
        try {
          const facultyRes = await API.get('/hod/faculty');
          const hodSelf = [{ _id: user.id, name: user.name, email: user.email, role: 'HOD' }];
          setAllUsers([...hodSelf, ...facultyRes.data.map(f => ({ ...f, role: 'FACULTY' }))]);
        } catch {
          setAllUsers([]);
        }
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [departmentId]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('timetable-grid');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f0c29',
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add title
      pdf.setFontSize(16);
      pdf.text(`${department?.name || 'Department'} — Timetable`, 10, 15);
      pdf.setFontSize(10);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 10, 22);

      const yOffset = 28;
      if (imgHeight + yOffset <= pageHeight - 10) {
        pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, imgHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, pageHeight - yOffset - 10);
      }

      pdf.save(`${department?.name || 'timetable'}_schedule.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading timetable...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="timetable-page">
        <div className="timetable-header">
          <div className="timetable-title-group">
            <h1>{department?.name || 'Department'} Timetable</h1>
            <p className="timetable-subtitle">
              {user.role === 'FACULTY'
                ? 'View-only mode'
                : user.role === 'HOD'
                  ? user.department && (typeof user.department === 'object' ? user.department._id : user.department) === departmentId
                    ? 'Click on cells to edit subject & faculty'
                    : 'View-only (not your department)'
                  : 'Click on cells to edit'
              }
            </p>
          </div>
          <button className="btn-pdf" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No schedules assigned yet</h3>
            <p>
              {user.role === 'ADMIN'
                ? 'Go to Dashboard → Assign tab to assign classrooms to this department.'
                : 'Ask the admin to assign classrooms and time slots.'}
            </p>
          </div>
        ) : (
          <TimetableGrid
            schedules={schedules}
            timeSlots={timeSlots}
            departmentId={departmentId}
            allUsers={allUsers}
            onRefresh={fetchData}
          />
        )}
      </div>
    </>
  );
};

export default Timetable;

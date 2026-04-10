import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import TimetableGrid from '../components/TimetableGrid';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './Timetable.css';

const ClassroomTimetable = () => {
  const { classroomId } = useParams();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, slotsRes, classRes, deptRes] = await Promise.all([
        API.get(`/schedules?classroom=${classroomId}`),
        API.get('/schedules/timeslots'),
        API.get('/schedules/classrooms'),
        API.get('/schedules/departments')
      ]);
      setSchedules(schedRes.data);
      setTimeSlots(slotsRes.data);
      setClassroom(classRes.data.find(c => c._id === classroomId));
      setDepartments(deptRes.data);

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
      console.error('Failed to load classroom timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classroomId]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('timetable-grid');
    if (!element) return;

    try {
      element.classList.add('print-mode');
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      element.classList.remove('print-mode');
      
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 10, 10, pdfWidth - 20, pdfHeight - 20);
      pdf.save("timetable.pdf");
    } catch (err) {
      element.classList.remove('print-mode');
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF');
    }
  };

  const getSubtitle = () => {
    if (user.role === 'FACULTY') return 'View-only mode';
    if (user.role === 'ADMIN') return 'Click on cells to assign departments and edit schedules';
    if (user.role === 'HOD') return 'Click on your department\'s cells to edit subject, faculty & year';
    return '';
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
            <h1>{classroom?.name || 'Classroom'} Timetable</h1>
            <p className="timetable-subtitle">{getSubtitle()}</p>
          </div>
          <button className="btn-pdf" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
        </div>

        <TimetableGrid
          schedules={schedules}
          timeSlots={timeSlots}
          mode="classroom"
          classroomId={classroomId}
          departments={departments}
          allUsers={allUsers}
          onRefresh={fetchData}
        />
      </div>
    </>
  );
};

export default ClassroomTimetable;

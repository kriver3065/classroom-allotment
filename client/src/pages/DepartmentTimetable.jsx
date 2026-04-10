import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import TimetableGrid from '../components/TimetableGrid';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './Timetable.css';

const DepartmentTimetable = () => {
  const { departmentId } = useParams();
  const [schedules, setSchedules] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [department, setDepartment] = useState(null);
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
      setDepartment(deptRes.data.find(d => d._id === departmentId));
    } catch (err) {
      console.error('Failed to load department timetable:', err);
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
              Read-only — derived from classroom schedules
            </p>
          </div>
          <button className="btn-pdf" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No schedules found for this department</h3>
            <p>Schedules will appear here once classrooms are assigned to this department.</p>
          </div>
        ) : (
          <TimetableGrid
            schedules={schedules}
            timeSlots={timeSlots}
            mode="department"
          />
        )}
      </div>
    </>
  );
};

export default DepartmentTimetable;

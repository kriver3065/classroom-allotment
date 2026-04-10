import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import ModalForm from '../components/ModalForm';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('departments');
  const [classroomSearch, setClassroomSearch] = useState('');

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Form data
  const [deptForm, setDeptForm] = useState({ name: '', hod: '' });
  const [classForm, setClassForm] = useState({ name: '' });
  const [slotForm, setSlotForm] = useState({ startTime: '', endTime: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  
  // Admin User Management
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPasswordForm, setAdminPasswordForm] = useState({ newPassword: '' });
  const [adminEditUserId, setAdminEditUserId] = useState(null);

  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, classRes, slotRes] = await Promise.all([
        API.get('/schedules/departments'),
        API.get('/schedules/classrooms'),
        API.get('/schedules/timeslots'),
      ]);
      setDepartments(deptRes.data);
      setClassrooms(classRes.data);
      setTimeslots(slotRes.data);

      if (user.role === 'ADMIN') {
        const [pendRes, usersRes] = await Promise.all([
          API.get('/admin/pending-users'),
          API.get('/admin/users')
        ]);
        setPendingUsers(pendRes.data);
        setAllUsers(usersRes.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClassrooms = useMemo(() => {
    if (!classroomSearch.trim()) return classrooms;
    return classrooms.filter(c =>
      c.name.toLowerCase().includes(classroomSearch.toLowerCase())
    );
  }, [classrooms, classroomSearch]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // ─── Department CRUD ───
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: deptForm.name };
      if (deptForm.hod) payload.hod = deptForm.hod;
      if (editId) {
        await API.put(`/admin/departments/${editId}`, payload);
        showMessage('success', 'Department updated');
      } else {
        await API.post('/admin/departments', payload);
        showMessage('success', 'Department created');
      }
      setShowDeptModal(false);
      setDeptForm({ name: '', hod: '' });
      setEditId(null);
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  const editDept = (dept) => {
    setDeptForm({ name: dept.name, hod: dept.hod?._id || '' });
    setEditId(dept._id);
    setShowDeptModal(true);
  };

  const deleteDept = async (id) => {
    if (!confirm('Delete this department? Schedules will be unassigned.')) return;
    try {
      await API.delete(`/admin/departments/${id}`);
      showMessage('success', 'Department deleted');
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  // ─── Classroom CRUD ───
  const handleClassSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/admin/classrooms/${editId}`, classForm);
        showMessage('success', 'Classroom updated');
      } else {
        await API.post('/admin/classrooms', classForm);
        showMessage('success', 'Classroom created');
      }
      setShowClassModal(false);
      setClassForm({ name: '' });
      setEditId(null);
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  const editClass = (cl) => {
    setClassForm({ name: cl.name });
    setEditId(cl._id);
    setShowClassModal(true);
  };

  const deleteClass = async (id) => {
    if (!confirm('Delete this classroom and all its schedules?')) return;
    try {
      await API.delete(`/admin/classrooms/${id}`);
      showMessage('success', 'Classroom deleted');
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  // ─── TimeSlot CRUD ───
  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/admin/timeslots/${editId}`, slotForm);
        showMessage('success', 'Time slot updated');
      } else {
        await API.post('/admin/timeslots', slotForm);
        showMessage('success', 'Time slot created');
      }
      setShowSlotModal(false);
      setSlotForm({ startTime: '', endTime: '' });
      setEditId(null);
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  const editSlot = (slot) => {
    setSlotForm({ startTime: slot.startTime, endTime: slot.endTime });
    setEditId(slot._id);
    setShowSlotModal(true);
  };

  const deleteSlot = async (id) => {
    if (!confirm('Delete this time slot?')) return;
    try {
      await API.delete(`/admin/timeslots/${id}`);
      showMessage('success', 'Time slot deleted');
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  // ─── User approval ───
  const approveUser = async (id) => {
    try {
      await API.put(`/admin/approve-user/${id}`);
      showMessage('success', 'User approved');
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  const rejectUser = async (id) => {
    if (!confirm('Reject and remove this user?')) return;
    try {
      await API.delete(`/admin/reject-user/${id}`);
      showMessage('success', 'User rejected');
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  const deleteUser = async (userObj) => {
    if (userObj.role === 'ADMIN') return alert('Cannot delete an Admin');
    if (!confirm(`Delete user ${userObj.name}?`)) return;
    try {
      await API.delete(`/admin/user/${userObj._id}`);
      showMessage('success', 'User deleted');
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  const openAdminPasswordModal = (userObj) => {
    if (userObj.role === 'ADMIN') return alert('Cannot change password of another Admin');
    setAdminEditUserId(userObj._id);
    setAdminPasswordForm({ newPassword: '' });
    setShowAdminPasswordModal(true);
  };

  const handleAdminPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/admin/user/${adminEditUserId}/password`, adminPasswordForm);
      showMessage('success', 'User password updated');
      setShowAdminPasswordModal(false);
      setAdminEditUserId(null);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  // ─── Password change ───
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await API.put('/auth/change-password', passwordForm);
      showMessage('success', 'Password changed');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  // ─── Delete account ───
  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await API.delete('/auth/delete-account');
      logout();
      navigate('/');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-page">
        {message.text && (
          <div className={`alert alert-${message.type} dashboard-alert`}>{message.text}</div>
        )}

        {/* Hero Section */}
        <div className="dashboard-hero">
          <h1>Welcome back, {user.name}</h1>
          <p>Manage your classroom schedules efficiently</p>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏫</div>
            <div className="stat-info">
              <span className="stat-value">{classrooms.length}</span>
              <span className="stat-label">Classrooms</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏛️</div>
            <div className="stat-info">
              <span className="stat-value">{departments.length}</span>
              <span className="stat-label">Departments</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <span className="stat-value">{timeslots.length}</span>
              <span className="stat-label">Time Slots</span>
            </div>
          </div>
          {user.role === 'ADMIN' && (
            <div className="stat-card stat-pending">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <span className="stat-value">{pendingUsers.length}</span>
                <span className="stat-label">Pending Users</span>
              </div>
            </div>
          )}
        </div>

        {/* ═══ PRIMARY: Classroom Timetables ═══ */}
        <div className="section">
          <h2 className="section-title">🏫 Classroom Timetables</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search classroom (e.g. E101)..."
              value={classroomSearch}
              onChange={e => setClassroomSearch(e.target.value)}
              className="search-input"
            />
            {classroomSearch && (
              <button className="search-clear" onClick={() => setClassroomSearch('')}>✕</button>
            )}
          </div>
          <div className="dept-grid">
            {filteredClassrooms.map(cl => (
              <div
                key={cl._id}
                className="dept-card classroom-card"
                onClick={() => navigate(`/classroom/${cl._id}`)}
              >
                <div className="classroom-card-icon">🏫</div>
                <h3>{cl.name}</h3>
                <span className="dept-arrow">→</span>
              </div>
            ))}
            {filteredClassrooms.length === 0 && (
              <p className="empty-text">No classrooms match "{classroomSearch}"</p>
            )}
          </div>
        </div>

        {/* ═══ SECONDARY: Department Timetables ═══ */}
        <div className="section">
          <h2 className="section-title">📅 Department Timetables <span className="badge-readonly">Read Only</span></h2>
          <div className="dept-grid">
            {departments.map(dept => (
              <div
                key={dept._id}
                className="dept-card"
                onClick={() => navigate(`/department/${dept._id}`)}
              >
                <h3>{dept.name}</h3>
                <p className="dept-hod">
                  {dept.hod ? `HOD: ${dept.hod.name}` : 'No HOD assigned'}
                </p>
                <span className="dept-arrow">→</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Panel */}
        {user.role === 'ADMIN' && (
          <div className="section admin-panel">
            <h2 className="section-title">⚙️ Admin Panel</h2>
            <div className="tab-bar">
              {['departments', 'classrooms', 'timeslots', 'users'].map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Departments Tab */}
            {activeTab === 'departments' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h3>Departments</h3>
                  <button className="btn-add" onClick={() => { setEditId(null); setDeptForm({ name: '', hod: '' }); setShowDeptModal(true); }}>+ Add</button>
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>HOD</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {departments.map(d => (
                        <tr key={d._id}>
                          <td>{d.name}</td>
                          <td>{d.hod ? d.hod.name : '—'}</td>
                          <td className="action-cell">
                            <button className="btn-edit" onClick={() => editDept(d)}>Edit</button>
                            <button className="btn-delete" onClick={() => deleteDept(d._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Classrooms Tab */}
            {activeTab === 'classrooms' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h3>Classrooms</h3>
                  <button className="btn-add" onClick={() => { setEditId(null); setClassForm({ name: '' }); setShowClassModal(true); }}>+ Add</button>
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {classrooms.map(c => (
                        <tr key={c._id}>
                          <td>{c.name}</td>
                          <td className="action-cell">
                            <button className="btn-edit" onClick={() => editClass(c)}>Edit</button>
                            <button className="btn-delete" onClick={() => deleteClass(c._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Timeslots Tab */}
            {activeTab === 'timeslots' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h3>Time Slots</h3>
                  <button className="btn-add" onClick={() => { setEditId(null); setSlotForm({ startTime: '', endTime: '' }); setShowSlotModal(true); }}>+ Add</button>
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Start</th><th>End</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {timeslots.map(s => (
                        <tr key={s._id}>
                          <td>{s.startTime}</td>
                          <td>{s.endTime}</td>
                          <td className="action-cell">
                            <button className="btn-edit" onClick={() => editSlot(s)}>Edit</button>
                            <button className="btn-delete" onClick={() => deleteSlot(s._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="tab-content">
                <div className="tab-header" style={{ marginBottom: '0.5rem' }}>
                  <h3>Pending Approvals ({pendingUsers.length})</h3>
                </div>
                {pendingUsers.length === 0 ? (
                  <p className="empty-text" style={{ padding: '1rem' }}>No pending users</p>
                ) : (
                  <div className="data-table-wrap" style={{ marginBottom: '2rem' }}>
                    <table className="data-table">
                      <thead>
                        <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {pendingUsers.map(u => (
                          <tr key={u._id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td><span className={`role-badge role-${u.role.toLowerCase()}`}>{u.role}</span></td>
                            <td className="action-cell">
                              <button className="btn-approve" onClick={() => approveUser(u._id)}>Approve</button>
                              <button className="btn-delete" onClick={() => rejectUser(u._id)}>Reject</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="tab-header" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                  <h3>Approved Users ({allUsers.length})</h3>
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th><th>Dept</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {allUsers.map(u => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td><span className={`role-badge role-${u.role.toLowerCase()}`}>{u.role}</span></td>
                          <td>{u.department ? u.department.name : '—'}</td>
                          <td className="action-cell">
                            {u.role !== 'ADMIN' && (
                              <>
                                <button className="btn-edit" onClick={() => openAdminPasswordModal(u)}>Change Pass</button>
                                <button className="btn-delete" onClick={() => deleteUser(u)}>Delete</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Account Section */}
        <div className="section">
          <h2 className="section-title">🔒 Account Settings</h2>
          <div className="account-actions">
            <button className="btn-secondary" onClick={() => setShowPasswordModal(true)}>Change Password</button>
            <button className="btn-danger" onClick={handleDeleteAccount}>Delete Account</button>
          </div>
        </div>

        {/* ─── Modals ─── */}
        {showDeptModal && (
          <ModalForm title={editId ? 'Edit Department' : 'Add Department'} onClose={() => { setShowDeptModal(false); setEditId(null); }}>
            <form onSubmit={handleDeptSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>HOD (optional)</label>
                <select value={deptForm.hod} onChange={e => setDeptForm({ ...deptForm, hod: e.target.value })}>
                  <option value="">— None —</option>
                  {allUsers.filter(u => u.role === 'HOD').map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <button type="submit" className="btn-submit">{editId ? 'Update' : 'Create'}</button>
            </form>
          </ModalForm>
        )}

        {showClassModal && (
          <ModalForm title={editId ? 'Edit Classroom' : 'Add Classroom'} onClose={() => { setShowClassModal(false); setEditId(null); }}>
            <form onSubmit={handleClassSubmit}>
              <div className="form-group">
                <label>Classroom Name</label>
                <input type="text" value={classForm.name} onChange={e => setClassForm({ name: e.target.value })} placeholder="e.g. E101" required />
              </div>
              <button type="submit" className="btn-submit">{editId ? 'Update' : 'Create'}</button>
            </form>
          </ModalForm>
        )}

        {showSlotModal && (
          <ModalForm title={editId ? 'Edit Time Slot' : 'Add Time Slot'} onClose={() => { setShowSlotModal(false); setEditId(null); }}>
            <form onSubmit={handleSlotSubmit}>
              <div className="form-group">
                <label>Start Time</label>
                <input type="text" value={slotForm.startTime} onChange={e => setSlotForm({ ...slotForm, startTime: e.target.value })} placeholder="e.g. 09:00" required />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input type="text" value={slotForm.endTime} onChange={e => setSlotForm({ ...slotForm, endTime: e.target.value })} placeholder="e.g. 10:00" required />
              </div>
              <button type="submit" className="btn-submit">{editId ? 'Update' : 'Create'}</button>
            </form>
          </ModalForm>
        )}

        {showPasswordModal && (
          <ModalForm title="Change Password" onClose={() => setShowPasswordModal(false)}>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={6} />
              </div>
              <button type="submit" className="btn-submit">Update Password</button>
            </form>
          </ModalForm>
        )}

        {showAdminPasswordModal && (
          <ModalForm title="Force Reset User Password" onClose={() => setShowAdminPasswordModal(false)}>
            <form onSubmit={handleAdminPasswordSubmit}>
              <div className="form-group">
                <label>New Password</label>
                <input type="text" value={adminPasswordForm.newPassword} onChange={e => setAdminPasswordForm({ newPassword: e.target.value })} required minLength={6} placeholder="Enter new password" />
              </div>
              <button type="submit" className="btn-submit">Update User Password</button>
            </form>
          </ModalForm>
        )}
      </div>
    </>
  );
};

export default Dashboard;

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './Login.css';

const ROLES = [
  { key: 'ADMIN', label: 'Login as Admin', icon: '🛡️', color: 'role-btn-admin' },
  { key: 'HOD', label: 'Login as HOD', icon: '🎓', color: 'role-btn-hod' },
  { key: 'FACULTY', label: 'Login as Faculty', icon: '👨‍🏫', color: 'role-btn-faculty' }
];

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password, role: selectedRole });
      if (res.data.user.role !== selectedRole) {
        setError(`This account is registered as ${res.data.user.role}, not ${selectedRole}`);
        setLoading(false);
        return;
      }
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">📅</div>
          <h1>ClassRoom Allotment</h1>
          <p>{selectedRole ? 'Enter your credentials' : 'Select your role to continue'}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!selectedRole ? (
          /* Step 1: Role Selection */
          <div className="role-selection">
            {ROLES.map(role => (
              <button
                key={role.key}
                className={`role-select-btn ${role.color}`}
                onClick={() => { setSelectedRole(role.key); setError(''); }}
              >
                <span className="role-select-icon">{role.icon}</span>
                <span className="role-select-label">{role.label}</span>
              </button>
            ))}
          </div>
        ) : (
          /* Step 2: Credentials Form */
          <>
            <div className="selected-role-bar">
              <span className={`role-badge role-${selectedRole.toLowerCase()}`}>{selectedRole}</span>
              <button className="btn-back" onClick={() => { setSelectedRole(null); setError(''); setEmail(''); setPassword(''); }}>
                ← Change Role
              </button>
            </div>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        )}

        <div className="login-footer">
          <p>Don't have an account?</p>
          <button onClick={() => navigate('/register')} className="btn-register">
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

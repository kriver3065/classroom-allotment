import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClassroomTimetable from './pages/ClassroomTimetable';
import DepartmentTimetable from './pages/DepartmentTimetable';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classroom/:classroomId"
            element={
              <ProtectedRoute>
                <ClassroomTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/:departmentId"
            element={
              <ProtectedRoute>
                <DepartmentTimetable />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

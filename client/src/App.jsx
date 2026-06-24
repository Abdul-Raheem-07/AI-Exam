import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

import CreateExam from './pages/teacher/CreateExam';
import SubmitExam from './pages/student/SubmitExam';
import EvaluationResult from './pages/teacher/EvaluationResult';
import AdminDashboard from './pages/admin/AdminDashboard';
import WakeUpOverlay from './components/WakeUpOverlay';

function App() {
  return (
    <AuthProvider>
      <WakeUpOverlay>
        <Router>
          <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
            <Route path="/student/dashboard" element={<Dashboard />} />
            <Route path="/student/exam/:id/submit" element={<SubmitExam />} />
            <Route path="/student/submission/:id" element={<EvaluationResult />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']} />}>
            <Route path="/teacher/dashboard" element={<Dashboard />} />
            <Route path="/teacher/exam/create" element={<CreateExam />} />
            <Route path="/teacher/submission/:id" element={<EvaluationResult />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Router>
      </WakeUpOverlay>
    </AuthProvider>
  );
}

export default App;

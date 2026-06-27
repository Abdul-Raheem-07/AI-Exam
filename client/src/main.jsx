import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; // BrowserRouter import MAT karo
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthProvider';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateExam from './pages/teacher/CreateExam';
import SubmitExam from './pages/student/SubmitExam';
import EvaluationResult from './pages/teacher/EvaluationResult';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import WakeUpOverlay from './components/WakeUpOverlay';
import Navbar from './components/Navbar';
import { AnimatePresence } from 'framer-motion';

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <WakeUpOverlay>
        {/* Router NAHI — main.jsx mein already hai */}
        <Navbar />
        <AppRoutes />
      </WakeUpOverlay>
    </AuthProvider>
  );
}

export default App;
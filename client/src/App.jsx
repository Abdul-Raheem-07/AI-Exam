import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateExam from './pages/teacher/CreateExam';
import SubmitExam from './pages/student/SubmitExam';
import EvaluationResult from './pages/teacher/EvaluationResult';
import AdminDashboard from './pages/admin/AdminDashboard';
import TestBuilder from './pages/teacher/TestBuilder';
import TakeTest from './pages/student/TakeTest';
import TestResult from './pages/student/TestResult';
import TestList from './pages/student/TestList';
import Sections from './pages/Sections';
import SectionDetail from './pages/SectionDetail';
import ProtectedRoute from './components/ProtectedRoute';
import WakeUpOverlay from './components/WakeUpOverlay';
import Navbar from './components/Navbar';

const AppRoutes = () => {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
        <Route path="/student/dashboard" element={<Dashboard />} />
        <Route path="/student/sections" element={<Sections />} />
        <Route path="/student/exam/:id/submit" element={<SubmitExam />} />
        <Route path="/student/submission/:id" element={<EvaluationResult />} />
        <Route path="/student/test/:id" element={<TakeTest />} />
        <Route path="/student/test-results/:id" element={<TestResult />} />
        <Route path="/student/tests" element={<TestList />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']} />}>
        <Route path="/teacher/dashboard" element={<Dashboard />} />
        <Route path="/teacher/sections" element={<Sections />} />
        <Route path="/teacher/sections/:id" element={<SectionDetail />} />
        <Route path="/teacher/exam/create" element={<CreateExam />} />
        <Route path="/teacher/submission/:id" element={<EvaluationResult />} />
        <Route path="/teacher/test/create" element={<TestBuilder />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#172033',
            border: '1px solid #e4e8f0',
            borderRadius: 12,
            fontSize: '0.85rem',
            padding: '10px 14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#c24152',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <WakeUpOverlay>
        <Navbar />
        <AppRoutes />
      </WakeUpOverlay>
    </AuthProvider>
  );
}

export default App;
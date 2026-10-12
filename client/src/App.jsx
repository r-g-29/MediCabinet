import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Profiles from './pages/profiles/Profiles';
import Medicines from './pages/medicines/Medicines';
import Schedules from './pages/schedules/Schedules';
import Emergency from './pages/emergency/Emergency';
import ComingSoon from './pages/ComingSoon';
import Landing from './pages/landing/Landing';

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profiles"  element={<Profiles />} />
              <Route path="/medicines" element={<Medicines />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/logs"      element={<ComingSoon title="Dose Logs" />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;

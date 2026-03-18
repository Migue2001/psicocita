import React, { Component } from 'react';
console.log('[boot] App module loaded');
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CalendarView } from './pages/CalendarView';
import { Patients } from './pages/Patients';
import { PatientDetail } from './pages/PatientDetail';
import { Notifications } from './pages/Notifications';
import { Admin } from './pages/Admin';
import { Register } from './pages/Register';
import { ToastProvider } from './components/toast';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Error inesperado' };
  }
  componentDidCatch(error, info) {
    console.error('App crash captured:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
          <h2>Algo salió mal</h2>
          <p>{this.state.message}</p>
          <button onClick={() => window.location.reload()}>Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen w-screen"><span className="loader" style={{borderColor: 'var(--color-primary)'}}></span></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen w-screen"><span className="loader" style={{borderColor: 'var(--color-primary)'}}></span></div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!['admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute><AppProvider><Layout /></AppProvider></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  );
};

export default App;

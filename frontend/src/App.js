import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifyEmailSent from './pages/auth/VerifyEmailSent';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Super Admin pages
import SADashboard from './pages/superadmin/SADashboard';
import SABusinesses from './pages/superadmin/SABusinesses';
import SASubscriptions from './pages/superadmin/SASubscriptions';
import SALeads from './pages/superadmin/SALeads';
import SAAppointments from './pages/superadmin/SAAppointments';
import SAChatbots from './pages/superadmin/SAChatbots';
import SAIntegrations from './pages/superadmin/SAIntegrations';
import SAAnalytics from './pages/superadmin/SAAnalytics';
import SAPayments from './pages/superadmin/SAPayments';
import SASupport from './pages/superadmin/SASupport';
import SASystemSettings from './pages/superadmin/SASystemSettings';
import SAProfile from './pages/superadmin/SAProfile';

// Business Owner pages
import Dashboard from './pages/business/Dashboard';
import Leads from './pages/business/Leads';
import Conversations from './pages/business/Conversations';
import Appointments from './pages/business/Appointments';
import Chatbot from './pages/business/Chatbot';
import LeadVerification from './pages/business/LeadVerification';
import Notifications from './pages/business/Notifications';
import Analytics from './pages/business/Analytics';
import Integrations from './pages/business/Integrations';
import Settings from './pages/business/Settings';
import Profile from './pages/business/Profile';
import Billing from './pages/business/Billing';
import './index.css';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium" style={{fontFamily: 'Plus Jakarta Sans, sans-serif'}}>Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'super_admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Super Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="super_admin"><SADashboard /></ProtectedRoute>} />
          <Route path="/admin/businesses" element={<ProtectedRoute role="super_admin"><SABusinesses /></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute role="super_admin"><SASubscriptions /></ProtectedRoute>} />
          <Route path="/admin/leads" element={<ProtectedRoute role="super_admin"><SALeads /></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute role="super_admin"><SAAppointments /></ProtectedRoute>} />
          <Route path="/admin/chatbots" element={<ProtectedRoute role="super_admin"><SAChatbots /></ProtectedRoute>} />
          <Route path="/admin/integrations" element={<ProtectedRoute role="super_admin"><SAIntegrations /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute role="super_admin"><SAAnalytics /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute role="super_admin"><SAPayments /></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute role="super_admin"><SASupport /></ProtectedRoute>} />
          <Route path="/admin/system-settings" element={<ProtectedRoute role="super_admin"><SASystemSettings /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute role="super_admin"><SAProfile /></ProtectedRoute>} />

          {/* Business Owner Routes */}
          <Route path="/dashboard" element={<ProtectedRoute role="business_owner"><Dashboard /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute role="business_owner"><Leads /></ProtectedRoute>} />
          <Route path="/conversations" element={<ProtectedRoute role="business_owner"><Conversations /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute role="business_owner"><Appointments /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute role="business_owner"><Chatbot /></ProtectedRoute>} />
          <Route path="/lead-verification" element={<ProtectedRoute role="business_owner"><LeadVerification /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute role="business_owner"><Notifications /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute role="business_owner"><Analytics /></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute role="business_owner"><Integrations /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute role="business_owner"><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute role="business_owner"><Profile /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute role="business_owner"><Billing /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, MessageSquare, Calendar, BarChart2,
  Bot, Settings, CreditCard, Plug, LogOut, Building2, ChevronRight, Zap
} from 'lucide-react';

const businessLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/conversations', icon: MessageSquare, label: 'Conversations' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/chatbot', icon: Bot, label: 'AI Chatbot' },
  { to: '/integrations', icon: Plug, label: 'Integrations' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/businesses', icon: Building2, label: 'Businesses' },
  { to: '/admin/leads', icon: Users, label: 'All Leads' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'super_admin' ? adminLinks : businessLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white h-screen fixed hidden md:flex flex-col z-40" style={{fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-none" style={{fontFamily: 'Outfit, sans-serif'}}>LeadVerify</p>
          <p className="text-xs text-slate-400 mt-0.5">AI CRM Platform</p>
        </div>
      </div>

      {/* Role badge */}
      {user?.role === 'super_admin' && (
        <div className="mx-4 mt-3 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Super Admin</p>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-blue-400" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-700">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

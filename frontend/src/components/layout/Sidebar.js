import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, MessageSquare, Calendar, BarChart2,
  Bot, Settings, CreditCard, Plug, LogOut, Building2, ChevronRight, Zap,
  ShieldCheck, Bell, UserCircle, DollarSign, LifeBuoy, SlidersHorizontal
} from 'lucide-react';

const businessLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/conversations', icon: MessageSquare, label: 'Conversations' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/chatbot', icon: Bot, label: 'AI Chatbot' },
  { to: '/lead-verification', icon: ShieldCheck, label: 'Lead Verification' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/integrations', icon: Plug, label: 'Integrations' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/businesses', icon: Building2, label: 'Businesses' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/admin/leads', icon: Users, label: 'Leads' },
  { to: '/admin/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/admin/chatbots', icon: Bot, label: 'Chatbots' },
  { to: '/admin/integrations', icon: Plug, label: 'Integrations' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/admin/payments', icon: DollarSign, label: 'Payments' },
  { to: '/admin/support', icon: LifeBuoy, label: 'Support' },
  { to: '/admin/system-settings', icon: SlidersHorizontal, label: 'System Settings' },
  { to: '/admin/profile', icon: UserCircle, label: 'Profile' },
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
    <aside
      className="w-64 h-screen fixed hidden md:flex flex-col z-40"
      style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)'
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5" style={{borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #3b82f6, #6366f1)'}}>
          <Zap size={17} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none" style={{fontFamily: 'Outfit, sans-serif'}}>LeadVerify</p>
          <p className="text-xs mt-0.5" style={{color: 'rgba(255,255,255,0.45)'}}>AI CRM Platform</p>
        </div>
      </div>

      {/* Role badge */}
      {user?.role === 'super_admin' && (
        <div className="mx-4 mt-3 px-3 py-1.5 rounded-lg" style={{background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)'}}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{color: '#c4b5fd'}}>Super Admin</p>
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
                  isActive ? 'active-nav-link' : 'inactive-nav-link'
                }`
              }
              style={({ isActive }) => isActive
                ? { background: 'linear-gradient(90deg, rgba(59,130,246,0.35), rgba(99,102,241,0.2))', color: '#fff', borderLeft: '3px solid #60a5fa' }
                : { color: 'rgba(255,255,255,0.55)' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} style={{color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.4)'}} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={13} className="ml-auto" style={{color: '#93c5fd'}} />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="p-4" style={{borderTop: '1px solid rgba(255,255,255,0.08)'}}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #3b82f6, #6366f1)'}}>
            <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs truncate" style={{color: 'rgba(255,255,255,0.4)'}}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-all"
          style={{color: 'rgba(255,255,255,0.5)'}}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.color='#fca5a5'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

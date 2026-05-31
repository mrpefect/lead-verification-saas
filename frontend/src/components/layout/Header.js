import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsAPI } from '../../utils/api';
import { NavLink } from 'react-router-dom';

export default function Header({ title, subtitle }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'business_owner') {
      notificationsAPI.getNotifications({ unread_only: true, limit: 1 })
        .then(res => setUnreadCount(res.data.unread_count || 0))
        .catch(() => {});
    }
  }, [user]);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30" style={{fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
      <div>
        <h1 className="text-lg font-semibold text-slate-900" style={{fontFamily: 'Outfit, sans-serif'}}>{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {user?.role === 'business_owner' && (
          <NavLink to="/notifications" className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors" data-testid="notifications-btn">
            <Bell size={18} className="text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        )}
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-xs font-bold text-blue-700">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
        </div>
      </div>
    </header>
  );
}

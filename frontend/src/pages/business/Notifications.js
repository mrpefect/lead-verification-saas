import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { notificationsAPI } from '../../utils/api';
import { Bell, CheckCheck, Trash2, Users, Calendar, ShieldCheck } from 'lucide-react';

const TYPE_ICONS = {
  new_lead: { icon: Users, color: 'bg-blue-100 text-blue-600' },
  verified_lead: { icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-600' },
  appointment_booked: { icon: Calendar, color: 'bg-amber-100 text-amber-600' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getNotifications({ limit: 50, unread_only: filter === 'unread' });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [filter]);

  const handleMarkRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <Layout title="Notifications" subtitle={`${unreadCount} unread`}>
      <div className="max-w-2xl space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {['all','unread'].map(f => (
              <button key={f} onClick={()=>setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter===f?'bg-blue-600 text-white':'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                {f}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <CheckCheck size={14}/>Mark all as read
            </button>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Bell size={40} className="mb-3 opacity-20"/>
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-1">{filter === 'unread' ? 'All caught up!' : 'Notifications will appear here'}</p>
            </div>
          ) : filtered.map((notif, i) => {
            const { icon: Icon, color } = TYPE_ICONS[notif.type] || { icon: Bell, color: 'bg-slate-100 text-slate-600' };
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 px-5 py-4 border-b border-slate-50 last:border-0 transition-colors ${!notif.read ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                data-testid={`notification-${notif.id}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                  <Icon size={16}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"/>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-slate-300 mt-1">{notif.created_at?.slice(0,16).replace('T',' ')}</p>
                </div>
                {!notif.read && (
                  <button onClick={()=>handleMarkRead(notif.id)} title="Mark as read"
                    className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-500 hover:text-blue-700 flex-shrink-0">
                    <CheckCheck size={13}/>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { analyticsAPI, leadsAPI, appointmentsAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Users, CheckCircle, Calendar, TrendingUp, ArrowUpRight, Clock, Star, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ label, value, sub, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
            <ArrowUpRight size={12} />
            {trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1" style={{fontFamily: 'Outfit, sans-serif'}}>{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [recentAppts, setRecentAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getAnalytics(),
      leadsAPI.getLeads({ limit: 5 }),
      appointmentsAPI.getAppointments({ limit: 5 })
    ]).then(([a, l, ap]) => {
      setAnalytics(a.data);
      setRecentLeads(l.data.leads || []);
      setRecentAppts(ap.data.appointments || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    verified: 'bg-emerald-100 text-emerald-700',
    qualified: 'bg-purple-100 text-purple-700',
    booked: 'bg-amber-100 text-amber-700',
    closed: 'bg-slate-100 text-slate-700',
  };
  const apptColors = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) return (
    <Layout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Leads" value={analytics?.leads?.total || 0} icon={Users} color="blue" />
          <StatCard label="Verified Leads" value={analytics?.leads?.verified || 0} sub={`${analytics?.rates?.verification_rate || 0}% rate`} icon={CheckCircle} color="green" />
          <StatCard label="Appointments" value={analytics?.appointments?.total || 0} sub={`${analytics?.appointments?.confirmed || 0} confirmed`} icon={Calendar} color="amber" />
          <StatCard label="Conversion Rate" value={`${analytics?.rates?.conversion_rate || 0}%`} sub="Leads to closed" icon={TrendingUp} color="purple" />
        </div>

        {/* Lead Trend Chart */}
        {analytics?.lead_trend && analytics.lead_trend.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900" style={{fontFamily: 'Outfit, sans-serif'}}>Lead Activity</h3>
                <p className="text-xs text-slate-500 mt-0.5">Last 7 days</p>
              </div>
              <Activity size={16} className="text-slate-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.lead_trend} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{fontSize: 11, fill: '#94A3B8'}} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{fontSize: 11, fill: '#94A3B8'}} />
                <Tooltip contentStyle={{fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8}} />
                <Area type="monotone" dataKey="leads" stroke="#2563EB" strokeWidth={2} fill="url(#leadGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="recent-leads">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900" style={{fontFamily: 'Outfit, sans-serif'}}>Recent Leads</h3>
              <a href="/leads" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</a>
            </div>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No leads yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-slate-600">{lead.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                        <p className="text-xs text-slate-400">{lead.phone}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Appointments */}
          <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="recent-appointments">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900" style={{fontFamily: 'Outfit, sans-serif'}}>Recent Appointments</h3>
              <a href="/appointments" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</a>
            </div>
            {recentAppts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No appointments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAppts.map(appt => (
                  <div key={appt.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{appt.customer_name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{appt.date} at {appt.time}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${apptColors[appt.status] || 'bg-slate-100 text-slate-600'}`}>
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lead Sources */}
        {analytics?.lead_sources?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Lead Sources</h3>
            <div className="flex flex-wrap gap-3">
              {analytics.lead_sources.map(src => (
                <div key={src.source} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <Star size={12} className="text-blue-500" />
                  <span className="text-sm text-slate-700 capitalize">{src.source}</span>
                  <span className="text-xs font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded">{src.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

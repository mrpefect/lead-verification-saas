import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { analyticsAPI } from '../../utils/api';
import { Users, CheckCircle, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getAnalytics().then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="Analytics">
      <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
    </Layout>
  );

  const leadStatusData = data ? [
    { name: 'New', value: data.leads?.new || 0 },
    { name: 'Verified', value: data.leads?.verified || 0 },
    { name: 'Qualified', value: data.leads?.qualified || 0 },
    { name: 'Booked', value: data.leads?.booked || 0 },
    { name: 'Closed', value: data.leads?.closed || 0 },
  ] : [];

  const apptStatusData = data ? [
    { name: 'Pending', value: data.appointments?.pending || 0 },
    { name: 'Confirmed', value: data.appointments?.confirmed || 0 },
    { name: 'Completed', value: data.appointments?.completed || 0 },
  ] : [];

  return (
    <Layout title="Analytics" subtitle="Performance overview">
      <div className="space-y-6">
        {/* Rate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Verification Rate', value: `${data?.rates?.verification_rate || 0}%`, icon: CheckCircle, color: 'emerald' },
            { label: 'Appointment Rate', value: `${data?.rates?.appointment_rate || 0}%`, icon: Calendar, color: 'blue' },
            { label: 'Conversion Rate', value: `${data?.rates?.conversion_rate || 0}%`, icon: TrendingUp, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
                <Icon size={18} className={`text-${color}-600`} />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1" style={{fontFamily: 'Outfit, sans-serif'}}>{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Lead Trend (7 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.lead_trend || []} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94A3B8'}} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{fontSize: 10, fill: '#94A3B8'}} />
                <Tooltip contentStyle={{fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8}} />
                <Area type="monotone" dataKey="leads" stroke="#2563EB" strokeWidth={2} fill="url(#grad)" name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Status Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Lead Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadStatusData} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94A3B8'}} />
                <YAxis tick={{fontSize: 10, fill: '#94A3B8'}} />
                <Tooltip contentStyle={{fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8}} />
                <Bar dataKey="value" fill="#2563EB" radius={[4,4,0,0]} name="Leads">
                  {leadStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Sources */}
          {data?.lead_sources?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Lead Sources</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.lead_sources.map(s => ({name: s.source, value: s.count}))} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {data.lead_sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Appointment Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Appointments</h3>
            <div className="space-y-3">
              {apptStatusData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: COLORS[i]}} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">{item.name}</span>
                      <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{width: `${data?.appointments?.total ? (item.value/data.appointments.total)*100 : 0}%`, backgroundColor: COLORS[i]}}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

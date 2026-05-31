import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { adminAPI } from '../../utils/api';
import { Building2, Users, Calendar, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#2563EB','#10B981','#F59E0B','#8B5CF6'];

const gradients = {
  blue:   'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
  green:  'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
  amber:  'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
  purple: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
};

export default function SAAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics().then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="Platform Analytics">
      <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
    </Layout>
  );

  const planData = data?.plan_distribution ? [
    { name: 'Starter', value: data.plan_distribution.starter || 0 },
    { name: 'Growth', value: data.plan_distribution.growth || 0 },
    { name: 'Pro', value: data.plan_distribution.pro || 0 },
    { name: 'Enterprise', value: data.plan_distribution.enterprise || 0 },
  ] : [];

  const summaryData = [
    { name: 'Businesses', active: data?.active_businesses || 0, total: data?.total_businesses || 0 },
    { name: 'Leads', active: data?.verified_leads || 0, total: data?.total_leads || 0 },
    { name: 'Appointments', active: data?.confirmed_appointments || 0, total: data?.total_appointments || 0 },
  ];

  return (
    <Layout title="Platform Analytics" subtitle="Comprehensive platform metrics">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Businesses', value: data?.total_businesses || 0, sub: `${data?.active_businesses || 0} active`, icon: Building2, color: 'blue' },
            { label: 'Total Leads', value: data?.total_leads || 0, sub: `${data?.verified_leads || 0} verified`, icon: Users, color: 'green' },
            { label: 'Appointments', value: data?.total_appointments || 0, sub: `${data?.confirmed_appointments || 0} confirmed`, icon: Calendar, color: 'amber' },
            { label: 'Verification Rate', value: data?.total_leads ? `${Math.round((data.verified_leads / data.total_leads) * 100)}%` : '0%', sub: 'Of all leads', icon: CheckCircle, color: 'purple' },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl p-6 relative overflow-hidden hover:scale-[1.02] transition-transform duration-200 cursor-default"
              style={{ background: gradients[color] }}
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20" style={{background: 'rgba(255,255,255,0.3)'}} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 relative" style={{background: 'rgba(255,255,255,0.2)'}}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-3xl font-bold text-white mb-0.5 relative" style={{fontFamily: 'Outfit, sans-serif'}}>{value}</p>
              <p className="text-sm relative" style={{color: 'rgba(255,255,255,0.85)'}}>{label}</p>
              <p className="text-xs mt-0.5 relative" style={{color: 'rgba(255,255,255,0.6)'}}>{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Subscription Plans</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={planData} cx="50%" cy="50%" outerRadius={65} dataKey="value">
                    {planData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {planData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i]}} />
                      <span className="text-sm text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Platform Summary</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={summaryData} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{fontSize: 11, fill: '#94A3B8'}} />
                <YAxis tick={{fontSize: 11, fill: '#94A3B8'}} />
                <Tooltip contentStyle={{fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8}} />
                <Bar dataKey="total" fill="#E2E8F0" radius={[4,4,0,0]} name="Total" />
                <Bar dataKey="active" fill="#2563EB" radius={[4,4,0,0]} name="Active/Verified" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}

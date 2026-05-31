import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { adminAPI } from '../../utils/api';
import { Building2, Users, Calendar, TrendingUp, ArrowUpRight, Globe, BarChart3, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#2563EB','#10B981','#F59E0B','#8B5CF6'];

function StatCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1" style={{fontFamily: 'Outfit, sans-serif'}}>{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function SADashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics().then(res => setAnalytics(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="Admin Dashboard">
      <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
    </Layout>
  );

  const planData = analytics?.plan_distribution ? [
    { name: 'Starter', value: analytics.plan_distribution.starter || 0 },
    { name: 'Growth', value: analytics.plan_distribution.growth || 0 },
    { name: 'Pro', value: analytics.plan_distribution.pro || 0 },
    { name: 'Enterprise', value: analytics.plan_distribution.enterprise || 0 },
  ] : [];

  return (
    <Layout title="Platform Dashboard" subtitle="Overall platform performance">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Businesses" value={analytics?.total_businesses || 0} sub={`${analytics?.active_businesses || 0} active`} icon={Building2} color="blue" />
          <StatCard label="Total Leads" value={analytics?.total_leads || 0} sub={`${analytics?.verified_leads || 0} verified`} icon={Users} color="green" />
          <StatCard label="Total Appointments" value={analytics?.total_appointments || 0} sub={`${analytics?.confirmed_appointments || 0} confirmed`} icon={Calendar} color="amber" />
          <StatCard label="Platform Health" value="Active" icon={Zap} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Plan Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({name, value}) => value > 0 ? `${name}: ${value}` : ''}>
                  {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8}} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Business Health */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{fontFamily: 'Outfit, sans-serif'}}>Business Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Total', value: analytics?.total_businesses || 0 },
                { name: 'Active', value: analytics?.active_businesses || 0 },
              ]} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{fontSize: 11, fill: '#94A3B8'}} />
                <YAxis tick={{fontSize: 11, fill: '#94A3B8'}} />
                <Tooltip contentStyle={{fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8}} />
                <Bar dataKey="value" fill="#2563EB" radius={[4,4,0,0]}>
                  <Cell fill="#94A3B8" />
                  <Cell fill="#2563EB" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Manage Businesses', desc: 'Create, edit, suspend businesses', href: '/admin/businesses', icon: Building2 },
            { title: 'All Leads', desc: 'View leads across all businesses', href: '/admin/leads', icon: Users },
            { title: 'Platform Analytics', desc: 'Detailed usage statistics', href: '/admin/analytics', icon: BarChart3 },
          ].map(({ title, desc, href, icon: Icon }) => (
            <a key={href} href={href} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all hover:border-blue-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon size={16} className="text-blue-600" />
                </div>
                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
}

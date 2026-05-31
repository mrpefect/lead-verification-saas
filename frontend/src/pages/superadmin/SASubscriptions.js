import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { adminAPI } from '../../utils/api';
import { CreditCard, Search, ChevronLeft, ChevronRight, TrendingUp, Users } from 'lucide-react';

const PLAN_COLORS = {
  starter: { bg: 'bg-slate-100 text-slate-700', bar: '#94A3B8' },
  growth:  { bg: 'bg-blue-100 text-blue-700',   bar: '#2563EB' },
  pro:     { bg: 'bg-purple-100 text-purple-700', bar: '#7C3AED' },
  enterprise: { bg: 'bg-amber-100 text-amber-700', bar: '#D97706' },
};
const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  trial:  'bg-blue-100 text-blue-700',
  inactive: 'bg-red-100 text-red-700',
};

const gradients = {
  blue:   'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
  green:  'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
  amber:  'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
  purple: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
};

export default function SASubscriptions() {
  const [businesses, setBusinesses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getBusinesses({ page, limit: 15, search });
      let biz = res.data.businesses || [];
      if (planFilter) biz = biz.filter(b => b.subscription_plan === planFilter);
      setBusinesses(biz);
      setTotal(res.data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, search, planFilter]);

  const planCounts = businesses.reduce((acc, b) => {
    acc[b.subscription_plan] = (acc[b.subscription_plan] || 0) + 1;
    return acc;
  }, {});

  const pages = Math.ceil(total / 15);

  return (
    <Layout title="Subscriptions" subtitle="Manage all business subscription plans">
      <div className="space-y-6">
        {/* Plan Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'starter', label: 'Starter', color: 'blue' },
            { id: 'growth',  label: 'Growth',  color: 'green' },
            { id: 'pro',     label: 'Pro',      color: 'purple' },
            { id: 'enterprise', label: 'Enterprise', color: 'amber' },
          ].map(({ id, label, color }) => (
            <div key={id} className="rounded-2xl p-5 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
              style={{ background: gradients[color] }} onClick={() => setPlanFilter(planFilter === id ? '' : id)}>
              <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full opacity-20" style={{background:'rgba(255,255,255,0.3)'}} />
              <p className="text-2xl font-bold text-white relative" style={{fontFamily:'Outfit,sans-serif'}}>{planCounts[id] || 0}</p>
              <p className="text-sm relative" style={{color:'rgba(255,255,255,0.8)'}}>{label} Plan</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search businesses..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none" />
            </div>
            <select value={planFilter} onChange={e=>setPlanFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none">
              <option value="">All Plans</option>
              {['starter','growth','pro','enterprise'].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Since</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                : businesses.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No businesses found</td></tr>
                : businesses.map(biz => (
                  <tr key={biz.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{biz.name}</td>
                    <td className="px-4 py-3 text-slate-500">{biz.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${PLAN_COLORS[biz.subscription_plan]?.bg || 'bg-slate-100 text-slate-600'}`}>
                        {biz.subscription_plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[biz.subscription_status] || 'bg-slate-100 text-slate-600'}`}>
                        {biz.subscription_status || 'trial'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{biz.created_at?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Page {page} of {pages}</p>
              <div className="flex gap-1">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={14}/></button>
                <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={14}/></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

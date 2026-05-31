import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { adminAPI, formatError } from '../../utils/api';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Building2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Eye, PauseCircle, PlayCircle } from 'lucide-react';

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  deleted: 'bg-slate-100 text-slate-600',
};
const PLAN_COLORS = {
  starter: 'bg-slate-100 text-slate-700',
  growth: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

function CreateBusinessModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', website: '', owner_name: '', owner_password: 'TempPass@123', subscription_plan: 'starter' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminAPI.createBusiness(form);
      onCreate();
      onClose();
    } catch (err) {
      setError(formatError(err.response?.data?.detail));
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl" style={{fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
        <h3 className="text-lg font-semibold text-slate-900 mb-5" style={{fontFamily: 'Outfit, sans-serif'}}>Create Business</h3>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['name','Business Name *','text',true],['email','Email *','email',true],['phone','Phone','tel',false],['website','Website','url',false],['owner_name','Owner Name','text',false],['owner_password','Owner Password','text',false]].map(([k,l,t,r]) => (
              <div key={k}>
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">{l}</label>
                <input type={t} value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} required={r}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">Plan</label>
            <select value={form.subscription_plan} onChange={e=>setForm({...form,subscription_plan:e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none">
              {['starter','growth','pro','enterprise'].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} data-testid="create-business-submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SABusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getBusinesses({ page, limit: 15, search });
      setBusinesses(res.data.businesses || []);
      setTotal(res.data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchBusinesses(); }, [page, search]);

  const handleSuspend = async (id, currentStatus) => {
    const action = currentStatus === 'active' ? 'suspend' : 'activate';
    if (!window.confirm(`${action === 'suspend' ? 'Suspend' : 'Activate'} this business?`)) return;
    try {
      if (action === 'suspend') await adminAPI.suspendBusiness(id);
      else await adminAPI.activateBusiness(id);
      fetchBusinesses();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this business? This cannot be undone.')) return;
    try {
      await adminAPI.deleteBusiness(id);
      fetchBusinesses();
    } catch {}
  };

  const pages = Math.ceil(total / 15);

  return (
    <Layout title="Businesses" subtitle={`${total} total`}>
      {showCreate && <CreateBusinessModal onClose={() => setShowCreate(false)} onCreate={fetchBusinesses} />}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search businesses..."
              data-testid="businesses-search"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>
          <button onClick={() => setShowCreate(true)} data-testid="create-business-btn"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16} />Create Business
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                ) : businesses.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No businesses found</td></tr>
                ) : businesses.map(biz => (
                  <tr key={biz.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors" data-testid={`business-row-${biz.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Building2 size={14} className="text-blue-600" />
                        </div>
                        <span className="font-semibold text-slate-900">{biz.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{biz.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLAN_COLORS[biz.subscription_plan] || 'bg-slate-100 text-slate-600'}`}>
                        {biz.subscription_plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[biz.status] || 'bg-slate-100 text-slate-600'}`}>
                        {biz.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{biz.created_at?.slice(0,10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSuspend(biz.id, biz.status)}
                          className={`p-1.5 rounded-lg transition-colors ${biz.status === 'active' ? 'hover:bg-red-50 text-red-400 hover:text-red-600' : 'hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600'}`}
                          title={biz.status === 'active' ? 'Suspend' : 'Activate'}>
                          {biz.status === 'active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                        </button>
                        <button onClick={() => handleDelete(biz.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Page {page} of {pages} ({total} total)</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={14} /></button>
                <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

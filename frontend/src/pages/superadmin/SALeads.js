import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { adminAPI } from '../../utils/api';
import { Search, ChevronLeft, ChevronRight, Phone, Mail } from 'lucide-react';

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  verified: 'bg-emerald-100 text-emerald-700',
  qualified: 'bg-purple-100 text-purple-700',
  booked: 'bg-amber-100 text-amber-700',
  closed: 'bg-slate-100 text-slate-600',
};
const VERIFY_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

export default function SALeads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllLeads({ page, limit: 15, search, status: statusFilter });
      setLeads(res.data.leads || []);
      setTotal(res.data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, [page, search, statusFilter]);

  const pages = Math.ceil(total / 15);

  return (
    <Layout title="All Leads" subtitle={`${total} total leads across all businesses`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none">
            <option value="">All Statuses</option>
            {['new','verified','qualified','booked','closed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Business ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No leads found</td></tr>
                ) : leads.map(lead => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{lead.name}</td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1 text-xs"><Phone size={10} className="text-slate-400" />{lead.phone}</p>
                      {lead.email && <p className="flex items-center gap-1 text-xs text-slate-400"><Mail size={10} />{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{lead.service || '—'}</td>
                    <td className="px-4 py-3 capitalize text-slate-500">{lead.source}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">{lead.business_id?.slice(-8)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-600'}`}>{lead.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERIFY_COLORS[lead.verification_status] || 'bg-slate-100 text-slate-600'}`}>{lead.verification_status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{lead.created_at?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Page {page} of {pages}</p>
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

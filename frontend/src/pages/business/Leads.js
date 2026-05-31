import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { leadsAPI, formatError } from '../../utils/api';
import { Plus, Search, Filter, MoreHorizontal, Phone, Mail, Trash2, Edit, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

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

function LeadModal({ lead, onClose, onUpdate }) {
  const [form, setForm] = useState(lead);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leadsAPI.updateLead(lead.id, form);
      onUpdate();
      onClose();
    } catch {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" style={{fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
        <h3 className="text-lg font-semibold text-slate-900 mb-5" style={{fontFamily: 'Outfit, sans-serif'}}>Edit Lead</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['name','Name','text'],['phone','Phone','tel'],['email','Email','email'],['service','Service','text']].map(([key,label,type]) => (
            <div key={key}>
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">{label}</label>
              <input type={type} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">Status</label>
            <select value={form.status||'new'} onChange={e=>setForm({...form,status:e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none">
              {['new','verified','qualified','booked','closed'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">Notes</label>
            <textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', service: '', source: 'manual' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leadsAPI.createLead(form);
      onAdd();
      onClose();
    } catch (err) {
      setError(formatError(err.response?.data?.detail));
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" style={{fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
        <h3 className="text-lg font-semibold text-slate-900 mb-5" style={{fontFamily: 'Outfit, sans-serif'}}>Add New Lead</h3>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['name','Name *','text',true],['phone','Phone *','tel',true],['email','Email','email',false],['service','Service','text',false]].map(([key,label,type,req]) => (
            <div key={key}>
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">{label}</label>
              <input type={type} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} required={req}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">Source</label>
            <select value={form.source} onChange={e=>setForm({...form,source:e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none">
              {['manual','chatbot','webhook','facebook','google','referral'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} data-testid="add-lead-submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await leadsAPI.getLeads({ page, limit: 15, search, status: statusFilter });
      setLeads(res.data.leads || []);
      setTotal(res.data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, [page, search, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    await leadsAPI.deleteLead(id);
    fetchLeads();
  };

  const handleSendOTP = async (lead) => {
    setVerifying(lead);
    try {
      await leadsAPI.sendVerification(lead.id);
      setOtpStep(true);
    } catch (err) {
      alert(formatError(err.response?.data?.detail));
    }
  };

  const handleConfirmOTP = async () => {
    try {
      const res = await leadsAPI.confirmVerification(verifying.id, otpCode);
      if (res.data.verified) {
        alert('Lead verified!');
        fetchLeads();
      } else {
        alert('Invalid OTP');
      }
    } catch (err) {
      alert(formatError(err.response?.data?.detail));
    }
    setVerifying(null);
    setOtpStep(false);
    setOtpCode('');
  };

  const pages = Math.ceil(total / 15);

  return (
    <Layout title="Leads" subtitle={`${total} total leads`}>
      {/* OTP Modal */}
      {verifying && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{fontFamily: 'Outfit, sans-serif'}}>
              {otpStep ? 'Enter OTP' : 'Sending OTP...'}
            </h3>
            {otpStep && (
              <>
                <p className="text-sm text-slate-500 mb-4">Enter the OTP sent to {verifying.phone}</p>
                <input value={otpCode} onChange={e=>setOtpCode(e.target.value)} placeholder="6-digit code"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm mb-4 focus:border-blue-500 outline-none" />
                <div className="flex gap-3">
                  <button onClick={() => { setVerifying(null); setOtpStep(false); setOtpCode(''); }} className="flex-1 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
                  <button onClick={handleConfirmOTP} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Verify</button>
                </div>
              </>
            )}
            {!otpStep && <p className="text-sm text-slate-500">Sending verification code...</p>}
          </div>
        </div>
      )}

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onAdd={fetchLeads} />}
      {editLead && <LeadModal lead={editLead} onClose={() => setEditLead(null)} onUpdate={fetchLeads} />}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search leads..."
              data-testid="leads-search"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            data-testid="leads-status-filter"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            {['new','verified','qualified','booked','closed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => setShowAdd(true)}
            data-testid="add-lead-btn"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Lead
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No leads found</td></tr>
                ) : leads.map(lead => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors" data-testid={`lead-row-${lead.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">{lead.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-slate-900">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="flex items-center gap-1 text-xs"><Phone size={10} className="text-slate-400" />{lead.phone}</p>
                        {lead.email && <p className="flex items-center gap-1 text-xs text-slate-400"><Mail size={10} />{lead.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{lead.service || '—'}</td>
                    <td className="px-4 py-3 capitalize text-slate-500">{lead.source}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERIFY_COLORS[lead.verification_status] || 'bg-slate-100 text-slate-600'}`}>
                        {lead.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditLead(lead)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700" title="Edit"><Edit size={13} /></button>
                        {lead.verification_status !== 'verified' && (
                          <button onClick={() => handleSendOTP(lead)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-700" title="Verify"><Shield size={13} /></button>
                        )}
                        <button onClick={() => handleDelete(lead.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
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

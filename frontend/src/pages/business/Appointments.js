import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { appointmentsAPI, formatError } from '../../utils/api';
import { Plus, Search, Trash2, Edit, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

function AppointmentModal({ appt, onClose, onSave }) {
  const [form, setForm] = useState(appt || { customer_name: '', customer_phone: '', customer_email: '', service: '', date: '', time: '', notes: '', status: 'pending' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!appt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) await appointmentsAPI.updateAppointment(appt.id, form);
      else await appointmentsAPI.createAppointment(form);
      onSave();
      onClose();
    } catch (err) {
      setError(formatError(err.response?.data?.detail));
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl" style={{fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
        <h3 className="text-lg font-semibold text-slate-900 mb-5" style={{fontFamily: 'Outfit, sans-serif'}}>
          {isEdit ? 'Edit Appointment' : 'New Appointment'}
        </h3>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['customer_name','Customer Name *','text',true],['customer_phone','Phone *','tel',true],['customer_email','Email','email',false],['service','Service','text',false]].map(([k,l,t,r]) => (
              <div key={k}>
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">{l}</label>
                <input type={t} value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} required={r}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">Date *</label>
              <input type="date" value={form.date||''} onChange={e=>setForm({...form,date:e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">Time *</label>
              <input type="time" value={form.time||''} onChange={e=>setForm({...form,time:e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none" />
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">Status</label>
              <select value={form.status||'pending'} onChange={e=>setForm({...form,status:e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none">
                {['pending','confirmed','completed','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">Notes</label>
            <textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : (isEdit ? 'Save' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAppt, setEditAppt] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsAPI.getAppointments({ page, limit: 15, search, status: statusFilter });
      setAppointments(res.data.appointments || []);
      setTotal(res.data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, [page, search, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    await appointmentsAPI.deleteAppointment(id);
    fetchAppointments();
  };

  const pages = Math.ceil(total / 15);

  return (
    <Layout title="Appointments" subtitle={`${total} total`}>
      {(showModal || editAppt) && (
        <AppointmentModal appt={editAppt} onClose={() => { setShowModal(false); setEditAppt(null); }} onSave={fetchAppointments} />
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search appointments..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none">
            <option value="">All Statuses</option>
            {['pending','confirmed','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} data-testid="add-appointment-btn"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16} />Book Appointment
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No appointments found</td></tr>
                ) : appointments.map(appt => (
                  <tr key={appt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{appt.customer_name}</p>
                      <p className="text-xs text-slate-400">{appt.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{appt.service || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{appt.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Clock size={10} />
                        <span>{appt.time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[appt.status] || 'bg-slate-100 text-slate-600'}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">{appt.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditAppt(appt)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700"><Edit size={13} /></button>
                        <button onClick={() => handleDelete(appt.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
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

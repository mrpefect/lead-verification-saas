import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { adminAPI } from '../../utils/api';
import { Search, ChevronLeft, ChevronRight, Calendar, Clock, Phone } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function SAAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminAPI.getAllAppointments({ page, limit: 15 })
      .then(res => { setAppointments(res.data.appointments || []); setTotal(res.data.total || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  const pages = Math.ceil(total / 15);

  return (
    <Layout title="All Appointments" subtitle={`${total} appointments across all businesses`}>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Business</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
              : appointments.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No appointments yet</td></tr>
              : appointments.map(a => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{a.customer_name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={10}/>{a.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{a.service || '—'}</td>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1"><Calendar size={12} className="text-slate-400"/>{a.date}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock size={10}/>{a.time}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-600'}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{a.business_id?.slice(-8)}</td>
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
    </Layout>
  );
}

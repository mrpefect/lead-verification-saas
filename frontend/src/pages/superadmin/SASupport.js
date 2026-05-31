import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { LifeBuoy, MessageSquare, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';

export default function SASupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    api.get('/api/admin/support')
      .then(res => setTickets(res.data.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = { open: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700', resolved: 'bg-emerald-100 text-emerald-700' };
  const priorityColor = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-slate-100 text-slate-600' };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/api/admin/support/${id}`, { status });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    } catch {}
  };

  return (
    <Layout title="Support" subtitle="Manage support tickets from business owners">
      <div className="flex gap-6" style={{minHeight: '500px'}}>
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Tickets ({tickets.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
            : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <LifeBuoy size={32} className="mb-2 opacity-30"/>
                <p className="text-sm">No support tickets</p>
              </div>
            ) : tickets.map(ticket => (
              <div key={ticket.id} onClick={()=>setSelected(ticket)}
                className={`px-4 py-3 cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${selected?.id===ticket.id?'bg-blue-50':''}`}>
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-900 truncate flex-1">{ticket.subject}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${statusColor[ticket.status]||'bg-slate-100 text-slate-600'}`}>{ticket.status}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{ticket.business_name}</p>
                <p className="text-xs text-slate-300 mt-0.5">{ticket.created_at?.slice(0,10)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200">
          {selected ? (
            <div className="h-full flex flex-col">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900" style={{fontFamily:'Outfit,sans-serif'}}>{selected.subject}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">From: {selected.business_name} · {selected.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[selected.status]}`}>{selected.status}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor[selected.priority]||'bg-slate-100 text-slate-600'}`}>{selected.priority || 'medium'}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-5 overflow-y-auto">
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-slate-700">{selected.message}</p>
                </div>
                {selected.replies?.map((r, i) => (
                  <div key={i} className={`mb-3 flex ${r.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm px-4 py-2.5 rounded-xl text-sm ${r.from==='admin'?'bg-blue-600 text-white':'bg-slate-100 text-slate-700'}`}>
                      {r.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100">
                <div className="flex gap-3 mb-3">
                  {['in_progress','resolved'].map(s => (
                    <button key={s} onClick={()=>handleUpdateStatus(selected.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${selected.status===s?'bg-blue-600 text-white':'border border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                      Mark {s.replace('_',' ')}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type a reply..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"/>
                  <button onClick={()=>{}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    <Send size={14}/>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <LifeBuoy size={48} className="mb-3 opacity-20"/>
              <p className="text-sm font-medium">Select a ticket</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

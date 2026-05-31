import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { leadsAPI } from '../../utils/api';
import { ShieldCheck, Search, Phone, Send, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const VERIFY_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

export default function LeadVerification() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await leadsAPI.getLeads({ page, limit: 15, search });
      setLeads(res.data.leads || []);
      setTotal(res.data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, [page, search]);

  const handleSendOTP = async (lead) => {
    setSending(true);
    setResult(null);
    setVerifying(lead);
    try {
      await leadsAPI.sendVerification(lead.id);
      setOtpStep(true);
    } catch (e) {
      setResult({ success: false, message: 'Failed to send OTP' });
    }
    setSending(false);
  };

  const handleConfirmOTP = async () => {
    setSending(true);
    try {
      const res = await leadsAPI.confirmVerification(verifying.id, otpCode);
      setResult({ success: res.data.verified, message: res.data.verified ? 'Lead verified!' : 'Invalid OTP' });
      if (res.data.verified) { fetchLeads(); setVerifying(null); setOtpStep(false); setOtpCode(''); }
    } catch { setResult({ success: false, message: 'Verification failed' }); }
    setSending(false);
  };

  const closeModal = () => { setVerifying(null); setOtpStep(false); setOtpCode(''); setResult(null); };
  const pages = Math.ceil(total / 15);

  return (
    <Layout title="Lead Verification" subtitle="Verify leads via SMS OTP">
      {/* OTP Modal */}
      {verifying && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#2563eb,#4f46e5)'}}>
                <ShieldCheck size={18} className="text-white"/>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{verifying.name}</p>
                <p className="text-xs text-slate-400">{verifying.phone}</p>
              </div>
            </div>
            {result && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${result.success?'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-red-50 text-red-700 border border-red-200'}`}>
                {result.success ? <CheckCircle size={15}/> : <XCircle size={15}/>}
                {result.message}
              </div>
            )}
            {!otpStep ? (
              <>
                <p className="text-sm text-slate-600 mb-4">Send an OTP to <strong>{verifying.phone}</strong> to verify this lead.</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm">Cancel</button>
                  <button onClick={()=>handleSendOTP(verifying)} disabled={sending}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send size={14}/>{sending?'Sending...':'Send OTP'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-4">Enter the OTP sent to {verifying.phone}</p>
                <input value={otpCode} onChange={e=>setOtpCode(e.target.value)} placeholder="6-digit code"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-center tracking-widest font-bold focus:border-blue-500 outline-none mb-4"/>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm">Cancel</button>
                  <button onClick={handleConfirmOTP} disabled={sending||!otpCode.trim()}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                    {sending?'Verifying...':'Confirm OTP'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Leads', value: total, color: 'linear-gradient(135deg,#2563eb,#4f46e5)' },
            { label: 'Verified', value: leads.filter(l=>l.verification_status==='verified').length, color: 'linear-gradient(135deg,#059669,#0d9488)' },
            { label: 'Pending', value: leads.filter(l=>l.verification_status==='pending').length, color: 'linear-gradient(135deg,#d97706,#ea580c)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-4 relative overflow-hidden" style={{background: color}}>
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-20" style={{background:'rgba(255,255,255,0.3)'}}/>
              <p className="text-2xl font-bold text-white relative" style={{fontFamily:'Outfit,sans-serif'}}>{value}</p>
              <p className="text-xs relative" style={{color:'rgba(255,255,255,0.8)'}}>{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"/>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                : leads.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No leads found</td></tr>
                : leads.map(lead => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">{lead.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{lead.name}</p>
                          <p className="text-xs text-slate-400">{lead.service || 'No service'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-1"><Phone size={12} className="text-slate-400"/>{lead.phone}</td>
                    <td className="px-4 py-3 capitalize text-slate-500">{lead.status}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERIFY_COLORS[lead.verification_status]||'bg-slate-100 text-slate-600'}`}>
                        {lead.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.verification_status !== 'verified' ? (
                        <button onClick={()=>{ setVerifying(lead); setOtpStep(false); setResult(null); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                          <ShieldCheck size={12}/> Verify
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle size={12}/> Verified</span>
                      )}
                    </td>
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

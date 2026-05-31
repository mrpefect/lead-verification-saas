import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { adminAPI } from '../../utils/api';
import { Bot, Search, MessageSquare, Settings } from 'lucide-react';

export default function SAChatbots() {
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    adminAPI.getBusinesses({ limit: 50, search })
      .then(res => setBusinesses(res.data.businesses || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [search]);

  const handleSelect = async (biz) => {
    const res = await adminAPI.getBusiness(biz.id);
    setSelected(res.data);
  };

  return (
    <Layout title="Chatbots" subtitle="AI chatbot configurations across all businesses">
      <div className="flex gap-6" style={{minHeight: '500px'}}>
        {/* List */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search businesses..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:border-blue-500 outline-none"/>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
            : businesses.map(biz => (
              <div key={biz.id} onClick={()=>handleSelect(biz)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.id===biz.id?'bg-blue-50':''}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#2563eb,#4f46e5)'}}>
                  <Bot size={16} className="text-white"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{biz.name}</p>
                  <p className="text-xs text-slate-400 truncate">{biz.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6">
          {selected ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#2563eb,#4f46e5)'}}>
                  <Bot size={22} className="text-white"/>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900" style={{fontFamily:'Outfit,sans-serif'}}>{selected.name}</h3>
                  <p className="text-xs text-slate-500">{selected.email}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1.5">Welcome Message</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selected.ai_settings?.welcome_message || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1.5">AI Instructions</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{selected.ai_settings?.ai_instructions || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">FAQs ({selected.ai_settings?.faqs?.length || 0})</p>
                {(selected.ai_settings?.faqs || []).map((faq, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 mb-2 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-700">Q: {faq.question}</p>
                    <p className="text-xs text-slate-500 mt-1">A: {faq.answer}</p>
                  </div>
                ))}
                {!selected.ai_settings?.faqs?.length && <p className="text-sm text-slate-400">No FAQs configured</p>}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1.5">Widget Code</p>
                <pre className="bg-slate-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto">{`<script src="${process.env.REACT_APP_BACKEND_URL}/widget.js" data-business-id="${selected.id}" defer></script>`}</pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Bot size={48} className="mb-3 opacity-20"/>
              <p className="text-sm font-medium">Select a business</p>
              <p className="text-xs mt-1">View chatbot configuration</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

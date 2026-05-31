import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { adminAPI } from '../../utils/api';
import { Bot, Search, Key, Globe } from 'lucide-react';

export default function SAIntegrations() {
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getBusinesses({ limit: 50, search })
      .then(res => setBusinesses(res.data.businesses || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [search]);

  const handleSelect = async (biz) => {
    const res = await adminAPI.getBusiness(biz.id);
    setSelected(res.data);
  };

  const integrationFields = [
    { key: 'twilio_sid', label: 'Twilio SID' },
    { key: 'twilio_phone', label: 'Twilio Phone' },
    { key: 'twilio_verify_service', label: 'Verify Service' },
    { key: 'whatsapp_phone_id', label: 'WhatsApp Phone ID' },
    { key: 'calendly_url', label: 'Calendly URL' },
    { key: 'google_calendar_id', label: 'Google Calendar ID' },
  ];

  return (
    <Layout title="Integrations" subtitle="View integrations configured by each business">
      <div className="flex gap-6" style={{minHeight: '500px'}}>
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search businesses..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:border-blue-500 outline-none"/>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {businesses.map(biz => (
              <div key={biz.id} onClick={()=>handleSelect(biz)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${selected?.id===biz.id?'bg-blue-50':''}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100">
                  <Globe size={14} className="text-blue-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{biz.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{biz.subscription_plan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6">
          {selected ? (
            <div className="space-y-5">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900" style={{fontFamily:'Outfit,sans-serif'}}>{selected.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Integration overview</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2 flex items-center gap-1"><Key size={11}/> API Key</p>
                <code className="block bg-slate-900 text-green-400 rounded-lg px-3 py-2 text-xs font-mono break-all">{selected.api_key || 'Not generated'}</code>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {integrationFields.map(({key, label}) => (
                  <div key={key} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-0.5">{label}</p>
                    <p className="text-xs text-slate-700 truncate">{selected.integrations?.[key] || <span className="text-slate-300 italic">Not set</span>}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Key size={48} className="mb-3 opacity-20"/>
              <p className="text-sm font-medium">Select a business</p>
              <p className="text-xs mt-1">View integration settings</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

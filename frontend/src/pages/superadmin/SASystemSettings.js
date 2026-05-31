import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { SlidersHorizontal, Save, Zap, Mail, Globe, Shield } from 'lucide-react';

export default function SASystemSettings() {
  const [settings, setSettings] = useState({
    platform_name: 'LeadVerify AI',
    support_email: 'support@leadverify.ai',
    platform_url: '',
    max_leads_per_business: 10000,
    trial_days: 14,
    enable_ai_chatbot: true,
    enable_sms_verification: true,
    enable_whatsapp: true,
    maintenance_mode: false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/api/admin/system-settings')
      .then(res => setSettings(prev => ({ ...prev, ...res.data })))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/admin/system-settings', settings);
      setMsg('Settings saved successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch {}
    setSaving(false);
  };

  return (
    <Layout title="System Settings" subtitle="Platform-wide configuration">
      <div className="max-w-2xl space-y-6">
        {msg && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{msg}</div>}

        {/* General */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2" style={{fontFamily:'Outfit,sans-serif'}}>
            <Globe size={17} className="text-blue-600"/> General
          </h3>
          <div className="space-y-4">
            {[['platform_name','Platform Name','text'],['support_email','Support Email','email'],['platform_url','Platform URL','url']].map(([k,l,t]) => (
              <div key={k}>
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1.5">{l}</label>
                <input type={t} value={settings[k]||''} onChange={e=>setSettings({...settings,[k]:e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"/>
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1.5">Trial Days</label>
              <input type="number" value={settings.trial_days} onChange={e=>setSettings({...settings,trial_days:parseInt(e.target.value)})}
                className="w-32 px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none"/>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2" style={{fontFamily:'Outfit,sans-serif'}}>
            <Zap size={17} className="text-blue-600"/> Features
          </h3>
          <div className="space-y-4">
            {[
              ['enable_ai_chatbot','AI Chatbot','Enable AI chatbot for all businesses'],
              ['enable_sms_verification','SMS Verification','Enable Twilio SMS lead verification'],
              ['enable_whatsapp','WhatsApp Integration','Enable WhatsApp messaging'],
              ['maintenance_mode','Maintenance Mode','Put platform in maintenance mode'],
            ].map(([k,l,desc]) => (
              <div key={k} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{l}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings[k]||false} onChange={e=>setSettings({...settings,[k]:e.target.checked})} className="sr-only peer"/>
                  <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"/>
                </label>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm">
          <Save size={16}/>{saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </Layout>
  );
}

import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { integrationsAPI } from '../../utils/api';
import { Save, Key, Copy, RefreshCw, CheckCircle, XCircle, Phone, MessageCircle, Calendar, Webhook, TestTube } from 'lucide-react';

export default function Integrations() {
  const [data, setData] = useState({ integrations: {}, api_key: '', webhook_url: '' });
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    integrationsAPI.getIntegrations().then(res => {
      setData(res.data);
      setForm(res.data.integrations || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await integrationsAPI.updateIntegrations(form);
      setMsg('Integrations saved!');
      setTimeout(() => setMsg(''), 3000);
    } catch {}
    setSaving(false);
  };

  const handleTest = async (type) => {
    setTesting(true);
    setTestResult(null);
    try {
      if (type === 'twilio') {
        const res = await integrationsAPI.testTwilio();
        setTestResult(res.data);
      }
    } catch {
      setTestResult({ success: false, message: 'Connection test failed' });
    }
    setTesting(false);
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate API key? Existing webhook integrations will stop working.')) return;
    setRegenerating(true);
    try {
      const res = await integrationsAPI.regenerateApiKey();
      setData(prev => ({ ...prev, api_key: res.data.api_key }));
      setMsg('API key regenerated!');
      setTimeout(() => setMsg(''), 3000);
    } catch {}
    setRegenerating(false);
  };

  if (loading) return <Layout title="Integrations"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout title="Integrations" subtitle="Connect your tools">
      <div className="max-w-2xl space-y-6">
        {msg && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{msg}</div>}

        {/* API Keys */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{fontFamily: 'Outfit, sans-serif'}}>
            <Key size={16} className="text-blue-600" /> API Keys & Webhook
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1.5">API Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 truncate">
                  {data.api_key || 'Not configured'}
                </code>
                <button onClick={() => handleCopy(data.api_key, 'apikey')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 flex-shrink-0">
                  {copied === 'apikey' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
                <button onClick={handleRegenerate} disabled={regenerating} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 flex-shrink-0">
                  <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1.5">Webhook URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 truncate break-all">
                  {data.webhook_url || `${process.env.REACT_APP_BACKEND_URL}/api/leads/webhook/ingest`}
                </code>
                <button onClick={() => handleCopy(data.webhook_url, 'webhook')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 flex-shrink-0">
                  {copied === 'webhook' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700">
              <strong>Usage:</strong> Send POST to webhook URL with header <code className="bg-blue-100 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
              <br />Body: <code className="bg-blue-100 px-1 rounded text-xs">{'{"name":"John","phone":"+1234567890","service":"Consultation"}'}</code>
            </p>
          </div>
        </div>

        {/* Twilio */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{fontFamily: 'Outfit, sans-serif'}}>
            <Phone size={16} className="text-blue-600" /> Twilio SMS
          </h3>
          <div className="space-y-3">
            {[
              ['twilio_sid', 'Account SID', 'AC...'],
              ['twilio_token', 'Auth Token', 'secret'],
              ['twilio_phone', 'Phone Number', '+1234567890'],
              ['twilio_verify_service', 'Verify Service SID', 'VA...'],
            ].map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">{label}</label>
                <input
                  type={key.includes('token') ? 'password' : 'text'}
                  value={form[key] || ''}
                  onChange={e => setForm({...form, [key]: e.target.value})}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            ))}
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => handleTest('twilio')} disabled={testing}
                className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50">
                <TestTube size={14} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              {testResult && (
                <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                  {testResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{fontFamily: 'Outfit, sans-serif'}}>
            <MessageCircle size={16} className="text-green-600" /> WhatsApp Business
          </h3>
          <div className="space-y-3">
            {[
              ['whatsapp_token', 'Access Token', 'Token from Meta Business'],
              ['whatsapp_phone_id', 'Phone Number ID', 'From Meta Business Manager'],
            ].map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">{label}</label>
                <input
                  type={key.includes('token') ? 'password' : 'text'}
                  value={form[key] || ''}
                  onChange={e => setForm({...form, [key]: e.target.value})}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Calendly */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{fontFamily: 'Outfit, sans-serif'}}>
            <Calendar size={16} className="text-blue-600" /> Calendly
          </h3>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1">Calendly URL</label>
            <input
              type="url"
              value={form.calendly_url || ''}
              onChange={e => setForm({...form, calendly_url: e.target.value})}
              placeholder="https://calendly.com/your-link"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} data-testid="save-integrations-btn"
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm">
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Integrations'}
        </button>
      </div>
    </Layout>
  );
}

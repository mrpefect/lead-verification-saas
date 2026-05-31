import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { settingsAPI, formatError } from '../../utils/api';
import { Save, Building2, Globe, Phone, Tag, Clock } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', website: '', services: [] });
  const [hours, setHours] = useState({});
  const [newService, setNewService] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    settingsAPI.getSettings().then(res => {
      const s = res.data;
      setSettings(s);
      setForm({ name: s.name || '', email: s.email || '', phone: s.phone || '', website: s.website || '', services: s.services || [] });
      setHours(s.working_hours || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await settingsAPI.updateSettings(form);
      setMsg('Settings saved successfully!');
    } catch (err) {
      setError(formatError(err.response?.data?.detail));
    }
    setSaving(false);
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      await settingsAPI.updateWorkingHours(hours);
      setMsg('Working hours saved!');
    } catch {}
    setSavingHours(false);
  };

  const addService = () => {
    if (!newService.trim()) return;
    setForm(prev => ({ ...prev, services: [...prev.services, newService.trim()] }));
    setNewService('');
  };

  const removeService = (i) => {
    setForm(prev => ({ ...prev, services: prev.services.filter((_, idx) => idx !== i) }));
  };

  const updateHours = (day, field, value) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  if (loading) return <Layout title="Settings"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout title="Business Settings" subtitle="Manage your business profile">
      <div className="max-w-2xl space-y-6">
        {msg && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{msg}</div>}
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        {/* Business Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2" style={{fontFamily: 'Outfit, sans-serif'}}>
            <Building2 size={18} className="text-blue-600" /> Business Profile
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            {[
              ['name', 'Business Name', 'text', Building2],
              ['email', 'Email', 'email', null],
              ['phone', 'Phone', 'tel', Phone],
              ['website', 'Website', 'url', Globe],
            ].map(([key, label, type, Icon]) => (
              <div key={key}>
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key] || ''}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  data-testid={`settings-${key}`}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            ))}

            {/* Services */}
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1.5 flex items-center gap-1">
                <Tag size={12} /> Services
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.services.map((svc, i) => (
                  <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-100">
                    {svc}
                    <button type="button" onClick={() => removeService(i)} className="hover:text-red-500 ml-1">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newService}
                  onChange={e => setNewService(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())}
                  placeholder="Add a service..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none"
                />
                <button type="button" onClick={addService} className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50">Add</button>
              </div>
            </div>

            <button type="submit" disabled={saving} data-testid="save-settings-btn"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2" style={{fontFamily: 'Outfit, sans-serif'}}>
            <Clock size={18} className="text-blue-600" /> Working Hours
          </h3>
          <div className="space-y-3">
            {DAYS.map(day => {
              const h = hours[day] || { open: '09:00', close: '17:00', closed: false };
              return (
                <div key={day} className="flex items-center gap-4">
                  <label className="w-24 text-sm font-medium text-slate-700 capitalize">{day}</label>
                  <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={!h.closed} onChange={e => updateHours(day, 'closed', !e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    Open
                  </label>
                  {!h.closed && (
                    <>
                      <input type="time" value={h.open} onChange={e => updateHours(day, 'open', e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none" />
                      <span className="text-slate-400 text-sm">—</span>
                      <input type="time" value={h.close} onChange={e => updateHours(day, 'close', e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none" />
                    </>
                  )}
                  {h.closed && <span className="text-sm text-slate-400 italic">Closed</span>}
                </div>
              );
            })}
          </div>
          <button onClick={handleSaveHours} disabled={savingHours} className="mt-5 flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            <Save size={16} />
            {savingHours ? 'Saving...' : 'Save Hours'}
          </button>
        </div>
      </div>
    </Layout>
  );
}

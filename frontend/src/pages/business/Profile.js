import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { settingsAPI, authAPI } from '../../utils/api';
import { UserCircle, Building2, Lock, Save, CreditCard } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [pwForm, setPwForm] = useState({ new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    settingsAPI.getSettings().then(res => setBusiness(res.data)).catch(() => {});
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { setError('Passwords do not match'); return; }
    if (pwForm.new_password.length < 6) { setError('Min 6 characters'); return; }
    setSaving(true); setMsg(''); setError('');
    try {
      await authAPI.forgotPassword(user?.email);
      setMsg('Password reset link sent to your email!');
      setPwForm({ new_password: '', confirm: '' });
    } catch { setError('Failed to send reset email'); }
    setSaving(false);
  };

  return (
    <Layout title="Profile" subtitle="Your account & business info">
      <div className="max-w-xl space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
            style={{background:'linear-gradient(135deg,#2563eb,#4f46e5)'}}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900" style={{fontFamily:'Outfit,sans-serif'}}>{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              Business Owner
            </span>
          </div>
        </div>

        {/* Business Info */}
        {business && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{fontFamily:'Outfit,sans-serif'}}>
              <Building2 size={17} className="text-blue-600"/> Business Info
            </h3>
            <div className="space-y-2">
              {[['Business', business.name],['Email', business.email],['Phone', business.phone||'—'],['Website', business.website||'—'],['Plan', business.subscription_plan]].map(([l,v])=>(
                <div key={l} className="flex items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="w-24 text-xs font-semibold uppercase text-slate-400 tracking-wide">{l}</span>
                  <span className="text-sm text-slate-700">{v}</span>
                </div>
              ))}
            </div>
            <NavLink to="/settings" className="mt-4 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
              Edit business settings →
            </NavLink>
          </div>
        )}

        {/* Subscription */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CreditCard size={18} className="text-blue-600"/>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Subscription Plan</p>
              <p className="text-xs text-slate-500 capitalize">{business?.subscription_plan || 'starter'} · {business?.subscription_status || 'trial'}</p>
            </div>
          </div>
          <NavLink to="/billing" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
            Manage
          </NavLink>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{fontFamily:'Outfit,sans-serif'}}>
            <Lock size={17} className="text-blue-600"/> Reset Password
          </h3>
          {msg && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{msg}</div>}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[['new_password','New Password'],['confirm','Confirm Password']].map(([k,l])=>(
              <div key={k}>
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1.5">{l}</label>
                <input type="password" value={pwForm[k]} onChange={e=>setPwForm({...pwForm,[k]:e.target.value})} required
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"/>
              </div>
            ))}
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              <Save size={15}/>{saving?'Processing...':'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

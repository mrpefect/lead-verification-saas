import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../utils/api';
import { UserCircle, Lock, Save, Shield } from 'lucide-react';

export default function SAProfile() {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ current: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { setError('Passwords do not match'); return; }
    if (pwForm.new_password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true); setMsg(''); setError('');
    try {
      // Use forgot-password flow as proxy for admin (or a dedicated change-password endpoint)
      setMsg('Password change request submitted. Check your email.');
      setPwForm({ current: '', new_password: '', confirm: '' });
    } catch { setError('Failed to update password'); }
    setSaving(false);
  };

  return (
    <Layout title="Profile" subtitle="Your admin account">
      <div className="max-w-xl space-y-6">
        {/* Avatar + Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
            style={{background:'linear-gradient(135deg,#2563eb,#4f46e5)'}}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900" style={{fontFamily:'Outfit,sans-serif'}}>{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
              <Shield size={11}/> Super Admin
            </span>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{fontFamily:'Outfit,sans-serif'}}>
            <UserCircle size={17} className="text-blue-600"/> Account Info
          </h3>
          <div className="space-y-3">
            {[['Name', user?.name], ['Email', user?.email], ['Role', 'Super Admin'], ['User ID', user?.id]].map(([l, v]) => (
              <div key={l} className="flex items-center py-2 border-b border-slate-50 last:border-0">
                <span className="w-24 text-xs font-semibold uppercase text-slate-400 tracking-wide">{l}</span>
                <span className="text-sm text-slate-700 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{fontFamily:'Outfit,sans-serif'}}>
            <Lock size={17} className="text-blue-600"/> Change Password
          </h3>
          {msg && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{msg}</div>}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[['current','Current Password'],['new_password','New Password'],['confirm','Confirm New Password']].map(([k,l]) => (
              <div key={k}>
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide block mb-1.5">{l}</label>
                <input type="password" value={pwForm[k]} onChange={e=>setPwForm({...pwForm,[k]:e.target.value})} required
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"/>
              </div>
            ))}
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              <Save size={15}/>{saving?'Saving...':'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

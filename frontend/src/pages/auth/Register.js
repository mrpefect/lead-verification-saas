import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatError } from '../../utils/api';
import { Zap, Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', business_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(formatError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8" style={{fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900" style={{fontFamily: 'Outfit, sans-serif'}}>LeadVerify AI</h1>
            <p className="text-xs text-slate-500">CRM & Automation Platform</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-1" style={{fontFamily: 'Outfit, sans-serif'}}>Create your account</h2>
            <p className="text-sm text-slate-500">Start automating your lead management</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-testid="register-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-slate-500 block mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="John Smith"
                  required
                  data-testid="register-name"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-slate-500 block mb-1.5">Business Name</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.business_name}
                  onChange={e => setForm({...form, business_name: e.target.value})}
                  placeholder="Acme Corp"
                  data-testid="register-business"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-slate-500 block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="you@example.com"
                  required
                  data-testid="register-email"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-slate-500 block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="Min 6 characters"
                  required
                  data-testid="register-password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="register-submit"
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700" data-testid="go-to-login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

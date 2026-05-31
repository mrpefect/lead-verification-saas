import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, formatError } from '../../utils/api';
import { Zap, Eye, EyeOff, Mail, Lock, RefreshCw } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendInfo, setResendInfo] = useState('');
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResendInfo('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'super_admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      setError(formatError(detail));
      if (status === 403 && typeof detail === 'string' && detail.toLowerCase().includes('verify your email')) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!form.email) {
      setResendInfo('Please enter your email above first.');
      return;
    }
    setResending(true);
    setResendInfo('');
    try {
      const { data } = await authAPI.resendVerification(form.email);
      setResendInfo(data.message || 'Verification email sent.');
    } catch (err) {
      setResendInfo(formatError(err.response?.data?.detail));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4" style={{fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900" style={{fontFamily: 'Outfit, sans-serif'}}>LeadVerify AI</h1>
            <p className="text-xs text-slate-500">CRM & Automation Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-1" style={{fontFamily: 'Outfit, sans-serif'}}>Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-testid="login-error">
              {error}
            </div>
          )}

          {needsVerification && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid="needs-verification-block">
              <p className="text-sm text-amber-800 mb-2">
                Your email is not verified yet. Check your inbox for the verification link, or resend it below.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                data-testid="login-resend-verification-btn"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 hover:text-amber-950 disabled:opacity-50"
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
              {resendInfo && (
                <p className="mt-2 text-xs text-amber-700" data-testid="login-resend-info">{resendInfo}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  data-testid="login-email"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold tracking-wide uppercase text-slate-500">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••"
                  required
                  data-testid="login-password"
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
              data-testid="login-submit"
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700" data-testid="go-to-register">Create one</Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
          <p className="text-xs text-blue-700"><span className="font-semibold">Demo:</span> admin@leadverify.ai / Admin@12345</p>
        </div>
      </div>
    </div>
  );
}

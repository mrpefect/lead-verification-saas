import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { Zap, Mail, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(formatError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>LeadVerify AI</h1>
            <p className="text-xs text-slate-500">CRM & Automation Platform</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8" data-testid="forgot-password-card">
          {!submitted ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Forgot password?</h2>
                <p className="text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-testid="forgot-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold tracking-wide uppercase text-slate-500 block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      data-testid="forgot-email"
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="forgot-submit"
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm mt-2"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center" data-testid="forgot-success">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <MailCheck size={32} className="text-emerald-600" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Check your email</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-1">
                If an account exists for <span className="font-semibold text-slate-900">{email}</span>,
                you'll receive a password reset link shortly.
              </p>
              <p className="text-sm text-slate-500 mb-6">The link expires in 1 hour.</p>
              <Link
                to="/login"
                data-testid="forgot-back-to-login"
                className="inline-flex items-center justify-center w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Back to sign in
              </Link>
            </div>
          )}

          {!submitted && (
            <p className="mt-6 text-center text-sm text-slate-500">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:text-blue-700" data-testid="forgot-go-to-login">
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

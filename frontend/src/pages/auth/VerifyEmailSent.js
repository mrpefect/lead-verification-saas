import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { MailCheck, Zap, RefreshCw } from 'lucide-react';

export default function VerifyEmailSent() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!email) {
      setError('No email address found. Please register again.');
      return;
    }
    setSending(true);
    setMessage('');
    setError('');
    try {
      const { data } = await authAPI.resendVerification(email);
      setMessage(data.message || 'A new verification link has been sent.');
    } catch (err) {
      setError(formatError(err.response?.data?.detail));
    } finally {
      setSending(false);
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center" data-testid="verify-email-sent-card">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center">
            <MailCheck size={32} className="text-blue-600" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Check your email
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-1">
            We sent a verification link to
          </p>
          {email && (
            <p className="text-sm font-semibold text-slate-900 mb-4" data-testid="verify-email-target">{email}</p>
          )}
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Click the link in the email to activate your account. You won't be able to sign in until your email is verified.
          </p>

          {message && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700" data-testid="resend-success">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-testid="resend-error">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            data-testid="resend-verification-btn"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw size={15} className={sending ? 'animate-spin' : ''} />
            {sending ? 'Sending…' : 'Resend verification email'}
          </button>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Already verified?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700" data-testid="go-to-login-from-sent">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Didn't receive the email? Check your spam folder or click resend above.
        </p>
      </div>
    </div>
  );
}

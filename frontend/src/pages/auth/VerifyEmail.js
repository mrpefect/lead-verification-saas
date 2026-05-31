import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const ranRef = useRef(false);
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please use the link from your email.');
      return;
    }

    (async () => {
      try {
        const { data } = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully.');
        // Auto-redirect to login after 3s
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      } catch (err) {
        setStatus('error');
        setMessage(formatError(err.response?.data?.detail));
      }
    })();
  }, [token, navigate]);

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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center" data-testid="verify-email-card">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Loader2 size={32} className="text-blue-600 animate-spin" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="verify-status-verifying">
                Verifying your email…
              </h2>
              <p className="text-sm text-slate-500">Hang tight, this only takes a second.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-600" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="verify-status-success">
                Email verified!
              </h2>
              <p className="text-sm text-slate-600 mb-6">{message}</p>
              <p className="text-xs text-slate-400 mb-6">Redirecting to sign in…</p>
              <Link
                to="/login"
                data-testid="verify-success-login-btn"
                className="inline-flex items-center justify-center w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Continue to sign in
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
                <XCircle size={32} className="text-red-600" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="verify-status-error">
                Verification failed
              </h2>
              <p className="text-sm text-slate-600 mb-6" data-testid="verify-error-message">{message}</p>
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/login"
                  data-testid="verify-error-login-btn"
                  className="inline-flex items-center justify-center w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Go to sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center w-full py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Create a new account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

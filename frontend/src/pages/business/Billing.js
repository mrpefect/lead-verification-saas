import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { billingAPI } from '../../utils/api';
import { CreditCard, Check, Zap, ArrowUpRight, Clock, FileText } from 'lucide-react';

const PLAN_COLORS = {
  starter: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700' },
  growth: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  pro: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  enterprise: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
};

export default function Billing() {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState('');

  useEffect(() => {
    // Check if returning from Stripe
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      pollStatus(sessionId);
      // Clean URL
      window.history.replaceState({}, '', '/billing');
    }

    Promise.all([billingAPI.getPlans(), billingAPI.getSubscription(), billingAPI.getTransactions()])
      .then(([p, s, t]) => {
        setPlans(p.data.plans || []);
        setSubscription(s.data);
        setTransactions(t.data.transactions || []);
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pollStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) return;
    try {
      const res = await billingAPI.getCheckoutStatus(sessionId);
      if (res.data.payment_status === 'paid') {
        const s = await billingAPI.getSubscription();
        setSubscription(s.data);
        const t = await billingAPI.getTransactions();
        setTransactions(t.data.transactions || []);
        return;
      }
    } catch {}
    setTimeout(() => pollStatus(sessionId, attempts + 1), 2000);
  };

  const handleCheckout = async (planId) => {
    setCheckoutLoading(planId);
    try {
      const res = await billingAPI.createCheckout({ plan_id: planId, origin_url: window.location.origin });
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      alert('Failed to create checkout session. Please try again.');
    }
    setCheckoutLoading('');
  };

  if (loading) return <Layout title="Billing"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout title="Billing & Subscription" subtitle="Manage your plan">
      <div className="space-y-6">
        {/* Current Subscription */}
        {subscription && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1">Current Plan</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900" style={{fontFamily: 'Outfit, sans-serif'}}>{subscription.plan_name}</h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    subscription.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    subscription.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">${subscription.price}/month</p>
              </div>
              <CreditCard size={32} className="text-slate-300" />
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => {
            const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.starter;
            const isCurrent = subscription?.plan_id === plan.id;
            return (
              <div key={plan.id} className={`${colors.bg} rounded-xl border ${colors.border} p-5 relative`} data-testid={`plan-${plan.id}`}>
                {isCurrent && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span className="text-xs px-2.5 py-1 bg-emerald-600 text-white rounded-full font-semibold shadow-sm">Current</span>
                  </div>
                )}
                <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${colors.badge} px-2 py-0.5 rounded w-fit`}>{plan.name}</div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Outfit, sans-serif'}}>${plan.price}</span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <Check size={12} className="text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={checkoutLoading === plan.id || isCurrent}
                  data-testid={`checkout-${plan.id}`}
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-white/50 text-slate-400 cursor-default border border-slate-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  } disabled:opacity-50`}
                >
                  {checkoutLoading === plan.id ? 'Loading...' : isCurrent ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{fontFamily: 'Outfit, sans-serif'}}>
              <FileText size={16} className="text-slate-400" /> Transaction History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5 capitalize font-medium text-slate-900">{t.plan_name || t.plan_id}</td>
                      <td className="px-4 py-2.5">${t.amount}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          t.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          t.payment_status === 'initiated' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>{t.payment_status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">
                        <div className="flex items-center gap-1"><Clock size={10} />{t.created_at?.slice(0,10)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { DollarSign, TrendingUp, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';

const gradients = {
  blue:   'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
  green:  'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
  amber:  'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
  purple: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
};

export default function SAPayments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 15;

  useEffect(() => {
    // Fetch all payment transactions (admin view)
    api.get('/api/admin/payments', { params: { page, limit } })
      .then(res => setTransactions(res.data.transactions || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  const totalRevenue = transactions.filter(t => t.payment_status === 'paid').reduce((s, t) => s + (t.amount || 0), 0);
  const paidCount = transactions.filter(t => t.payment_status === 'paid').length;

  return (
    <Layout title="Payments" subtitle="Platform revenue & transaction history">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'green' },
            { label: 'Paid Transactions', value: paidCount, color: 'blue' },
            { label: 'All Transactions', value: transactions.length, color: 'purple' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-6 relative overflow-hidden" style={{background: gradients[color]}}>
              <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full opacity-20" style={{background:'rgba(255,255,255,0.3)'}}/>
              <p className="text-2xl font-bold text-white relative" style={{fontFamily:'Outfit,sans-serif'}}>{value}</p>
              <p className="text-sm relative" style={{color:'rgba(255,255,255,0.8)'}}>{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                : transactions.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No transactions yet</td></tr>
                : transactions.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.business_id?.slice(-8)}</td>
                    <td className="px-4 py-3 capitalize font-medium text-slate-900">{t.plan_name || t.plan_id}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">${t.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.payment_status==='paid'?'bg-emerald-100 text-emerald-700':t.payment_status==='initiated'?'bg-blue-100 text-blue-700':'bg-red-100 text-red-700'}`}>
                        {t.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{t.created_at?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

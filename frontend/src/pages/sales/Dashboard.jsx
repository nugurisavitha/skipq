import React, { useEffect, useState } from 'react';
import { FiDollarSign, FiLoader, FiTarget, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { salesAPI } from '../../services/api';

export default function SalesRepDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await salesAPI.getMyProfile();
        setData(res.data?.data || null);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6 flex items-center gap-2"><FiLoader className="animate-spin" /> Loading...</div>;
  if (!data?.rep) return <div className="p-6 text-gray-500">No sales profile found. Please contact your manager.</div>;

  const { rep, currentPeriod: c = {}, statements = [], periodMonth } = data;
  const total = (c.baseSalary || 0) + (c.commissionAmount || 0) + (c.activationBonusTotal || 0);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
        <FiDollarSign /> My Sales Dashboard
      </h1>
      <p className="text-gray-600 mb-6">Hi {rep.user?.name || 'there'}, here's your {periodMonth} snapshot.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card label="GMV This Month" value={`₹${(c.gmv || 0).toLocaleString()}`} icon={<FiTrendingUp />} />
        <Card label="Commission" value={`₹${(c.commissionAmount || 0).toLocaleString()}`} sub={`${c.gmvPercent || 0}% of GMV`} />
        <Card label="Activations" value={c.activations || 0} sub={`${(c.activationBonusPerUnit || 0).toLocaleString()} ea = ₹${(c.activationBonusTotal || 0).toLocaleString()}`} />
        <Card label="Est. Total Payout" value={`₹${total.toLocaleString()}`} sub={`Base ₹${(c.baseSalary || 0).toLocaleString()}`} highlight />
      </div>

      <div className="bg-white shadow rounded p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2"><FiTarget /> Monthly Target</h2>
          <span className="text-sm text-gray-500">₹{(c.gmv || 0).toLocaleString()} / ₹{(c.targetGmv || 0).toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="bg-blue-600 h-3" style={{ width: `${Math.min(100, c.attainmentPct || 0)}%` }} />
        </div>
        <p className="text-sm text-gray-600 mt-2">{(c.attainmentPct || 0).toFixed(1)}% attainment</p>
      </div>

      <div className="bg-white shadow rounded p-6">
        <h2 className="font-semibold mb-3">Recent Statements</h2>
        {statements.length === 0 ? (
          <p className="text-gray-500 text-sm">No statements yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Period</th>
                <th className="px-3 py-2 text-right">GMV</th>
                <th className="px-3 py-2 text-right">Commission</th>
                <th className="px-3 py-2 text-right">Bonus</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {statements.map((s) => (
                <tr key={s._id}>
                  <td className="px-3 py-2">{s.periodMonth}</td>
                  <td className="px-3 py-2 text-right">₹{(s.gmv || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">₹{(s.commissionAmount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">₹{(s.activationBonusTotal || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-semibold">₹{(s.totalPayout || 0).toLocaleString()}</td>
                  <td className="px-3 py-2">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, sub, icon, highlight }) {
  return (
    <div className={`rounded shadow p-4 ${highlight ? 'bg-blue-600 text-white' : 'bg-white'}`}>
      <div className={`text-xs uppercase tracking-wide ${highlight ? 'text-blue-100' : 'text-gray-500'} flex items-center gap-1`}>
        {icon}{label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className={`text-xs mt-1 ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>{sub}</div>}
    </div>
  );
}

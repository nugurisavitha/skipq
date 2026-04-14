import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiRefreshCw, FiDownload, FiPlay, FiCheck, FiLock, FiUnlock, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { salesAPI } from '../../services/api';

const TABS = [
  { key: 'draft', label: 'Draft' },
  { key: 'manager_approved', label: 'Manager Approved' },
  { key: 'finance_locked', label: 'Finance Locked' },
  { key: 'paid', label: 'Paid' },
  { key: 'all', label: 'All' },
];

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function SalesStatements() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('draft');
  const [periodMonth, setPeriodMonth] = useState(currentMonth());
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await salesAPI.listStatements({ periodMonth, status: tab });
      const d = res.data?.data?.statements || res.data?.statements || [];
      setItems(Array.isArray(d) ? d : []);
    } catch (e) {
      toast.error('Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab, periodMonth]);

  const generate = async () => {
    setBusy('generate');
    try {
      const res = await salesAPI.generateStatements({ periodMonth });
      const count = res.data?.data?.results?.length || 0;
      toast.success(`Generated/updated ${count} statements`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Generate failed');
    } finally {
      setBusy(null);
    }
  };

  const action = async (id, fn, label) => {
    setBusy(id);
    try {
      await fn(id);
      toast.success(label + ' done');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || label + ' failed');
    } finally {
      setBusy(null);
    }
  };

  const downloadCsv = async () => {
    try {
      // Use axios instance via salesAPI listStatements base — for CSV, hit the URL via fetch with auth
      const token = localStorage.getItem('token') || '';
      const url = (import.meta.env.VITE_API_URL || '/api') + `/sales/statements/export.csv?periodMonth=${periodMonth}&status=${tab}`;
      const r = await fetch(url, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sales-statements-${periodMonth}.csv`;
      a.click();
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const statusBadge = (s) => {
    const map = {
      draft: 'bg-gray-100 text-gray-700',
      manager_approved: 'bg-blue-100 text-blue-800',
      finance_locked: 'bg-amber-100 text-amber-800',
      paid: 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s] || 'bg-gray-100'}`}>{s}</span>;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link to="/admin/sales" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-1">
            <FiArrowLeft /> Sales People
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FiDollarSign /> Sales Statements
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          />
          <button onClick={generate} disabled={busy === 'generate'} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            <FiPlay /> Generate
          </button>
          <button onClick={downloadCsv} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
            <FiDownload /> CSV
          </button>
          <button onClick={load} className="p-1.5 border rounded hover:bg-gray-50"><FiRefreshCw /></button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600"><FiLoader className="animate-spin" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No statements for {periodMonth} ({tab}). Click "Generate" to create them.</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Rep</th>
                <th className="px-3 py-2 text-left">Period</th>
                <th className="px-3 py-2 text-right">Base</th>
                <th className="px-3 py-2 text-right">GMV</th>
                <th className="px-3 py-2 text-right">Commission</th>
                <th className="px-3 py-2 text-right">Activations</th>
                <th className="px-3 py-2 text-right">Bonus</th>
                <th className="px-3 py-2 text-right">Adjustments</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((s) => {
                const u = s.salesRep?.user || {};
                const disabled = busy === s._id;
                return (
                  <tr key={s._id}>
                    <td className="px-3 py-2">
                      <div className="font-medium">{u.name || '-'}</div>
                      <div className="text-xs text-gray-500">{s.salesRep?.employeeCode || u.email}</div>
                    </td>
                    <td className="px-3 py-2">{s.periodMonth}</td>
                    <td className="px-3 py-2 text-right">₹{(s.baseSalary || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">₹{(s.gmv || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">₹{(s.commissionAmount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{s.activations || 0}</td>
                    <td className="px-3 py-2 text-right">₹{(s.activationBonusTotal || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">₹{(s.adjustmentsTotal || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-semibold">₹{(s.totalPayout || 0).toLocaleString()}</td>
                    <td className="px-3 py-2">{statusBadge(s.status)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-1">
                      {s.status === 'draft' && (
                        <button disabled={disabled} onClick={() => action(s._id, salesAPI.managerApprove, 'Approve')} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                          <FiCheck /> Approve
                        </button>
                      )}
                      {s.status === 'manager_approved' && (
                        <button disabled={disabled} onClick={() => action(s._id, salesAPI.financeLock, 'Lock')} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50">
                          <FiLock /> Lock
                        </button>
                      )}
                      {s.status === 'finance_locked' && (
                        <>
                          <button disabled={disabled} onClick={() => action(s._id, salesAPI.markPaid, 'Mark paid')} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                            <FiDollarSign /> Paid
                          </button>
                          <button disabled={disabled} onClick={() => action(s._id, salesAPI.reopenStatement, 'Reopen')} className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50">
                            <FiUnlock /> Reopen
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

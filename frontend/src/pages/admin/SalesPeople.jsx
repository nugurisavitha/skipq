import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiDollarSign, FiPlus, FiSearch, FiLoader, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { salesAPI, adminAPI } from '../../services/api';

export default function SalesPeople() {
  const [loading, setLoading] = useState(true);
  const [reps, setReps] = useState([]);
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [active, setActive] = useState('true');

  const load = async () => {
    setLoading(true);
    try {
      const res = await salesAPI.listReps({ active });
      const d = res.data?.data?.reps || res.data?.reps || [];
      setReps(Array.isArray(d) ? d : []);
    } catch (e) {
      toast.error('Failed to load sales reps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [active]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return reps;
    return reps.filter((r) => {
      const u = r.user || {};
      return [u.name, u.email, u.phone, r.employeeCode, r.territory]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [q, reps]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FiDollarSign /> Sales People
        </h1>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
            <FiRefreshCw /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            <FiPlus /> Add Rep
          </button>
          <Link to="/admin/sales/statements" className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
            Statements
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone, code, territory..."
            className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={active} onChange={(e) => setActive(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
          <option value="">All</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600"><FiLoader className="animate-spin" /> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">{q ? 'No reps match your search.' : 'No sales reps yet. Click "Add Rep" to create one.'}</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Code</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Territory</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Base Salary</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">GMV %</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Activation</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Target</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-2">{r.employeeCode || '-'}</td>
                  <td className="px-4 py-2">{r.user?.name || '-'}</td>
                  <td className="px-4 py-2">{r.user?.email || '-'}</td>
                  <td className="px-4 py-2">{r.territory || '-'}</td>
                  <td className="px-4 py-2 text-right">₹{(r.baseSalary || 0).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{r.commissionPlan?.gmvPercent || 0}%</td>
                  <td className="px-4 py-2 text-right">₹{(r.commissionPlan?.activationBonus || 0).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">₹{(r.commissionPlan?.monthlyTargetGmv || 0).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    <Link to={`/admin/sales/${r._id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateRepModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}

function CreateRepModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    employeeCode: '',
    territory: '',
    baseSalary: 0,
    gmvPercent: 0,
    activationBonus: 0,
    monthlyTargetGmv: 0,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password || undefined,
        employeeCode: form.employeeCode || undefined,
        territory: form.territory || undefined,
        baseSalary: Number(form.baseSalary) || 0,
        gmvPercent: Number(form.gmvPercent) || 0,
        activationBonus: Number(form.activationBonus) || 0,
        monthlyTargetGmv: Number(form.monthlyTargetGmv) || 0,
        notes: form.notes || undefined,
      };
      await salesAPI.createRep(payload);
      onCreated?.();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create sales rep';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">Add Sales Executive</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Executive Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-gray-600">Full Name <span className="text-red-500">*</span></span>
                <input type="text" required value={form.name} onChange={(e) => upd('name', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="e.g. Priya Sharma" />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Email <span className="text-red-500">*</span></span>
                <input type="email" required value={form.email} onChange={(e) => upd('email', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="priya@skipq.com" />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Phone</span>
                <input type="tel" value={form.phone} onChange={(e) => upd('phone', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="+91..." />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Password</span>
                <input type="password" value={form.password} onChange={(e) => upd('password', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="Leave blank to auto-generate" />
              </label>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Employment & Territory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-gray-600">Employee Code</span>
                <input type="text" value={form.employeeCode} onChange={(e) => upd('employeeCode', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Territory</span>
                <input type="text" value={form.territory} onChange={(e) => upd('territory', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="e.g. Hyderabad North" />
              </label>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Compensation</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="block text-sm">
                <span className="text-gray-600">Base Salary</span>
                <input type="number" min="0" value={form.baseSalary} onChange={(e) => upd('baseSalary', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">GMV %</span>
                <input type="number" min="0" step="0.01" value={form.gmvPercent} onChange={(e) => upd('gmvPercent', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Activation Bonus</span>
                <input type="number" min="0" value={form.activationBonus} onChange={(e) => upd('activationBonus', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Monthly Target GMV</span>
                <input type="number" min="0" value={form.monthlyTargetGmv} onChange={(e) => upd('monthlyTargetGmv', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
              </label>
            </div>
          </div>
          <label className="block text-sm">
            <span className="text-gray-600">Notes</span>
            <textarea value={form.notes} onChange={(e) => upd('notes', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" rows="2" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Rep'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

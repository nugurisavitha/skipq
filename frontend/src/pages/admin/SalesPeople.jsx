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
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    employeeCode: '',
    territory: '',
    baseSalary: 0,
    gmvPercent: 0,
    activationBonus: 0,
    monthlyTargetGmv: 0,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingUsers(true);
      try {
        const res = await adminAPI.getUsers?.({ limit: 500 });
        const list = res?.data?.data?.users || res?.data?.users || [];
        setUsers(list);
      } catch (e) {
        // best effort
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.userId) return toast.error('Select a user');
    setSaving(true);
    try {
      await salesAPI.createRep(form);
      toast.success('Sales rep created');
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Add Sales Rep</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">User *</label>
            <select value={form.userId} onChange={setField('userId')} className="w-full border rounded px-3 py-2" required>
              <option value="">{loadingUsers ? 'Loading...' : 'Select a user'}</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name || u.email} ({u.email}) - {u.role}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">The user's role will be upgraded to "sales_rep".</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Employee Code</label>
              <input value={form.employeeCode} onChange={setField('employeeCode')} className="w-full border rounded px-3 py-2" placeholder="SR-001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Territory</label>
              <input value={form.territory} onChange={setField('territory')} className="w-full border rounded px-3 py-2" placeholder="Bangalore South" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Base Salary (₹/month)</label>
              <input type="number" min="0" value={form.baseSalary} onChange={setField('baseSalary')} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Target GMV (₹)</label>
              <input type="number" min="0" value={form.monthlyTargetGmv} onChange={setField('monthlyTargetGmv')} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GMV Commission %</label>
              <input type="number" min="0" max="100" step="0.1" value={form.gmvPercent} onChange={setField('gmvPercent')} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Activation Bonus (₹ per restaurant)</label>
              <input type="number" min="0" value={form.activationBonus} onChange={setField('activationBonus')} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={form.notes} onChange={setField('notes')} className="w-full border rounded px-3 py-2" rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { salesAPI } from '../../services/api';

export default function SalesRepDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await salesAPI.getRep(id);
      const d = res.data?.data || {};
      setData(d);
      if (d.rep) {
        setForm({
          employeeCode: d.rep.employeeCode || '',
          territory: d.rep.territory || '',
          baseSalary: d.rep.baseSalary || 0,
          gmvPercent: d.rep.commissionPlan?.gmvPercent || 0,
          activationBonus: d.rep.commissionPlan?.activationBonus || 0,
          monthlyTargetGmv: d.rep.commissionPlan?.monthlyTargetGmv || 0,
          notes: d.rep.notes || '',
          isActive: d.rep.isActive,
        });
      }
    } catch (e) {
      toast.error('Failed to load rep');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await salesAPI.updateRep(id, form);
      toast.success('Saved');
      setEditing(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    if (!window.confirm('Deactivate this sales rep?')) return;
    try {
      await salesAPI.deactivateRep(id);
      toast.success('Deactivated');
      load();
    } catch (e) {
      toast.error('Failed');
    }
  };

  if (loading) return <div className="p-6 flex items-center gap-2"><FiLoader className="animate-spin" /> Loading...</div>;
  if (!data?.rep) return <div className="p-6 text-gray-500">Rep not found.</div>;

  const { rep, restaurants = [] } = data;
  const u = rep.user || {};

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="p-6 max-w-5xl">
      <Link to="/admin/sales" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-3">
        <FiArrowLeft /> Back to Sales People
      </Link>

      <div className="bg-white shadow rounded p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{u.name || 'Unnamed'}</h1>
            <p className="text-gray-600">{u.email} {u.phone && '· ' + u.phone}</p>
            <p className="text-sm text-gray-500 mt-1">
              Code: {rep.employeeCode || '-'} · Status: <span className={rep.isActive ? 'text-green-600' : 'text-red-600'}>{rep.isActive ? 'Active' : 'Inactive'}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                  <FiSave /> Save
                </button>
                <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded">
                  <FiX /> Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
                  <FiEdit2 /> Edit
                </button>
                {rep.isActive && <button onClick={deactivate} className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50">Deactivate</button>}
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Employee Code"><input value={form.employeeCode} onChange={setField('employeeCode')} className="w-full border rounded px-3 py-2" /></Field>
            <Field label="Territory"><input value={form.territory} onChange={setField('territory')} className="w-full border rounded px-3 py-2" /></Field>
            <Field label="Base Salary (₹)"><input type="number" value={form.baseSalary} onChange={setField('baseSalary')} className="w-full border rounded px-3 py-2" /></Field>
            <Field label="Monthly Target GMV (₹)"><input type="number" value={form.monthlyTargetGmv} onChange={setField('monthlyTargetGmv')} className="w-full border rounded px-3 py-2" /></Field>
            <Field label="GMV Commission %"><input type="number" step="0.1" value={form.gmvPercent} onChange={setField('gmvPercent')} className="w-full border rounded px-3 py-2" /></Field>
            <Field label="Activation Bonus (₹ each)"><input type="number" value={form.activationBonus} onChange={setField('activationBonus')} className="w-full border rounded px-3 py-2" /></Field>
            <div className="col-span-2"><Field label="Notes"><textarea value={form.notes} onChange={setField('notes')} className="w-full border rounded px-3 py-2" rows={2} /></Field></div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 text-sm">
            <Stat label="Territory" value={rep.territory || '-'} />
            <Stat label="Base Salary" value={`₹${(rep.baseSalary || 0).toLocaleString()}`} />
            <Stat label="GMV %" value={`${rep.commissionPlan?.gmvPercent || 0}%`} />
            <Stat label="Activation Bonus" value={`₹${(rep.commissionPlan?.activationBonus || 0).toLocaleString()}`} />
            <Stat label="Monthly Target" value={`₹${(rep.commissionPlan?.monthlyTargetGmv || 0).toLocaleString()}`} />
            <Stat label="Manager" value={rep.manager?.name || '-'} />
            <Stat label="Joined" value={rep.joinedAt ? new Date(rep.joinedAt).toLocaleDateString() : '-'} />
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded p-6">
        <h2 className="text-lg font-semibold mb-3">Attributed Restaurants ({restaurants.length})</h2>
        {restaurants.length === 0 ? (
          <p className="text-gray-500 text-sm">No restaurants attributed yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Activated</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr></thead>
            <tbody className="divide-y">
              {restaurants.map((r) => (
                <tr key={r._id}>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">{r.activatedAt ? new Date(r.activatedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm"><span className="font-medium mb-1 block">{label}</span>{children}</label>
  );
}
function Stat({ label, value }) {
  return (
    <div><div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div><div className="font-medium">{value}</div></div>
  );
}

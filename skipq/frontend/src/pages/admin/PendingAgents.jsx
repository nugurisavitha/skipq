import React, { useEffect, useState } from 'react';
import { FiCheck, FiX, FiLoader, FiTruck, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { deliveryAPI } from '../../services/api';

export default function PendingAgents() {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await deliveryAPI.listPendingAgents();
      setAgents(res.data?.data || res.data?.agents || []);
    } catch (err) {
      toast.error('Failed to load pending agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const act = async (id, approve) => {
    setBusyId(id);
    try {
      let note = '';
      if (!approve) {
        note = window.prompt('Reason for rejection (optional):') || '';
      }
      await deliveryAPI.setAgentApproval(id, { status: approve ? 'approved' : 'rejected', note });
      setAgents((prev) => prev.filter((a) => a._id !== id));
      toast.success(approve ? 'Agent approved' : 'Agent rejected');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FiTruck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Pending Delivery Agents</h1>
        </div>
        <button onClick={fetchPending} className="p-2 text-gray-500 hover:text-primary"><FiRefreshCw /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><FiLoader className="animate-spin w-6 h-6 text-primary" /></div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm">
          No pending agent applications.
        </div>
      ) : (
        <ul className="space-y-3">
          {agents.map((a) => (
            <li key={a._id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{a.name}</p>
                <p className="text-sm text-gray-600">{a.email} · {a.phone}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {a.vehicleType || '—'} {a.vehicleNumber ? `· ${a.vehicleNumber}` : ''}
                  {a.rateCard ? ` · Rate: ₹${a.rateCard.baseFare} + ₹${a.rateCard.perKmRate}/km` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => act(a._id, false)}
                  disabled={busyId === a._id}
                  className="px-3 py-2 rounded-lg bg-red-50 text-red-700 font-medium flex items-center gap-1"
                >
                  <FiX /> Reject
                </button>
                <button
                  onClick={() => act(a._id, true)}
                  disabled={busyId === a._id}
                  className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1"
                >
                  <FiCheck /> Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

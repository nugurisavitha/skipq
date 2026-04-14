import React, { useEffect, useState } from 'react';
import { FiCheck, FiX, FiLoader, FiTruck, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { deliveryAPI } from '../../services/api';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

export default function PendingAgents() {
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [agents, setAgents] = useState([]);
  const [tab, setTab] = useState('pending');

  const load = async (status = tab) => {
    setLoading(true);
    try {
      const res = await deliveryAPI.listPendingAgents(status);
      const d = res.data?.data?.agents || res.data?.agents || res.data?.data || res.data || [];
      setAgents(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load delivery agents');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const act = async (id, approve) => {
    setActingId(id);
    try {
      const note = approve ? '' : (window.prompt('Optional rejection note') || '');
      await deliveryAPI.setAgentApproval(id, { status: approve ? 'approved' : 'rejected', note });
      toast.success(approve ? 'Agent approved' : 'Agent rejected');
      // Refresh current tab (agent will move between tabs)
      load(tab);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setActingId(null);
    }
  };

  const statusBadge = (s) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s] || 'bg-gray-100 text-gray-700'}`}>
        {s || 'unknown'}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FiTruck /> Delivery Agents
        </h1>
        <button
          onClick={() => load(tab)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-4 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <FiLoader className="animate-spin" /> Loading...
        </div>
      ) : agents.length === 0 ? (
        <div className="text-gray-500">No {tab === 'all' ? '' : tab} agents.</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Phone</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Joined</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((a) => (
                <tr key={a._id}>
                  <td className="px-4 py-2">{a.name || '-'}</td>
                  <td className="px-4 py-2">{a.email || '-'}</td>
                  <td className="px-4 py-2">{a.phone || '-'}</td>
                  <td className="px-4 py-2">{statusBadge(a.approvalStatus)}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    {a.approvalStatus !== 'approved' && (
                      <button
                        disabled={actingId === a._id}
                        onClick={() => act(a._id, true)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        <FiCheck /> Approve
                      </button>
                    )}
                    {a.approvalStatus !== 'rejected' && (
                      <button
                        disabled={actingId === a._id}
                        onClick={() => act(a._id, false)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        <FiX /> Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

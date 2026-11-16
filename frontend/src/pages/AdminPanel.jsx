import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { StatTile } from '../components/common/StatTile';
import { adminService, stationService } from '../services/api';
import {
  ShieldAlert,
  Users,
  UserCheck,
  Clock,
  Check,
  X,
  Plus,
  Trash2,
  Edit2,
  Server,
  Activity,
  AlertCircle
} from 'lucide-react';

const STATES = [
  'Assam',
  'Arunachal Pradesh',
  'Meghalaya',
  'Manipur',
  'Mizoram',
  'Nagaland',
  'Tripura',
  'Sikkim',
];

export const AdminPanel = () => {
  const { t } = useTranslation();
  const { user, isAdmin, isOwner } = useAuth();

  const [stats, setStats] = useState({
    total_accounts: 0,
    user_accounts: 0,
    admin_accounts: 0,
    pending_requests: 0,
    registered_stations: 0,
    active_alerts: 0,
    system_status: 'Operational',
  });

  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Add station form state
  const [newStation, setNewStation] = useState({
    name: '',
    state: 'Assam',
    latitude: '',
    longitude: '',
  });

  // Edit station modal state
  const [editingStation, setEditingStation] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setActionError('');
    try {
      const [statsData, stnData, usersData] = await Promise.all([
        adminService.getAdminStats(),
        stationService.getAll(),
        adminService.getUsers(),
      ]);
      setStats(statsData || {});
      setStations(stnData || []);
      setUsers(usersData || []);

      // If owner, also fetch admin approval requests
      if (isOwner) {
        try {
          const reqData = await adminService.getRequests();
          setRequests(reqData || []);
        } catch (err) {
          console.warn('Could not load admin requests:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load admin panel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, isOwner]);

  const handleApprove = async (id) => {
    setActionError('');
    setActionSuccess('');
    try {
      await adminService.approveRequest(id);
      setActionSuccess('Admin request approved successfully.');
      fetchAdminData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    setActionError('');
    setActionSuccess('');
    try {
      await adminService.rejectRequest(id);
      setActionSuccess('Admin request rejected.');
      fetchAdminData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Rejection failed');
    }
  };

  const handleAddStation = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!newStation.name || !newStation.latitude || !newStation.longitude) {
      setActionError('Please fill in all station fields.');
      return;
    }

    try {
      await stationService.create({
        name: newStation.name.trim(),
        state: newStation.state,
        latitude: parseFloat(newStation.latitude),
        longitude: parseFloat(newStation.longitude),
        status: 'online',
      });
      setActionSuccess(`Station ${newStation.name} added successfully.`);
      setNewStation({ name: '', state: 'Assam', latitude: '', longitude: '' });
      fetchAdminData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to add station');
    }
  };

  const handleDeleteStation = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove station "${name}"?`)) return;
    setActionError('');
    setActionSuccess('');
    try {
      await stationService.delete(id);
      setActionSuccess(`Station ${name} removed.`);
      fetchAdminData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to delete station');
    }
  };

  const handleUpdateStation = async (e) => {
    e.preventDefault();
    if (!editingStation) return;
    setActionError('');
    setActionSuccess('');

    try {
      await stationService.update(editingStation.id, {
        name: editingStation.name,
        state: editingStation.state,
        latitude: parseFloat(editingStation.latitude),
        longitude: parseFloat(editingStation.longitude),
        status: editingStation.status,
      });
      setActionSuccess(`Station ${editingStation.name} updated.`);
      setEditingStation(null);
      fetchAdminData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to update station');
    }
  };

  if (!isAdmin) {
    return (
      <Card className="text-center py-16">
        <ShieldAlert className="w-12 h-12 text-[#EF4444] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-ink">Restricted Administrator Area</h2>
        <p className="text-xs text-ink-soft mt-1">
          You must be logged in as an authorized administrator (@adm.com) to access this control portal.
        </p>
      </Card>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-accent" />
            <span>{t('nav.admin', 'Administrator Control Panel')}</span>
          </h2>
          <p className="text-xs text-ink-soft">
            Role: <b className="text-accent uppercase">{user?.role}</b> · System access control & station inventory management
          </p>
        </div>

        {isOwner && (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-accent/20 text-accent border border-accent/40">
            System Owner Authority
          </span>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 text-xs font-bold text-[#22C55E]">
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-[#EF4444]">
          {actionError}
        </div>
      )}

      {/* 4 Stats Tiles matching Phase 4 Page 10 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile
          label="Total Accounts"
          value={stats.total_accounts || 0}
          subtitle="registered platform accounts"
          icon={Users}
        />
        <StatTile
          label="User Accounts"
          value={stats.user_accounts || 0}
          subtitle="@NER.com operators"
          icon={UserCheck}
        />
        <StatTile
          label="Admin Accounts"
          value={stats.admin_accounts || 0}
          subtitle="@adm.com verified staff"
          icon={ShieldAlert}
        />
        <StatTile
          label="Pending Requests"
          value={stats.pending_requests || 0}
          subtitle="awaiting owner approval"
          icon={Clock}
          className={stats.pending_requests > 0 ? 'border-yellow-500/40' : ''}
        />
      </div>

      {/* Section 1: Admin Access Requests (Owner Only) */}
      <Card title="Admin Access Approval Requests" subtitle="Only the Owner Administrator can accept or reject new access requests">
        {isOwner ? (
          pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-ink-soft uppercase text-[11px] font-bold">
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Requested At</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="py-2.5 px-3 font-bold text-ink">{req.username}</td>
                      <td className="py-2.5 px-3 text-ink-soft">
                        {new Date(req.requested_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-500/20 text-[#FACC15]">
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-3 py-1 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-ink-soft hover:text-white border border-white/10 text-xs font-bold transition-colors"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-ink-soft py-2">No pending administrator requests currently.</p>
          )
        ) : (
          <p className="text-xs text-ink-soft py-2">
            Only the platform Owner administrator can approve or reject administrative requests.
          </p>
        )}
      </Card>

      {/* Section 2: Registered Accounts Management */}
      <Card title="Registered System Users & Administrators">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-ink-soft uppercase text-[11px] font-bold">
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Registered On</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 px-3 font-bold text-ink">{u.username}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        u.role === 'owner'
                          ? 'bg-accent/20 text-accent border border-accent/40'
                          : u.role === 'admin'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-white/10 text-ink-soft'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-ink-soft">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[#22C55E] font-bold">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 3: Monitoring Station Management */}
      <Card title="Monitoring Station Management" subtitle="Add, update, or remove physical monitoring stations">
        {/* Add Station Form */}
        <form onSubmit={handleAddStation} className="p-4 rounded-2xl bg-[#0D1829] border border-white/10 mb-5">
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-accent" />
            <span>Add New Monitoring Station</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">
                Station Name
              </label>
              <input
                type="text"
                placeholder="e.g. Haflong"
                value={newStation.name}
                onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                required
                className="w-full bg-[#0A1220] border border-white/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">State</label>
              <select
                value={newStation.state}
                onChange={(e) => setNewStation({ ...newStation, state: e.target.value })}
                className="w-full bg-[#0A1220] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-accent"
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                placeholder="25.18"
                value={newStation.latitude}
                onChange={(e) => setNewStation({ ...newStation, latitude: e.target.value })}
                required
                className="w-full bg-[#0A1220] border border-white/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                placeholder="93.02"
                value={newStation.longitude}
                onChange={(e) => setNewStation({ ...newStation, longitude: e.target.value })}
                required
                className="w-full bg-[#0A1220] border border-white/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-extrabold shadow-md shadow-accent/25 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Station</span>
            </button>
          </div>
        </form>

        {/* Stations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-ink-soft uppercase text-[11px] font-bold">
                <th className="py-2.5 px-3">Station Name</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stations.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.03]">
                  <td className="py-2.5 px-3 font-bold text-ink">{s.name}</td>
                  <td className="py-2.5 px-3 text-ink-soft font-semibold">{s.state}</td>
                  <td className="py-2.5 px-3 text-ink-soft font-mono">
                    {s.latitude.toFixed(2)}°N, {s.longitude.toFixed(2)}°E
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[#22C55E] font-bold uppercase text-[11px]">
                      {s.status || 'online'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1.5">
                    <button
                      onClick={() => setEditingStation(s)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-ink-soft hover:text-white transition-colors"
                      title="Edit station"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStation(s.id, s.name)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[#EF4444] transition-colors"
                      title="Delete station"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Station Modal */}
      {editingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#101C30] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-ink">Edit Station: {editingStation.name}</h3>
            <form onSubmit={handleUpdateStation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1">Station Name</label>
                <input
                  type="text"
                  value={editingStation.name}
                  onChange={(e) =>
                    setEditingStation({ ...editingStation, name: e.target.value })
                  }
                  required
                  className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1">State</label>
                <select
                  value={editingStation.state}
                  onChange={(e) =>
                    setEditingStation({ ...editingStation, state: e.target.value })
                  }
                  className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-accent"
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editingStation.latitude}
                    onChange={(e) =>
                      setEditingStation({ ...editingStation, latitude: e.target.value })
                    }
                    required
                    className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editingStation.longitude}
                    onChange={(e) =>
                      setEditingStation({ ...editingStation, longitude: e.target.value })
                    }
                    required
                    className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-ink-soft hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-xs font-bold text-white transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Status Banner */}
      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs text-ink-soft">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-accent" />
          <span>System Environment: <b>{stats.system_status}</b></span>
        </div>
        <span className="text-[#22C55E] font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
          <span>Online</span>
        </span>
      </div>
    </div>
  );
};

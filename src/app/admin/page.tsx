'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Crown,
  Clock,
  Ticket as TicketIcon,
  Users,
  ShieldCheck,
  CheckCircle2,
  Building,
  PlusCircle,
  Search,
  Globe,
  Layers,
  Trash2,
  Lightbulb,
  UserCheck,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { currentUser, isAuthenticated, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role || 'GUEST_USER';

  const [metrics, setMetrics] = useState<any>({});
  const [teams, setTeams] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Predefined Websites & Modules State
  const [targetWebsites, setTargetWebsites] = useState<any[]>([]);
  const [targetModules, setTargetModules] = useState<any[]>([]);
  const [newWebName, setNewWebName] = useState('');
  const [newWebUrl, setNewWebUrl] = useState('');
  const [newModName, setNewModName] = useState('');
  const [newModCategory, setNewModCategory] = useState('');

  // Subcontractor Team Form State
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  // Timesheet Filter
  const [timeFilter, setTimeFilter] = useState('');

  const fetchConfigOptions = async () => {
    try {
      const res = await fetch('/api/v1/config/options', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.websites) setTargetWebsites(data.websites);
      if (data.modules) setTargetModules(data.modules);
    } catch (e) {
      console.error('Failed to fetch config options:', e);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/v1/recommendations', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.recommendations) setRecommendations(data.recommendations);
    } catch (e) {
      console.error('Failed to fetch recommendations in admin:', e);
    }
  };

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [resAdmin, resTeams, resTickets, resUsers] = await Promise.all([
        fetch('/api/v1/admin/metrics', { headers }),
        fetch('/api/v1/teams', { headers }),
        fetch('/api/v1/tickets', { headers }),
        fetch('/api/v1/admin/users', { headers }),
      ]);

      const dataAdmin = await resAdmin.json();
      const dataTeams = await resTeams.json();
      const dataTickets = await resTickets.json();
      const dataUsers = await resUsers.json();

      if (dataAdmin.metrics) setMetrics(dataAdmin.metrics);
      if (dataTeams.teams) setTeams(dataTeams.teams);
      if (dataTickets.tickets) setTickets(dataTickets.tickets);
      if (dataUsers.users) setUsers(dataUsers.users);
      fetchConfigOptions();
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to fetch admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, isAuthenticated]);

  const handleAssignTeamToRec = async (recId: string, teamId: string) => {
    try {
      await fetch(`/api/v1/recommendations/${recId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ teamId: teamId || null, status: 'IN_DEVELOPMENT' }),
      });
      fetchRecommendations();
    } catch (e) {
      console.error('Assign team failed:', e);
    }
  };

  const handleAssignSpecialistToRec = async (recId: string, userId: string) => {
    try {
      let targetTeamId = undefined;
      if (userId) {
        const found = users.find((u) => u.id === userId);
        if (found?.teamId) targetTeamId = found.teamId;
      }
      await fetch(`/api/v1/recommendations/${recId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ assignedToId: userId || null, teamId: targetTeamId, status: 'IN_DEVELOPMENT' }),
      });
      fetchRecommendations();
    } catch (e) {
      console.error('Assign specialist failed:', e);
    }
  };

  const handleUpdateRecStatus = async (recId: string, status: string) => {
    try {
      await fetch(`/api/v1/recommendations/${recId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      fetchRecommendations();
    } catch (e) {
      console.error('Update recommendation status failed:', e);
    }
  };

  const handleConvertRecToTicket = async (recId: string, teamId?: string, assignedToId?: string) => {
    try {
      const res = await fetch(`/api/v1/recommendations/${recId}/convert-to-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ teamId, assignedToId }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        alert(`Suggestion successfully converted to active ticket ${data.ticket.ticketNumber}!`);
        fetchRecommendations();
        fetchData();
      } else {
        alert(data.message || 'Failed to convert suggestion to ticket.');
      }
    } catch (e: any) {
      console.error('Convert to ticket failed:', e);
      alert('Convert to ticket error: ' + (e.message || 'Failed to convert'));
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role: newRole }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update user role:', err);
    }
  };

  const handleAddTeamToUser = async (userId: string, teamId: string) => {
    if (!teamId) return;
    try {
      await fetch(`/api/v1/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to add user to team:', err);
    }
  };

  const handleRemoveTeamFromUser = async (userId: string, teamId: string) => {
    try {
      await fetch(`/api/v1/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to remove user from team:', err);
    }
  };

  const handleAddTargetWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebName.trim()) return;
    try {
      await fetch('/api/v1/config/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: newWebName, url: newWebUrl }),
      });
      setNewWebName('');
      setNewWebUrl('');
      fetchConfigOptions();
    } catch (e) {
      console.error('Failed to add website:', e);
    }
  };

  const handleDeleteTargetWebsite = async (id: string) => {
    try {
      await fetch(`/api/v1/config/websites/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      fetchConfigOptions();
    } catch (e) {
      console.error('Failed to delete website:', e);
    }
  };

  const handleAddTargetModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModName.trim()) return;
    try {
      await fetch('/api/v1/config/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: newModName, category: newModCategory }),
      });
      setNewModName('');
      setNewModCategory('');
      fetchConfigOptions();
    } catch (e) {
      console.error('Failed to add module:', e);
    }
  };

  const handleDeleteTargetModule = async (id: string) => {
    try {
      await fetch(`/api/v1/config/modules/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      fetchConfigOptions();
    } catch (e) {
      console.error('Failed to delete module:', e);
    }
  };

  if (!isAuthenticated || (currentRole !== 'SUPER_ADMIN' && currentRole !== 'MANAGER')) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-lg shadow-purple-600/30">
            <Crown className="w-7 h-7 text-amber-300" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Super Admin Executive Console is restricted to Level 4 Super Administrators (`kavita.reddy@platformglobal.org`) and Level 3 Managers.
          </p>
          <a
            href="/login"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all block"
          >
            Sign In with Admin Account
          </a>
        </div>
      </div>
    );
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      await fetch('/api/v1/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: teamName, description: teamDesc }),
      });
      setTeamName('');
      setTeamDesc('');
      setShowTeamModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create team:', err);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"?`)) return;
    try {
      await fetch(`/api/v1/teams/${teamId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const workLogs = metrics.recentWorkLogs || [];
  const filteredLogs = workLogs.filter((log: any) => {
    if (!timeFilter) return true;
    const q = timeFilter.toLowerCase();
    return (
      (log.user?.name || '').toLowerCase().includes(q) ||
      (log.ticket?.ticketNumber || '').toLowerCase().includes(q) ||
      (log.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#c16d18] to-[#d97d20] text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white border border-white/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 backdrop-blur-xs">
              <Crown className="w-3.5 h-3.5" /> Level 4 Super Admin Control Panel
            </span>
            <span className="text-slate-300 text-xs font-medium">Platform Audit & Subcontractor Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Platform Analytics & Work Hours Audit
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm max-w-2xl">
            Monitor real-time system metrics, review logged subcontractor work hours, manage engineering teams, and ensure platform SLA compliance.
          </p>
        </div>

        <button
          onClick={() => setShowTeamModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#c16d18]/30 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Team</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tickets</span>
            <TicketIcon className="w-5 h-5 text-[#c16d18]" />
          </div>
          <p className="text-3xl font-black text-slate-900">{metrics.totalTickets || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium">Across all client websites</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Tickets</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600">
            {metrics.approvedTickets ?? (metrics.totalTickets ? metrics.totalTickets - (metrics.pendingApprovalTickets || 0) : 0)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Approved by managers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved Tickets</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{metrics.completedTickets || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium">Issues successfully resolved</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Teams</span>
            <Building className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{metrics.totalTeams || teams.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">Subcontractor units</p>
        </div>
      </div>

      {/* User Accounts & Role Governance Section */}
      <div className="bg-white rounded-2xl border border-purple-200 shadow-xs overflow-hidden space-y-4">
        <div className="p-6 bg-purple-50/70 border-b border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>User Accounts & Role Governance Desk</span>
            </h2>
            <p className="text-xs text-slate-500">
              Super Admin Control: Self-registered users default to GUEST_USER. Assign elevated role levels below.
            </p>
          </div>
          <span className="bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shrink-0">
            {users.length} Users Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">User Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Job Title</th>
                <th className="p-4">Assigned Role Level</th>
                <th className="p-4 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    No users found in database.
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <img
                        src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=c16d18&color=fff`}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <span>{u.name}</span>
                    </td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4 text-slate-500">{u.jobTitle || 'Portal User'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                        u.role === 'MANAGER' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          u.role === 'IT_SOFTWARE' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                            'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {currentRole === 'SUPER_ADMIN' ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                        >
                          <option value="GUEST_USER">Level 1: Guest User</option>
                          <option value="IT_SOFTWARE">Level 2: IT Specialist</option>
                          <option value="MANAGER">Level 3: Manager</option>
                          <option value="SUPER_ADMIN">Level 4: Super Admin</option>
                        </select>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">Super Admin Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Suggestions & SLA Assignment Desk */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden space-y-4">
        <div className="p-6 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#c16d18]" />
              <span>Feature Suggestions & SLA Assignment Desk</span>
            </h2>
            <p className="text-xs text-slate-500">
              Manager & Super Admin Control: Review submitted feature suggestions, update dev status, assign subcontractor team/specialist, or convert directly into an active support ticket.
            </p>
          </div>
          <span className="bg-[#c16d18] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shrink-0">
            {recommendations.length} Suggestions Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Title & Details</th>
                <th className="p-4">Platform / Module</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assign Operational Team</th>
                <th className="p-4">Assign IT Specialist</th>
                <th className="p-4 text-right">Convert to Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recommendations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No feature suggestions submitted yet.
                  </td>
                </tr>
              ) : (
                recommendations.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <p className="font-extrabold text-slate-900">{rec.title}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-xs">{rec.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">By: {rec.author?.name || 'Guest User'} • Upvotes: {rec.upvotes}</p>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {rec.websiteName}
                      <span className="block text-[10px] text-slate-400">{rec.moduleName}</span>
                    </td>
                    <td className="p-4">
                      <select
                        value={rec.status}
                        onChange={(e) => handleUpdateRecStatus(rec.id, e.target.value)}
                        className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-none"
                      >
                        <option value="SUBMITTED">Submitted</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="PLANNED">Planned</option>
                        <option value="IN_DEVELOPMENT">In Development</option>
                        <option value="IMPLEMENTED">Implemented</option>
                        <option value="DECLINED">Declined</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={rec.teamId || ''}
                        onChange={(e) => handleAssignTeamToRec(rec.id, e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl font-bold bg-white text-xs text-slate-800"
                      >
                        <option value="">-- No Team --</option>
                        {teams.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={rec.assignedToId || ''}
                        onChange={(e) => handleAssignSpecialistToRec(rec.id, e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl font-bold bg-white text-xs text-slate-800"
                      >
                        <option value="">-- Unassigned --</option>
                        {users
                          .filter((u: any) => u.role === 'IT_SOFTWARE' || u.role === 'MANAGER' || u.role === 'SUPER_ADMIN')
                          .filter((u: any) => !rec.teamId || u.teamId === rec.teamId || u.teams?.some((t: any) => t.id === rec.teamId))
                          .map((u: any) => {
                            const userTeam = teams.find((t: any) => t.id === u.teamId || t.members?.some((m: any) => m.id === u.id));
                            return (
                              <option key={u.id} value={u.id}>
                                {u.name} {userTeam ? `[Team: ${userTeam.name}]` : `(${u.jobTitle || 'IT Specialist'})`}
                              </option>
                            );
                          })}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      {rec.status === 'IN_DEVELOPMENT' || rec.status === 'IMPLEMENTED' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Converted</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConvertRecToTicket(rec.id, rec.teamId, rec.assignedToId)}
                          className="px-3 py-1.5 bg-[#c16d18] hover:bg-[#a35810] text-white text-[11px] font-bold rounded-xl flex items-center gap-1 shadow-xs transition-all ml-auto"
                        >
                          <TicketIcon className="w-3.5 h-3.5" />
                          <span>Convert Ticket</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Websites & Target Modules Predefined Config Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Predefined Target Websites */}
        <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#c16d18]" />
                <span>Predefined Projects & Portals</span>
              </h2>
              <p className="text-xs text-slate-500">Configured by Admin/Manager for Raise Ticket & Suggestion dropdowns</p>
            </div>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300/60">
              {targetWebsites.length} Active
            </span>
          </div>

          {/* Add Website Form */}
          <form onSubmit={handleAddTargetWebsite} className="flex gap-2">
            <input
              type="text"
              required
              value={newWebName}
              onChange={(e) => setNewWebName(e.target.value)}
              placeholder="Website Name (e.g. Acme Billing Portal)"
              className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18]/40 focus:outline-none"
            />
            <input
              type="text"
              value={newWebUrl}
              onChange={(e) => setNewWebUrl(e.target.value)}
              placeholder="URL (optional)"
              className="hidden sm:block w-36 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18]/40 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white text-xs font-extrabold shadow-xs transition-all shrink-0"
            >
              + Add
            </button>
          </form>

          {/* Websites List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {targetWebsites.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="space-y-0.5 truncate">
                  <p className="font-extrabold text-slate-900 truncate">{w.name}</p>
                  {w.url && <p className="text-[10px] text-slate-400 font-mono truncate">{w.url}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTargetWebsite(w.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0 ml-2"
                  title="Delete Website"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Predefined Target Modules */}
        <div className="bg-white rounded-2xl border border-blue-200/80 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Predefined Target Modules & Features</span>
              </h2>
              <p className="text-xs text-slate-500">Configured by Admin/Manager for Raise Ticket & Suggestion dropdowns</p>
            </div>
            <span className="bg-blue-100 text-blue-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-300/60">
              {targetModules.length} Active
            </span>
          </div>

          {/* Add Module Form */}
          <form onSubmit={handleAddTargetModule} className="flex gap-2">
            <input
              type="text"
              required
              value={newModName}
              onChange={(e) => setNewModName(e.target.value)}
              placeholder="Module Name (e.g. Auth & SSO)"
              className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-xs transition-all shrink-0"
            >
              + Add
            </button>
          </form>

          {/* Modules List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {targetModules.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <p className="font-extrabold text-slate-900 truncate">{m.name}</p>
                <button
                  type="button"
                  onClick={() => handleDeleteTargetModule(m.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0 ml-2"
                  title="Delete Module"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subcontractor Work Logs Timesheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Work Log Audit Timesheet</span>
            </h2>
            <p className="text-xs text-slate-500">Live billable hours recorded by IT engineering staff</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              placeholder="Search engineer, ticket #..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Engineer / Staff</th>
                <th className="p-4">Ticket Number</th>
                <th className="p-4">Work Description</th>
                <th className="p-4">Hours Logged</th>
                <th className="p-4">Log Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                    Loading timesheet audit logs from database...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    No work logs found. IT staff can log work hours directly inside assigned tickets.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{log.user?.name || 'IT Staff'}</td>
                    <td className="p-4 font-mono font-bold text-[#c16d18]">{log.ticket?.ticketNumber || 'TKT-1001'}</td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{log.description}</td>
                    <td className="p-4 font-black text-blue-600">{log.hoursSpent} hrs</td>
                    <td className="p-4 text-slate-400">{new Date(log.createdAt || Date.now()).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTeam} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Add New Team</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Team Name</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Database Optimization Subcontractor"
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                placeholder="Responsibilities, scope, and technical stack..."
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white text-xs font-bold shadow-md"
              >
                Create Team
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

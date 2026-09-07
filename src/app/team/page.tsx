'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { teamApi } from '@/services/api/team.api';
import { ticketApi } from '@/services/api/ticket.api';
import {
  Users,
  Building,
  Wrench,
  Clock,
  ChevronRight,
  ShieldCheck,
  Ticket as TicketIcon,
  PlusCircle,
  Trash2,
} from 'lucide-react';

export default function TeamPage() {
  const { currentUser, isAuthenticated, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role;

  const [teams, setTeams] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Add Member Modal State
  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState<any | null>(null);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<string>('');
  const [addingMember, setAddingMember] = useState<boolean>(false);
  const [seenTicketIds, setSeenTicketIds] = useState<Set<string>>(new Set());
  const [workDeskTab, setWorkDeskTab] = useState<'ACTIVE' | 'PENDING_TESTING'>('ACTIVE');

  useEffect(() => {
    if (currentUser?.id) {
      try {
        const raw = localStorage.getItem(`seen_tickets_${currentUser.id}`) || '[]';
        const list = JSON.parse(raw);
        setSeenTicketIds(new Set(list));
      } catch (e) { }
    }
  }, [currentUser]);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [dataTeams, dataTickets, dataUsers] = await Promise.all([
        teamApi.getTeams(),
        ticketApi.getAll(),
        teamApi.getUsers(),
      ]);

      if (dataTeams.teams) setTeams(dataTeams.teams);
      if (dataTickets.tickets) setTickets(dataTickets.tickets);
      if (dataUsers.users) setUsers(dataUsers.users);
    } catch (err) {
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, isAuthenticated]);

  const handleAddMember = async () => {
    if (!selectedTeamForAdd || !selectedUserIdToAdd) return;
    setAddingMember(true);
    try {
      const { apiClient } = await import('@/lib/apiClient');
      await apiClient(`/api/v1/teams/${selectedTeamForAdd.id}/members`, {
        method: 'POST',
        body: { userId: selectedUserIdToAdd },
      });
      setSelectedTeamForAdd(null);
      setSelectedUserIdToAdd('');
      fetchData();
    } catch (err) {
      console.error('Failed to add member to team:', err);
    } finally {
      setAddingMember(false);
    }
  };

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await teamApi.createTeam({ name: newTeamName, description: newTeamDesc });
      setNewTeamName('');
      setNewTeamDesc('');
      setShowCreateTeamModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create team:', err);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete the team "${teamName}"?`)) return;
    try {
      const { apiClient } = await import('@/lib/apiClient');
      await apiClient(`/api/v1/teams/${teamId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      const { apiClient } = await import('@/lib/apiClient');
      await apiClient(`/api/v1/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to remove member from team:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#c16d18] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-lg shadow-[#c16d18]/30">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Sign In Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The IT Work Desk & Teams overview is restricted to authenticated IT technical staff, Managers, and Administrators.
          </p>
          <Link
            href="/login"
            className="w-full py-3 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white font-bold text-xs shadow-md transition-all block"
          >
            Log In to Access Work Desk
          </Link>
        </div>
      </div>
    );
  }

  if (currentUser?.role === 'GUEST_USER') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-amber-200 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-2xl mx-auto border border-amber-300">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The IT Work Desk & Teams overview is restricted to authenticated portal staff. Normal guest users do not have permission to access internal team desks.
          </p>
          <Link
            href="/tickets"
            className="w-full py-3 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white font-bold text-xs shadow-md transition-all block"
          >
            Return to Tickets Portal
          </Link>
        </div>
      </div>
    );
  }

  const isITSpecialist = currentUser?.role === 'IT_SOFTWARE';
  const activeAssignedTickets = tickets.filter(
    (t) =>
      (t.assignedToId === currentUser?.id || ((currentUser as any)?.teamId && t.teamId === (currentUser as any)?.teamId)) &&
      ['ASSIGNED', 'IN_PROGRESS', 'NEED_MORE_DETAILS', 'APPROVED', 'SUBMITTED'].includes(t.status)
  );

  const pendingTestingTickets = tickets.filter(
    (t) =>
      (t.assignedToId === currentUser?.id || ((currentUser as any)?.teamId && t.teamId === (currentUser as any)?.teamId)) &&
      t.status === 'PENDING_TESTING'
  );

  const assignedTickets = workDeskTab === 'ACTIVE' ? activeAssignedTickets : pendingTestingTickets;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#c16d18] to-[#d97d20] text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white border border-white/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 backdrop-blur-xs">
              <Users className="w-3.5 h-3.5" />
              {isITSpecialist ? 'IT Team Work Desk' : 'Teams Management'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isITSpecialist ? 'IT Operations & Teams' : 'Teams & Resource Roster'}
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm max-w-2xl">
            {isITSpecialist
              ? 'View assigned technical tickets, log work hours, update bug investigation statuses, and review active subcontractor teams.'
              : 'Manage engineering teams, assign technical specialists to subcontractor units, and monitor active operational rosters.'}
          </p>
        </div>

        {isITSpecialist ? (
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 text-center shrink-0">
            <p className="text-2xl font-black text-blue-300">{assignedTickets.length}</p>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Tickets Assigned to You</p>
          </div>
        ) : (
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 text-center shrink-0">
            <p className="text-2xl font-black text-amber-300">{teams.length}</p>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Active Teams</p>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      {isITSpecialist ? (
        /* IT Specialist Split View: My Assigned Work Desk on Left (7 cols), Subcontractor Teams on Right (5 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: My Assigned Tickets (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>My Assigned Technical Work Desk</span>
                </h2>

                <div className="flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-300/60">
                  <button
                    onClick={() => setWorkDeskTab('ACTIVE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${workDeskTab === 'ACTIVE'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                      }`}
                  >
                    Active Work ({activeAssignedTickets.length})
                  </button>
                  <button
                    onClick={() => setWorkDeskTab('PENDING_TESTING')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${workDeskTab === 'PENDING_TESTING'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                      }`}
                  >
                    In Testing ({pendingTestingTickets.length})
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                    Loading assigned tickets...
                  </div>
                ) : assignedTickets.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <TicketIcon className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      {workDeskTab === 'ACTIVE'
                        ? 'No active tickets currently assigned to you'
                        : 'No tickets currently pending testing'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {workDeskTab === 'ACTIVE'
                        ? 'When a Manager approves and assigns a ticket to you, it will appear here.'
                        : 'Tickets marked as Pending Testing will appear here.'}
                    </p>
                  </div>
                ) : (
                  assignedTickets.map((t) => {
                    const isSeen = seenTicketIds.has(t.id);
                    return (
                      <div key={t.id} className="p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#c16d18]">{t.ticketNumber}</span>
                            {!isSeen ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-white animate-pulse">
                                NEW UNREAD
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                                VIEWED
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-slate-900">{t.title}</h3>
                          <p className="text-xs text-slate-500">{t.websiteName} • {t.module}</p>
                        </div>

                        <Link
                          href={`/tickets/${t.id}`}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${!isSeen
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                          {!isSeen ? 'Open New Ticket' : 'Open & Log Work'}
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Subcontractor Teams List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-[#c16d18]" />
                <span>Teams</span>
              </h2>

              {loading ? (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                  Loading teams...
                </div>
              ) : teams.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">
                  No teams registered.
                </div>
              ) : (
                <div className="space-y-4">
                  {teams.map((team) => {
                    const teamMembers = users.filter((u) => u.teamId === team.id);
                    const memberCount = teamMembers.length || team.members?.length || 0;

                    return (
                      <div key={team.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-extrabold text-xs text-slate-900">{team.name}</h3>
                          <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300/60 px-2.5 py-0.5 rounded-full shrink-0">
                            {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-snug">{team.description}</p>

                        <div className="pt-2 border-t border-slate-200/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Members</span>
                          </div>

                          {teamMembers.length === 0 ? (
                            <p className="text-[11px] text-slate-400 font-medium italic">No members assigned yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {teamMembers.map((m: any) => (
                                <div
                                  key={m.id}
                                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-800 shadow-2xs"
                                >
                                  <img
                                    src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=c16d18&color=fff`}
                                    alt={m.name}
                                    className="w-4 h-4 rounded-full object-cover shrink-0"
                                  />
                                  <span>{m.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Manager & Super Admin View: Full Width Subcontractor Teams Management Roster */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-[#c16d18]" />
                <span>Audit & Engineering Teams Roster</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign engineers and specialists to operational subcontractor units.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold px-3 py-1 rounded-full">
                {teams.length} Registered Teams
              </span>
              {(currentRole === 'SUPER_ADMIN' || currentRole === 'MANAGER') && (
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#c16d18]/20 transition-all hover:scale-105 shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create New Team</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Loading teams and members...
            </div>
          ) : teams.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No teams registered.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team) => {
                const teamMembers = users.filter((u) => u.teamId === team.id);
                const memberCount = teamMembers.length || team.members?.length || 0;

                return (
                  <div key={team.id} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-4 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">{team.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{team.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full">
                          {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                        </span>
                        {(currentRole === 'SUPER_ADMIN' || currentRole === 'MANAGER') && (
                          <button
                            onClick={() => handleDeleteTeam(team.id, team.name)}
                            title={`Delete team ${team.name}`}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Assigned Team Members</span>
                        <button
                          onClick={() => { setSelectedTeamForAdd(team); setSelectedUserIdToAdd(''); }}
                          className="text-xs font-extrabold text-[#c16d18] hover:text-[#a35810] bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          + Add Member
                        </button>
                      </div>

                      {teamMembers.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium italic">No members assigned to this team yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {teamMembers.map((m: any) => (
                            <div
                              key={m.id}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-xs group"
                            >
                              <img
                                src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=c16d18&color=fff`}
                                alt={m.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                              />
                              <span>{m.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({m.role.replace('_', ' ')})</span>
                              <button
                                onClick={() => handleRemoveMember(team.id, m.id)}
                                title="Remove from team"
                                className="text-slate-400 hover:text-red-600 transition-colors ml-1 text-sm font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {selectedTeamForAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#c16d18]" />
              <span>Add Member to {selectedTeamForAdd.name}</span>
            </h3>
            <p className="text-xs text-slate-500">Select a registered user to add to this team:</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select User</label>
              <select
                value={selectedUserIdToAdd}
                onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 bg-white"
              >
                <option value="">-- Choose User --</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.replace('_', ' ')}) - {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setSelectedTeamForAdd(null); setSelectedUserIdToAdd(''); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedUserIdToAdd || addingMember}
                onClick={handleAddMember}
                className="px-4 py-2 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {addingMember ? 'Adding...' : 'Add Member to Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTeam} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-[#c16d18]" />
              <span>Create New Operational Team</span>
            </h3>
            <p className="text-xs text-slate-500">Register a new engineering or subcontractor team unit.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Team Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Mobile Engineering Team"
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                placeholder="Brief summary of team responsibilities..."
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowCreateTeamModal(false); setNewTeamName(''); setNewTeamDesc(''); }}
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

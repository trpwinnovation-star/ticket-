'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Ticket as TicketIcon,
  Lightbulb,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Wrench,
  ShieldCheck,
  Crown,
  ChevronRight,
  ThumbsUp,
  Building,
  LogIn,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, isAuthenticated, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role || 'GUEST_USER';

  const [tickets, setTickets] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Manager Approval Modal State
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [targetClosureDate, setTargetClosureDate] = useState<string>('');
  const [teams, setTeams] = useState<any[]>([]);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
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
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const requests: Promise<any>[] = [
        fetch('/api/v1/tickets', { headers }),
        fetch('/api/v1/recommendations', { headers }),
        fetch('/api/v1/admin/metrics', { headers }),
        fetch('/api/v1/teams', { headers }),
      ];

      if (currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') {
        requests.push(fetch('/api/v1/admin/users', { headers }));
      }

      const [resTickets, resRecs, resAdmin, resTeams, resUsers] = await Promise.all(requests);

      const dataTickets = await resTickets.json();
      const dataRecs = await resRecs.json();
      const dataAdmin = await resAdmin.json();
      const dataTeams = await resTeams.json();

      if (dataTickets.tickets) setTickets(dataTickets.tickets);
      if (dataRecs.recommendations) setRecommendations(dataRecs.recommendations);
      if (dataAdmin.metrics) setMetrics(dataAdmin.metrics);
      if (dataTeams.teams) setTeams(dataTeams.teams);

      if (resUsers) {
        const dataUsers = await resUsers.json();
        if (dataUsers.users) setUsers(dataUsers.users);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleApprove = async () => {
    if (!selectedTicket) return;
    try {
      await fetch(`/api/v1/tickets/${selectedTicket.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          assignedToId: assigneeId || undefined,
          teamId: selectedTeamId || undefined,
          targetClosureDate: targetClosureDate || undefined,
        }),
      });
      setShowApproveModal(false);
      setSelectedTicket(null);
      setAssigneeId('');
      setSelectedTeamId('');
      setTargetClosureDate('');
      fetchData();
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const handleReject = async () => {
    if (!selectedTicket || !rejectReason.trim()) return;
    try {
      await fetch(`/api/v1/tickets/${selectedTicket.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });
      setShowRejectModal(false);
      setSelectedTicket(null);
      setRejectReason('');
      fetchData();
    } catch (e) {
      console.error('Reject failed:', e);
    }
  };

  const handleUpvote = async (recId: string) => {
    if (!currentUser?.id) return;

    setRecommendations((prevRecs) =>
      prevRecs.map((rec) => {
        if (rec.id !== recId) return rec;
        const currentVotes = Array.isArray(rec.votes) ? rec.votes : [];
        const hasVoted = currentVotes.some((v: any) => v.userId === currentUser.id);
        const newVotes = hasVoted
          ? currentVotes.filter((v: any) => v.userId !== currentUser.id)
          : [...currentVotes, { userId: currentUser.id, recommendationId: recId }];
        const newUpvotes = hasVoted ? Math.max(0, rec.upvotes - 1) : rec.upvotes + 1;
        return { ...rec, upvotes: newUpvotes, votes: newVotes };
      })
    );

    try {
      const res = await fetch(`/api/v1/recommendations/${recId}/upvote`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.recommendation) {
        setRecommendations((prevRecs) =>
          prevRecs.map((r) => (r.id === recId ? data.recommendation : r))
        );
      }
    } catch (e) {
      console.error('Upvote failed:', e);
      fetchData();
    }
  };

  const pendingTickets = tickets.filter((t) => t.status === 'PENDING_APPROVAL' || t.status === 'SUBMITTED');
  const mySubmittedTickets = tickets.filter((t) => t.createdById === currentUser?.id);

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

  const myAssignedTickets = workDeskTab === 'ACTIVE' ? activeAssignedTickets : pendingTestingTickets;

  if (!isAuthenticated) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto py-8">
        {/* Unauthenticated Hero Banner */}
        <div className="bg-gradient-to-r from-[#c16d18] to-[#d97d20] text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 text-white border border-white/30 flex items-center justify-center font-bold text-3xl mx-auto shadow-lg backdrop-blur-xs">
            <TicketIcon className="w-8 h-8" />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">
              Authentication Required
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Enterprise Ticket & Recommendation Hub
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              To raise support requests, view ticket statuses, access Teams work logs, or manage platform settings, please sign in or register an account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white font-extrabold text-sm shadow-xl shadow-[#c16d18]/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Create Account</span>
            </Link>
          </div>
        </div>

        {/* Access Protection Notice */}
        {/* <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#c16d18] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div> */}
        {/* <div>
            <h3 className="text-sm font-bold text-slate-900">Protected Platform Portal</h3>
            <p className="text-xs text-slate-500">
              Unauthenticated users are restricted from viewing ticket titles, diagnostics, or IT work logs to protect target client platforms.
            </p>
          </div> */}
        {/* </div> */}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome & Role Banner */}
      <div className="bg-gradient-to-r from-[#c16d18] to-[#d97d20] text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white border border-white/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-xs">
                {currentRole.replace('_', ' ')}
              </span>
              <span className="text-amber-100 text-xs font-medium">
                {currentRole === 'GUEST_USER'}
                {currentRole === 'IT_SOFTWARE'}
                {currentRole === 'MANAGER'}
                {currentRole === 'SUPER_ADMIN'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name}!
            </h1>
            <p className="text-amber-100/90 text-sm max-w-2xl">
              {currentRole === 'GUEST_USER'
                ? 'Submit support requests, attach diagnostic screenshots, track live status, and recommend portal feature improvements.'
                : currentRole === 'IT_SOFTWARE'
                  ? 'Manage assigned technical tickets, log work hours, update bug statuses, and record internal developer notes.'
                  : currentRole === 'MANAGER'
                    ? 'Review incoming client tickets, approve or reject submissions, assign to IT teams, and ensure SLA compliance.'
                    : 'Monitor overall platform health, track logged work hours, manage teams, and audit ticket status.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentRole === 'SUPER_ADMIN' && (
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>Super Admin Console</span>
              </Link>
            )}
            <Link
              href="/tickets/new"
              className="px-4 py-2.5 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#c16d18]/30 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise New Ticket</span>
            </Link>
            <Link
              href="/recommendations"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 border border-white/20 transition-all"
            >
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span>Suggest Feature</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TicketIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tickets</p>
            <h3 className="text-2xl font-black text-slate-900">{tickets.length}</h3>
            <p className="text-[11px] text-slate-400 font-medium">In system </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-black text-amber-600">{pendingTickets.length}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Awaiting manager action</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved Tickets</p>
            <h3 className="text-2xl font-black text-slate-900">
              {metrics.completedTickets !== undefined
                ? metrics.completedTickets
                : tickets.filter((t) => ['RESOLVED', 'COMPLETED', 'CLOSED'].includes(t.status)).length}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Issues successfully closed</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Teams</p>
            <h3 className="text-2xl font-black text-slate-900">{metrics.totalTeams || teams.length}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Active Teams</p>
          </div>
        </div>
      </div>

      {/* Main Perspective Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tickets Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Super Admin Distinct Section (Level 4) */}
          {currentRole === 'SUPER_ADMIN' && (
            <div className="bg-gradient-to-r from-[#c16d18] to-[#d97d20] text-white rounded-2xl border border-amber-500/30 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h2 className="font-extrabold text-sm tracking-tight text-amber-300">
                    Super Admin Executive Management Desk
                  </h2>
                </div>
                <Link
                  href="/admin"
                  className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1"
                >
                  <span>Full Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] uppercase font-bold text-purple-200">Approved Tickets</p>
                  <p className="text-2xl font-black text-white">
                    {metrics.approvedTickets !== undefined
                      ? metrics.approvedTickets
                      : tickets.filter((t) => ['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'COMPLETED', 'CLOSED'].includes(t.status)).length}
                  </p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] uppercase font-bold text-purple-200">
                    Total Teams</p>
                  <p className="text-2xl font-black text-white">{metrics.totalTeams || 2}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] uppercase font-bold text-purple-200">Registered Platform Users</p>
                  <p className="text-2xl font-black text-white">{metrics.totalUsers || 5}</p>
                </div>
              </div>
            </div>
          )}

          {/* Manager Action Inbox (Level 3/4) */}
          {(currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#c16d18]" />
                  <h2 className="font-extrabold text-slate-900 text-sm">Manager Approval Inbox</h2>
                  <span className="bg-[#c16d18] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingTickets.length} Pending
                  </span>
                </div>
                <Link href="/tickets" className="text-xs font-bold text-[#c16d18] hover:underline flex items-center gap-1">
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {pendingTickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No tickets currently awaiting manager approval.
                  </div>
                ) : (
                  pendingTickets.map((t) => (
                    <div key={t.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{t.ticketNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {t.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                            {t.priority}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">{t.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                        <p className="text-[11px] text-slate-400">
                          Submitted by: <strong className="text-slate-700">{t.createdBy?.name || 'Guest User'}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { setSelectedTicket(t); setAssigneeId(''); setShowApproveModal(true); }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          Approve & Assign
                        </button>
                        <button
                          onClick={() => { setSelectedTicket(t); setShowRejectModal(true); }}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* IT Staff Desk (Level 2) */}
          {currentRole === 'IT_SOFTWARE' && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-blue-50/80 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <h2 className="font-extrabold text-slate-900 text-sm">Assigned Technical Work Desk</h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-blue-100/70 p-1 rounded-xl border border-blue-200">
                    <button
                      onClick={() => setWorkDeskTab('ACTIVE')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${workDeskTab === 'ACTIVE'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-blue-900 hover:text-blue-950'
                        }`}
                    >
                      Active Work ({activeAssignedTickets.length})
                    </button>
                    <button
                      onClick={() => setWorkDeskTab('PENDING_TESTING')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${workDeskTab === 'PENDING_TESTING'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-blue-900 hover:text-blue-950'
                        }`}
                    >
                      In Testing ({pendingTestingTickets.length})
                    </button>
                  </div>

                  <Link href="/team" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0 ml-2">
                    <span>Go to Work Desk</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {myAssignedTickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    {workDeskTab === 'ACTIVE'
                      ? 'No active tickets currently assigned to you.'
                      : 'No tickets currently pending testing.'}
                  </div>
                ) : (
                  myAssignedTickets.map((t) => {
                    const isSeen = seenTicketIds.has(t.id);
                    return (
                      <div key={t.id} className="p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500">{t.ticketNumber}</span>
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
                        </div>

                        <Link
                          href={`/tickets/${t.id}`}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${!isSeen
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                          {!isSeen ? 'Open New Ticket' : 'View Ticket Details'}
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tickets Stream Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <TicketIcon className="w-4 h-4 text-[#c16d18]" />
                <span>{currentRole === 'GUEST_USER' ? 'My Support Tickets' : 'Recent Support Tickets'}</span>
              </h2>
              <Link href="/tickets" className="text-xs font-bold text-[#c16d18] hover:underline flex items-center gap-1">
                <span>View All Tickets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No tickets found. Click "Raise New Ticket" to create your first issue!
                </div>
              ) : (
                tickets.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{t.ticketNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {t.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">
                        <Link href={`/tickets/${t.id}`} className="hover:text-[#c16d18] transition-colors">
                          {t.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500">{t.websiteName || 'General Portal'} • {t.module || 'Core'}</p>
                    </div>

                    <Link
                      href={`/tickets/${t.id}`}
                      className="p-2 text-slate-400 hover:text-[#c16d18] hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations & Platform Info */}
        <div className="space-y-6">
          {/* Feature Suggestions Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-amber-50/50 border-b border-amber-200/60 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#c16d18]" />
                <span>Popular Recommendations</span>
              </h2>
              <Link href="/recommendations" className="text-xs font-bold text-[#c16d18] hover:underline">
                View All
              </Link>
            </div>

            <div className="p-5 space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  No feature suggestions posted yet.
                </div>
              ) : (
                recommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-xl border border-slate-100 hover:border-amber-200 bg-slate-50/50 hover:bg-white transition-all space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 leading-snug">{rec.title}</h4>
                      {(() => {
                        const hasUserVoted = Array.isArray(rec.votes)
                          ? rec.votes.some((v: any) => v.userId === currentUser?.id)
                          : (rec.votedUserIds && Array.isArray(rec.votedUserIds) ? rec.votedUserIds.includes(currentUser?.id) : rec.userVoted);

                        return (
                          <button
                            onClick={() => handleUpvote(rec.id)}
                            title={hasUserVoted ? "Click to remove your upvote" : "Click to upvote"}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold shrink-0 transition-colors ${hasUserVoted
                              ? 'bg-[#c16d18] text-white shadow-xs'
                              : 'bg-amber-100 text-[#c16d18] hover:bg-[#c16d18] hover:text-white'
                              }`}
                          >
                            <ThumbsUp className={`w-3 h-3 ${hasUserVoted ? 'fill-white' : ''}`} />
                            <span>{rec.upvotes}</span>
                          </button>
                        );
                      })()}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 whitespace-pre-line">{rec.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1">
                      <span>{rec.websiteName}</span>
                      <span className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-bold">{rec.status}</span>
                    </div>
                  </div>
                ))
              )}

              <Link
                href="/recommendations"
                className="w-full py-2 rounded-xl border border-amber-300 bg-amber-50 text-[#c16d18] hover:bg-amber-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Feature Suggestion</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Approve & Assign IT Specialist Modal */}
      {showApproveModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Approve Ticket #{selectedTicket.ticketNumber}</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">{selectedTicket.title}</p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Team (Broadcasts to all team members)
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => {
                    const teamId = e.target.value;
                    setSelectedTeamId(teamId);
                    if (teamId && assigneeId) {
                      const foundUser = users.find((u) => u.id === assigneeId);
                      const isMember =
                        foundUser?.teamId === teamId ||
                        foundUser?.teams?.some((t: any) => t.id === teamId);
                      if (!isMember) setAssigneeId('');
                    }
                  }}
                  className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-white"
                >
                  <option value="">-- No Specific Team --</option>
                  {teams.map((tm: any) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} ({tm.members?.length || 0} Members)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign IT Specialist / Engineer
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    const userId = e.target.value;
                    setAssigneeId(userId);
                    if (userId) {
                      const foundUser = users.find((u) => u.id === userId);
                      if (foundUser?.teamId) {
                        setSelectedTeamId(foundUser.teamId);
                      } else if (foundUser?.teams && foundUser.teams.length > 0) {
                        setSelectedTeamId(foundUser.teams[0].id);
                      }
                    }
                  }}
                  className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-white"
                >
                  <option value="">-- Leave Unassigned for now --</option>
                  {users.filter((u) => u.role === 'IT_SOFTWARE').map((u: any) => {
                    const userTeam = teams.find((t: any) => t.id === u.teamId || t.members?.some((m: any) => m.id === u.id));
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} {userTeam ? `[Team: ${userTeam.name}]` : `(${u.jobTitle || 'IT Specialist'})`}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Selecting a specialist automatically pre-selects their assigned team to ensure roster alignment.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Target Closure / SLA Due Date (Optional)</span>
                </label>
                <input
                  type="date"
                  value={targetClosureDate}
                  onChange={(e) => setTargetClosureDate(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowApproveModal(false); setSelectedTicket(null); setAssigneeId(''); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
              >
                Approve & Assign Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Reject Ticket #{selectedTicket.ticketNumber}</h3>
            <p className="text-xs text-slate-500">Provide a clear rejection reason for the client:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Insufficient details provided / Works as intended per spec."
              rows={3}
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowRejectModal(false); setSelectedTicket(null); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

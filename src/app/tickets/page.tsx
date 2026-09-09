'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ticketApi } from '@/services/api/ticket.api';
import {
  Ticket as TicketIcon,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Wrench,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function TicketsPage() {
  const { currentUser, isAuthenticated, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role || 'GUEST_USER';

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [onlyMine, setOnlyMine] = useState<boolean>(false);

  const fetchTickets = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await ticketApi.getAll();
      if (data.tickets) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const handleFocus = () => fetchTickets();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  // Quick Approve Action for Managers
  const handleQuickApprove = async (ticketId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await ticketApi.approve(ticketId, {});
      fetchTickets();
    } catch (err) {
      console.error('Quick approve failed:', err);
    }
  };

  // Filter Logic
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      (ticket.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (ticket.ticketNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (ticket.websiteName || '').toLowerCase().includes(search.toLowerCase()) ||
      (ticket.module || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;
    const matchesMine =
      !onlyMine ||
      ticket.createdById === currentUser?.id ||
      ticket.assignedToId === currentUser?.id ||
      ticket.testedById === currentUser?.id ||
      (Boolean((currentUser as any)?.teamId) && ticket.teamId === (currentUser as any)?.teamId);

    return matchesSearch && matchesStatus && matchesPriority && matchesMine;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TicketIcon className="w-5 h-5 text-[#c16d18]" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Support Tickets Portal</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage, filter, and track technical issues across target client platforms.
          </p>
        </div>

        <Link
          href="/tickets/new"
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#c16d18]/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Raise New Ticket</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, title, module..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Role Mine Toggle */}
          <button
            onClick={() => setOnlyMine(!onlyMine)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
              onlyMine
                ? 'bg-[#c16d18] text-white border-[#c16d18]'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>{onlyMine ? 'Showing My Tickets' : 'Filter My Tickets'}</span>
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            Loading tickets from database...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No matching tickets found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no tickets matching your current search or filter criteria in the database.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="p-5 hover:bg-slate-50/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-[#c16d18]">{t.ticketNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {t.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {t.priority}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                      {t.status.replace('_', ' ')}
                    </span>

                    {t.environment && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        t.environment === 'PROD'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : t.environment === 'UAT'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        Env: {t.environment}
                      </span>
                    )}

                    {t.testingStatus && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        t.testingStatus === 'PASSED'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : t.testingStatus === 'FAILED'
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        Test: {t.testingStatus}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#c16d18] transition-colors">
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>Platform: <strong className="text-slate-600">{t.websiteName || 'N/A'}</strong></span>
                    <span>Module: <strong className="text-slate-600">{t.module || 'N/A'}</strong></span>
                    <span>Submitted by: <strong className="text-slate-600">{t.createdBy?.name || 'Guest User'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {(currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') && t.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={(e) => handleQuickApprove(t.id, e)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Approve
                    </button>
                  )}

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#c16d18] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

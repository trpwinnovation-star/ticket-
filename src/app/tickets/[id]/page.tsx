'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ticketApi } from '@/services/api/ticket.api';
import { teamApi } from '@/services/api/team.api';
import { configApi } from '@/services/api/config.api';
import {
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Wrench,
  FileText,
  Send,
  Calendar,
  UserCheck,
  PlusCircle,
  Users,
  Building,
  Pencil,
  GitBranch,
  TestTube,
  Server,
  Check,
  XCircle,
  CheckCheck,
} from 'lucide-react';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { currentUser, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role || 'GUEST_USER';

  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // IT Work Log Form State
  const [hoursSpent, setHoursSpent] = useState<string>('1.5');
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workDesc, setWorkDesc] = useState<string>('');
  const [showLogModal, setShowLogModal] = useState<boolean>(false);

  // Comment State
  const [commentContent, setCommentContent] = useState<string>('');
  const [isInternalComment, setIsInternalComment] = useState<boolean>(false);

  // Manager Approval & IT Assignment State
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('MEDIUM');
  const [targetClosureDate, setTargetClosureDate] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [itUsers, setItUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [configWebsites, setConfigWebsites] = useState<any[]>([]);
  const [configModules, setConfigModules] = useState<any[]>([]);

  // Testing Workflow & Environment State
  const [testedByIdState, setTestedByIdState] = useState<string>('');
  const [selectedEnv, setSelectedEnv] = useState<string>('UAT');
  const [branchNameState, setBranchNameState] = useState<string>('');
  const [workEnv, setWorkEnv] = useState<string>('UAT');
  const [workBranch, setWorkBranch] = useState<string>('');
  const [showTesterModal, setShowTesterModal] = useState<boolean>(false);
  const [showTestResultModal, setShowTestResultModal] = useState<boolean>(false);
  const [testPassedChoice, setTestPassedChoice] = useState<boolean>(true);
  const [testingFeedbackInput, setTestingFeedbackInput] = useState<string>('');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Edit Ticket Form State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('Software Bug');
  const [editWebsiteName, setEditWebsiteName] = useState<string>('');
  const [editModule, setEditModule] = useState<string>('');
  const [editPriority, setEditPriority] = useState<string>('MEDIUM');
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  const selectedEditWebsiteObj = configWebsites.find((w: any) => w.name === editWebsiteName);
  const filteredEditModules = selectedEditWebsiteObj
    ? configModules.filter((m: any) => !m.websiteId || m.websiteId === selectedEditWebsiteObj.id)
    : configModules;

  const openEditModal = () => {
    if (!ticket) return;
    setEditTitle(ticket.title || '');
    setEditDescription(ticket.description || '');
    setEditCategory(ticket.category || 'Software Bug');
    setEditWebsiteName(ticket.websiteName || (configWebsites[0]?.name ?? ''));
    setEditModule(ticket.module || (configModules[0]?.name ?? ''));
    setEditPriority(ticket.priority || 'MEDIUM');
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) {
      setEditError('Title and description are required fields.');
      return;
    }
    setEditLoading(true);
    setEditError('');

    try {
      await ticketApi.update(ticketId, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        websiteName: editWebsiteName,
        module: editModule,
        priority: editPriority,
      });

      setShowEditModal(false);
      fetchTicket();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update ticket.');
    } finally {
      setEditLoading(false);
    }
  };

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const data = await ticketApi.getById(ticketId);
      if (data.ticket) {
        setTicket(data.ticket);
        if (data.ticket.assignedToId) setAssigneeId(data.ticket.assignedToId);
        if (data.ticket.teamId) setSelectedTeamId(data.ticket.teamId);
        if (data.ticket.priority) setSelectedPriority(data.ticket.priority);
        if (data.ticket.targetClosureDate) {
          setTargetClosureDate(new Date(data.ticket.targetClosureDate).toISOString().split('T')[0]);
        } else {
          setTargetClosureDate('');
        }

        if (data.ticket.testedById) setTestedByIdState(data.ticket.testedById);
        if (data.ticket.environment) {
          setSelectedEnv(data.ticket.environment);
          setWorkEnv(data.ticket.environment);
        }
        if (data.ticket.branchName) {
          setBranchNameState(data.ticket.branchName);
          setWorkBranch(data.ticket.branchName);
        }

        // Mark ticket as seen/viewed by current user in local tracking
        if (currentUser?.id && ticketId) {
          try {
            const key = `seen_tickets_${currentUser.id}`;
            const raw = localStorage.getItem(key) || '[]';
            const list = JSON.parse(raw);
            if (!list.includes(ticketId)) {
              list.push(ticketId);
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    teamApi.getTeams()
      .then((data) => {
        if (data.teams) setTeams(data.teams);
      })
      .catch((e) => console.error('Failed to fetch teams:', e));

    configApi.getOptions()
      .then((data) => {
        if (data.websites) setConfigWebsites(data.websites);
        if (data.modules) setConfigModules(data.modules);
      })
      .catch((e) => console.error('Failed to load target options:', e));

    teamApi.getUsers()
      .then((data) => {
        if (data.users) {
          setAllUsers(data.users);
          const list = data.users.filter((u: any) => u.role === 'IT_SOFTWARE');
          if (list.length > 0) setItUsers(list);
        }
      })
      .catch((e) => console.error('Failed to fetch users:', e));
  }, [ticketId, currentUser]);

  const itSpecialists = itUsers;

  const handleAssignTesterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ticketApi.assignTester(ticketId, {
        testedById: testedByIdState || null,
        environment: selectedEnv || null,
        branchName: branchNameState || null,
      });
      setShowTesterModal(false);
      fetchTicket();
    } catch (e) {
      console.error('Assign tester failed:', e);
    }
  };

  const handleSubmitTestingResult = async (passed: boolean) => {
    try {
      await ticketApi.submitTesting(ticketId, {
        passed,
        feedback: testingFeedbackInput,
      });
      setShowTestResultModal(false);
      setTestingFeedbackInput('');
      fetchTicket();
    } catch (e) {
      console.error('Submit testing failed:', e);
    }
  };

  const handleCompleteTicket = async () => {
    try {
      await ticketApi.completeTicket(ticketId);
      fetchTicket();
    } catch (e) {
      console.error('Complete ticket failed:', e);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await ticketApi.updateStatus(ticketId, newStatus);
      fetchTicket();
    } catch (e) {
      console.error('Status update failed:', e);
    }
  };

  const handleSpecialistChange = async (newAssigneeId: string) => {
    setAssigneeId(newAssigneeId);
    let targetTeamId = ticket?.teamId || selectedTeamId;

    if (newAssigneeId) {
      const chosenUser = itUsers.find((u) => u.id === newAssigneeId);
      if (chosenUser?.teamId) {
        targetTeamId = chosenUser.teamId;
        setSelectedTeamId(chosenUser.teamId);
      } else if (chosenUser?.teams && chosenUser.teams.length > 0) {
        targetTeamId = chosenUser.teams[0].id;
        setSelectedTeamId(chosenUser.teams[0].id);
      }
    }

    try {
      await ticketApi.assign(ticketId, {
        assignedToId: newAssigneeId || null,
        teamId: targetTeamId || null,
      });
      fetchTicket();
    } catch (e) {
      console.error('Assignment failed:', e);
    }
  };

  const handleTeamChange = async (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    let targetAssigneeId = assigneeId || ticket?.assignedToId;

    if (newTeamId && targetAssigneeId) {
      const currentAssigneeUser = itUsers.find((u) => u.id === targetAssigneeId);
      const isMember =
        currentAssigneeUser?.teamId === newTeamId ||
        currentAssigneeUser?.teams?.some((t: any) => t.id === newTeamId);
      if (!isMember) {
        targetAssigneeId = '';
        setAssigneeId('');
      }
    }

    try {
      await ticketApi.assign(ticketId, {
        teamId: newTeamId || null,
        assignedToId: targetAssigneeId || null,
      });
      fetchTicket();
    } catch (e) {
      console.error('Team assignment failed:', e);
    }
  };

  const handleClosureDateChange = async (newDate: string) => {
    setTargetClosureDate(newDate);
    try {
      await ticketApi.assign(ticketId, {
        targetClosureDate: newDate || null,
        assignedToId: ticket?.assignedToId || undefined,
        teamId: ticket?.teamId || undefined,
      });
      fetchTicket();
    } catch (e) {
      console.error('Failed to set target closure date:', e);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setSelectedPriority(newPriority);
    try {
      await ticketApi.updatePriority(ticketId, newPriority);
      fetchTicket();
    } catch (e) {
      console.error('Priority update failed:', e);
    }
  };

  const handleApprove = async () => {
    try {
      await ticketApi.approve(ticketId, {
        assignedToId: assigneeId || undefined,
        teamId: selectedTeamId || undefined,
        priority: selectedPriority || undefined,
        targetClosureDate: targetClosureDate || undefined,
      });
      fetchTicket();
    } catch (e) {
      console.error('Approval failed:', e);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await ticketApi.reject(ticketId, rejectReason);
      setShowRejectModal(false);
      fetchTicket();
    } catch (e) {
      console.error('Reject failed:', e);
    }
  };

  const handleLogWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDesc.trim() || !hoursSpent) return;

    try {
      await teamApi.createWorkLog({
        ticketId,
        userId: currentUser?.id,
        hoursSpent: parseFloat(hoursSpent),
        description: workDesc,
        workDate,
      });
      setWorkDesc('');
      setShowLogModal(false);
      fetchTicket();
    } catch (e) {
      console.error('Log work failed:', e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      await ticketApi.addComment(ticketId, commentContent, isInternalComment, currentUser?.id);
      setCommentContent('');
      setIsInternalComment(false);
      fetchTicket();
    } catch (e) {
      console.error('Add comment failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2 max-w-lg mx-auto my-12 text-slate-400 text-xs font-semibold">
        Loading ticket details from database...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Ticket Not Found</h2>
        <p className="text-xs text-slate-500">The requested ticket could not be located in the database.</p>
        <button
          onClick={() => router.push('/tickets')}
          className="px-4 py-2 bg-[#c16d18] text-white rounded-xl text-xs font-bold"
        >
          Return to Tickets Desk
        </button>
      </div>
    );
  }

  const canEditTicket =
    ticket &&
    ((currentUser?.id === ticket.createdById && !['RESOLVED', 'COMPLETED', 'CLOSED'].includes(ticket.status)) ||
      currentRole === 'MANAGER' ||
      currentRole === 'SUPER_ADMIN');

  return (
    <div className="space-y-6">
      {/* Top Back & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tickets Desk</span>
        </button>

        {/* Manager Action Banner */}
        {(currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') && ticket.status === 'PENDING_APPROVAL' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-amber-50 border border-amber-300 p-3 rounded-2xl w-full sm:w-auto">
            <span className="text-xs font-bold text-amber-900 shrink-0">Manager Action:</span>
            <select
              value={selectedTeamId}
              onChange={(e) => {
                const teamId = e.target.value;
                setSelectedTeamId(teamId);
                if (teamId && assigneeId) {
                  const currentAssigneeUser = itUsers.find((u) => u.id === assigneeId);
                  const isMember =
                    currentAssigneeUser?.teamId === teamId ||
                    currentAssigneeUser?.teams?.some((t: any) => t.id === teamId);
                  if (!isMember) setAssigneeId('');
                }
              }}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-bold border border-amber-300 rounded-lg bg-white focus:outline-none"
            >
              <option value="">-- Assign Team (Broadcasts to members) --</option>
              {teams.map((t: any) => (
                <option key={t.id} value={t.id}>
                  Team: {t.name}
                </option>
              ))}
            </select>
            <select
              value={assigneeId}
              onChange={(e) => {
                const userId = e.target.value;
                setAssigneeId(userId);
                if (userId) {
                  const chosenUser = itUsers.find((u) => u.id === userId);
                  if (chosenUser?.teamId) {
                    setSelectedTeamId(chosenUser.teamId);
                  } else if (chosenUser?.teams && chosenUser.teams.length > 0) {
                    setSelectedTeamId(chosenUser.teams[0].id);
                  }
                }
              }}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-bold border border-amber-300 rounded-lg bg-white focus:outline-none"
            >
              <option value="">-- Assign Specialist (Optional) --</option>
              {itSpecialists.map((u: any) => {
                const userTeam = teams.find((t: any) => t.id === u.teamId || t.members?.some((m: any) => m.id === u.id));
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} {userTeam ? `[Team: ${userTeam.name}]` : `(${u.jobTitle || 'IT Specialist'})`}
                  </option>
                );
              })}
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-bold border border-amber-300 rounded-lg bg-white focus:outline-none"
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Priority</option>
            </select>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-amber-900 shrink-0">Target Closure:</span>
              <input
                type="date"
                value={targetClosureDate}
                onChange={(e) => setTargetClosureDate(e.target.value)}
                className="w-full sm:w-auto px-2 py-1 text-xs font-bold border border-amber-300 rounded-lg bg-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0">
              <button
                onClick={handleApprove}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Approve & Assign
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Ticket Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Info */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-black text-[#c16d18]">{ticket.ticketNumber}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {ticket.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                  {ticket.status.replace('_', ' ')}
                </span>

                {ticket.environment && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1 ${
                    ticket.environment === 'PROD'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : ticket.environment === 'UAT'
                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                      : 'bg-blue-100 text-blue-900 border-blue-300'
                  }`}>
                    <Server className="w-3 h-3" />
                    <span>Env: {ticket.environment}</span>
                  </span>
                )}

                {ticket.branchName && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-purple-600" />
                    <span>{ticket.branchName}</span>
                  </span>
                )}

                {ticket.testingStatus && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1 ${
                    ticket.testingStatus === 'PASSED'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : ticket.testingStatus === 'FAILED'
                      ? 'bg-red-100 text-red-900 border-red-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    <TestTube className="w-3 h-3" />
                    <span>Test: {ticket.testingStatus}</span>
                  </span>
                )}

                {ticket.team && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                    <Building className="w-3 h-3 text-blue-600" />
                    <span>Assigned Team: {ticket.team.name}</span>
                  </span>
                )}
              </div>

              {canEditTicket && (
                <button
                  onClick={openEditModal}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Ticket Details</span>
                </button>
              )}
            </div>

            <h1 className="text-xl font-extrabold text-slate-900 leading-tight">{ticket.title}</h1>

            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ticket.description}</p>

            {/* Module Verification & QA Testing Panel */}
            {(ticket.status === 'PENDING_TESTING' || ticket.testingStatus || ticket.testedById) && (
              <div className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
                ticket.testingStatus === 'PASSED'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : ticket.testingStatus === 'FAILED'
                  ? 'bg-red-50/80 border-red-200 text-red-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                      ticket.testingStatus === 'PASSED'
                        ? 'bg-emerald-600'
                        : ticket.testingStatus === 'FAILED'
                        ? 'bg-red-600'
                        : 'bg-amber-600'
                    }`}>
                      <TestTube className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <span>Module Verification & QA Testing</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          ticket.testingStatus === 'PASSED'
                            ? 'bg-emerald-200 text-emerald-900'
                            : ticket.testingStatus === 'FAILED'
                            ? 'bg-red-200 text-red-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}>
                          {ticket.testingStatus || 'PENDING'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Assigned Tester: <strong className="text-slate-900">{ticket.testedBy?.name || 'Unassigned'}</strong>
                        {ticket.environment && ` | Target Env: ${ticket.environment}`}
                        {ticket.branchName && ` | Branch: ${ticket.branchName}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {(currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN' || currentRole === 'IT_SOFTWARE') && (
                      <button
                        onClick={() => {
                          setTestedByIdState(ticket.testedById || '');
                          setSelectedEnv(ticket.environment || 'UAT');
                          setBranchNameState(ticket.branchName || '');
                          setShowTesterModal(true);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>{ticket.testedById ? 'Reassign Tester' : 'Assign Tester'}</span>
                      </button>
                    )}

                    {ticket.testingStatus === 'PASSED' && ticket.status !== 'COMPLETED' && (currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') && (
                      <button
                        onClick={handleCompleteTicket}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Ticket as COMPLETED</span>
                      </button>
                    )}
                  </div>
                </div>

                {ticket.testingFeedback && (
                  <div className="p-3 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-800 space-y-1">
                    <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">Tester Feedback Remarks:</p>
                    <p className="italic leading-relaxed">{ticket.testingFeedback}</p>
                  </div>
                )}

                {(currentUser?.id === ticket.testedById || currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') && ticket.status === 'PENDING_TESTING' && (
                  <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-xs font-extrabold text-slate-900">Submit Module Testing Verdict:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setTestPassedChoice(true);
                          setTestingFeedbackInput('');
                          setShowTestResultModal(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Pass Testing</span>
                      </button>
                      <button
                        onClick={() => {
                          setTestPassedChoice(false);
                          setTestingFeedbackInput('');
                          setShowTestResultModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Fail Testing (Reassign to Dev)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attachments & Screenshots */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-700">Attached Screenshots & Files ({ticket.attachments.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ticket.attachments.map((att: any) => {
                    const isImage =
                      (att.fileType && att.fileType.includes('image')) ||
                      (att.fileUrl && (att.fileUrl.startsWith('data:image/') || att.fileUrl.match(/\.(png|jpg|jpeg|gif|webp|svg)/i)));

                    return (
                      <div key={att.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 hover:text-[#c16d18] transition-colors"
                        >
                          <FileText className="w-5 h-5 text-[#c16d18] shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 truncate">{att.fileName}</p>
                            <p className="text-[10px] text-slate-400">Click to open full size</p>
                          </div>
                        </a>

                        {isImage && (
                          <div className="rounded-lg overflow-hidden border border-slate-200 bg-white max-h-48 flex items-center justify-center p-1">
                            <img
                              src={att.fileUrl}
                              alt={att.fileName || 'Attached screenshot'}
                              className="max-h-44 w-full object-contain rounded-md hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* IT Work Logs Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Logged IT Work Hours & Billable Timesheet</span>
              </h2>

              {(currentRole === 'IT_SOFTWARE' || currentRole === 'SUPER_ADMIN') && (
                <button
                  onClick={() => setShowLogModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log IT Work Hours</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {(!ticket.workLogs || ticket.workLogs.length === 0) ? (
                <p className="py-4 text-center text-slate-400 text-xs font-medium">
                  No work hours logged yet. IT staff can click "Log IT Work Hours" above.
                </p>
              ) : (
                ticket.workLogs.map((log: any) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">{log.user?.name || 'IT Staff'}</span>
                        {log.environment && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            log.environment === 'PROD'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.environment === 'UAT'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            Env: {log.environment}
                          </span>
                        )}
                        {log.branchName && (
                          <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            <span>{log.branchName}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 leading-relaxed">{log.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-blue-600">{log.hoursSpent} hrs</p>
                      <p className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Discussion & Coordination Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#c16d18]" />
                <span>Discussion & Coordination Stream</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400">
                {ticket.comments?.filter((c: any) => !c.isInternal || currentRole !== 'GUEST_USER').length || 0} Comments
              </span>
            </div>

            {/* Comment Submission Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                rows={3}
                required
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={
                  isInternalComment
                    ? 'Write internal IT technical note (visible only to IT staff & managers)...'
                    : 'Post a public comment or clarification request...'
                }
                className={`w-full p-3 text-xs border rounded-xl focus:outline-none focus:ring-2 transition-all ${isInternalComment
                  ? 'border-purple-300 bg-purple-50/50 focus:ring-purple-500/40 text-purple-950 font-mono'
                  : 'border-slate-200 focus:ring-[#c16d18]/40 text-slate-800'
                  }`}
              />

              <div className="flex items-center justify-between flex-wrap gap-2">
                {(currentRole === 'IT_SOFTWARE' || currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') ? (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Post as Internal IT Note (Restricted to IT Staff/ Managers)</span>
                  </label>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Public comment visible to assigned team</span>
                )}

                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${isInternalComment ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#c16d18] hover:bg-[#a35810]'
                    }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isInternalComment ? 'Post Internal Note' : 'Post Comment'}</span>
                </button>
              </div>
            </form>

            {/* Comments Thread List */}
            <div className="space-y-3 pt-2">
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <p className="py-6 text-center text-slate-400 text-xs font-medium">
                  No comments yet. Start the conversation above!
                </p>
              ) : (
                ticket.comments
                  .filter((c: any) => !c.isInternal || currentRole !== 'GUEST_USER')
                  .map((comment: any) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-xl border space-y-1.5 text-xs transition-all ${comment.isInternal
                        ? 'border-purple-200 bg-purple-50/60 text-purple-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 text-slate-800'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{comment.author?.name || 'User'}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">
                            {comment.author?.role?.replace('_', ' ') || 'User'}
                          </span>
                          {comment.isInternal && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-200 text-purple-900 inline-flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Internal IT Note</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-line">{comment.content}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info & Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm">Ticket Properties</h3>

            <div className="space-y-3">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Target Website</p>
                <p className="font-bold text-slate-800">{ticket.websiteName || 'N/A'}</p>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Target Module</p>
                <p className="font-bold text-slate-800">{ticket.module || 'N/A'}</p>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Created By</p>
                <p className="font-bold text-slate-800">{ticket.createdBy?.name || 'Guest User'}</p>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Urgency / Priority Level</p>
                {(currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') ? (
                  <select
                    value={ticket.priority || selectedPriority || 'MEDIUM'}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold bg-white text-xs text-slate-800 focus:ring-2 focus:ring-[#c16d18]/40"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Priority</option>
                  </select>
                ) : (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider inline-block ${
                    ticket.priority === 'URGENT'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : ticket.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {ticket.priority || 'MEDIUM'}
                  </span>
                )}
              </div>

              {(currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') ? (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] mb-1 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-[#c16d18]" />
                      <span>Assign Operational Team (Broadcasts to all members)</span>
                    </p>
                    <select
                      value={ticket.teamId || selectedTeamId || ''}
                      onChange={(e) => handleTeamChange(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl font-bold bg-white text-xs text-slate-800 focus:ring-2 focus:ring-[#c16d18]/40"
                    >
                      <option value="">-- No Team Assigned --</option>
                      {teams.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.members?.length || 0} Members Notified)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] mb-1 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Assign Individual IT Specialist</span>
                    </p>
                    <select
                      value={ticket.assignedToId || assigneeId || ''}
                      onChange={(e) => handleSpecialistChange(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl font-bold bg-white text-xs text-slate-800 focus:ring-2 focus:ring-amber-500/40"
                    >
                      <option value="">-- Unassigned --</option>
                      {itSpecialists.map((u: any) => {
                        const userTeam = teams.find((t: any) => t.id === u.teamId || t.members?.some((m: any) => m.id === u.id));
                        return (
                          <option key={u.id} value={u.id}>
                            {u.name} {userTeam ? `[Team: ${userTeam.name}]` : `(${u.jobTitle || 'IT Specialist'})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Target Closure / Due Date</span>
                    </p>
                    <input
                      type="date"
                      value={targetClosureDate}
                      onChange={(e) => handleClosureDateChange(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl font-bold bg-white text-xs text-slate-800 focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Assigned Team</p>
                    <p className="font-bold text-slate-800">{ticket.team?.name || 'No Team Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Assigned Specialist</p>
                    <p className="font-bold text-slate-800">{ticket.assignedTo?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Target Closure Date</p>
                    <p className="font-bold text-slate-800">
                      {ticket.targetClosureDate
                        ? new Date(ticket.targetClosureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Not Set'}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Ticket Raised On</p>
                  <p className="font-bold text-slate-800">
                    {new Date(ticket.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {ticket.closedAt && (
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Ticket Closed / Resolved On</p>
                    <p className="font-bold text-emerald-700">
                      {new Date(ticket.closedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Status Change Control (Level 2/4) */}
            {(currentRole === 'IT_SOFTWARE' || currentRole === 'SUPER_ADMIN' || currentRole === 'MANAGER') && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label className="block font-bold text-slate-700">Update Technical Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl font-semibold bg-white text-xs"
                >
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="NEED_MORE_DETAILS">NEED_MORE_DETAILS</option>
                  <option value="PENDING_TESTING">PENDING_TESTING</option>
                  {(currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN') && (
                    <>
                      <option value="RESOLVED">RESOLVED (Manager/Admin Only)</option>
                      <option value="COMPLETED">COMPLETED (Manager/Admin Only)</option>
                      <option value="CLOSED">CLOSED (Manager/Admin Only)</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Hours Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleLogWork} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Log IT Technical Work Hours</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Environment *</label>
                <select
                  value={workEnv}
                  onChange={(e) => setWorkEnv(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 bg-white font-bold text-slate-900"
                >
                  <option value="DEV">DEV (Development)</option>
                  <option value="UAT">UAT (Staging/QA)</option>
                  <option value="PROD">PROD (Production)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch / Commit Ref</label>
                <input
                  type="text"
                  value={workBranch}
                  onChange={(e) => setWorkBranch(e.target.value)}
                  placeholder="e.g. fix/auth-leak"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 font-mono text-purple-950 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hours Spent (e.g. 2.5) *</label>
              <input
                type="number"
                step="0.5"
                required
                value={hoursSpent}
                onChange={(e) => setHoursSpent(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Log Description *</label>
              <textarea
                required
                rows={3}
                value={workDesc}
                onChange={(e) => setWorkDesc(e.target.value)}
                placeholder="Details of code fix, server config, branch deployment, or bug investigation..."
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 text-slate-900"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
              >
                Submit Work Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Tester Modal */}
      {showTesterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAssignTesterSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-purple-600" />
                <span>Assign Tester for Module Verification</span>
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select QA / Tester User *</label>
              <select
                required
                value={testedByIdState}
                onChange={(e) => setTestedByIdState(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 bg-white font-bold text-slate-900"
              >
                <option value="">-- Choose User for Testing --</option>
                {allUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.replace('_', ' ')}) - {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deployment Env</label>
                <select
                  value={selectedEnv}
                  onChange={(e) => setSelectedEnv(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 bg-white font-bold text-slate-900"
                >
                  <option value="DEV">DEV (Development)</option>
                  <option value="UAT">UAT (Staging/QA)</option>
                  <option value="PROD">PROD (Production)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch / Commit</label>
                <input
                  type="text"
                  value={branchNameState}
                  onChange={(e) => setBranchNameState(e.target.value)}
                  placeholder="e.g. release/v2.4"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 font-mono text-purple-950 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTesterModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
              >
                Assign & Mark Pending Testing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submit Testing Verdict Modal */}
      {showTestResultModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                {testPassedChoice ? (
                  <Check className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span>{testPassedChoice ? 'Pass Module Testing' : 'Fail Module Testing'}</span>
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {testPassedChoice
                ? 'Confirming module test pass will allow managers or admins to mark the ticket as COMPLETED.'
                : 'Failing module test will automatically revert ticket status to IN_PROGRESS and reassign back to the developer with your feedback.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tester Remarks / Feedback {testPassedChoice ? '(Optional)' : '(Required)'}
              </label>
              <textarea
                rows={3}
                required={!testPassedChoice}
                value={testingFeedbackInput}
                onChange={(e) => setTestingFeedbackInput(e.target.value)}
                placeholder={
                  testPassedChoice
                    ? 'e.g. Verified fix on UAT environment. All test cases passed.'
                    : 'e.g. Bug still reproduces when clicking submit button on UAT build...'
                }
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTestResultModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmitTestingResult(testPassedChoice)}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md ${
                  testPassedChoice ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {testPassedChoice ? 'Confirm Test PASSED' : 'Confirm Test FAILED'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#c16d18]" />
                <span>Edit Ticket Details</span>
              </h3>
              <span className="font-mono text-xs font-bold text-[#c16d18]">{ticket.ticketNumber}</span>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {editError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ticket Title *</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description *</label>
              <textarea
                required
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 bg-white font-semibold text-slate-900"
                >
                  <option value="Software Bug">Software Bug</option>
                  <option value="IT Request">IT Request</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Feature Access">Feature Access</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Urgency / Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 bg-white font-semibold text-slate-900"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Priority</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Website / Portal Name</label>
                {configWebsites.length > 0 ? (
                  <select
                    value={editWebsiteName}
                    onChange={(e) => setEditWebsiteName(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 bg-white font-bold text-slate-900"
                  >
                    {editWebsiteName && !configWebsites.some((w) => w.name === editWebsiteName) && (
                      <option value={editWebsiteName}>{editWebsiteName}</option>
                    )}
                    {configWebsites.map((w: any) => (
                      <option key={w.id} value={w.name}>
                        {w.name} {w.url ? `(${w.url})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editWebsiteName}
                    onChange={(e) => setEditWebsiteName(e.target.value)}
                    placeholder="e.g. Client Portal, CRM Web App"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 font-semibold text-slate-900"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Module / Page</label>
                {filteredEditModules.length > 0 ? (
                  <select
                    value={editModule}
                    onChange={(e) => setEditModule(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 bg-white font-bold text-slate-900"
                  >
                    {editModule && !filteredEditModules.some((m) => m.name === editModule) && (
                      <option value={editModule}>{editModule}</option>
                    )}
                    {filteredEditModules.map((m: any) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editModule}
                    onChange={(e) => setEditModule(e.target.value)}
                    placeholder="e.g. Billing, Auth, Reports"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40 font-semibold text-slate-900"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-4 py-2 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {editLoading ? 'Saving...' : 'Save Ticket Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Lightbulb,
  UploadCloud,
  ThumbsUp,
  Globe,
  Layers,
  PlusCircle,
  CheckCircle2,
  X,
  Image as ImageIcon,
  Building,
  UserCheck,
  Ticket as TicketIcon,
} from 'lucide-react';

export default function RecommendationsPage() {
  const { currentUser, getAuthHeaders } = useAuth();
  const currentRole = currentUser?.role || 'GUEST_USER';

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [websites, setWebsites] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [itUsers, setItUsers] = useState<any[]>([]);
  const [convertedTicketMsg, setConvertedTicketMsg] = useState<string>('');

  // Form State
  const [title, setTitle] = useState('');
  const [websiteName, setWebsiteName] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const fetchConfigOptions = async () => {
    try {
      const res = await fetch('/api/v1/config/options', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.websites && data.websites.length > 0) {
        setWebsites(data.websites);
        setWebsiteName(data.websites[0].name);
      }
      if (data.modules && data.modules.length > 0) {
        setModules(data.modules);
        setModuleName(data.modules[0].name);
      }
    } catch (e) {
      console.error('Failed to fetch config options:', e);
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/recommendations', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigOptions();
    fetchRecommendations();

    fetch('/api/v1/teams', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((d) => d.teams && setTeams(d.teams))
      .catch((e) => console.error('Failed to fetch teams:', e));

    if (currentRole === 'MANAGER' || currentRole === 'SUPER_ADMIN' || currentRole === 'IT_SOFTWARE') {
      fetch('/api/v1/admin/users', { headers: getAuthHeaders() })
        .then((res) => res.json())
        .then((d) => {
          if (d.users) {
            const list = d.users.filter((u: any) => u.role === 'IT_SOFTWARE' || u.role === 'MANAGER' || u.role === 'SUPER_ADMIN');
            setItUsers(list.length > 0 ? list : d.users);
          }
        })
        .catch((e) => console.error('Failed to fetch users:', e));
    }
  }, [currentUser]);

  const handleAssignTeam = async (recId: string, teamId: string) => {
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

  const handleAssignSpecialist = async (recId: string, userId: string) => {
    try {
      let targetTeamId = undefined;
      if (userId) {
        const found = itUsers.find((u) => u.id === userId);
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

  const handleConvertToTicket = async (recId: string, teamId?: string, assignedToId?: string) => {
    try {
      const res = await fetch(`/api/v1/recommendations/${recId}/convert-to-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ teamId, assignedToId }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setConvertedTicketMsg(`Suggestion converted to Ticket ${data.ticket.ticketNumber}!`);
        setTimeout(() => setConvertedTicketMsg(''), 5000);
        fetchRecommendations();
      } else {
        alert(data.message || 'Failed to convert suggestion to ticket.');
      }
    } catch (e: any) {
      console.error('Convert to ticket failed:', e);
      alert('Convert to ticket error: ' + (e.message || 'Failed to convert'));
    }
  };

  const itSpecialists = itUsers;

  useEffect(() => {
    fetchRecommendations();
    fetchConfigOptions();
  }, [currentUser]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const displayWebsites = websites.length > 0 ? websites : [
    { id: 'w-1', name: 'Betel PV', url: 'betelpv.orglead.com' },
    { id: 'w-2', name: 'Betel Meet', url: 'betelmeet.orglead.com' },
    { id: 'w-3', name: 'Platform Global Hub', url: 'hub.platformglobal.org' }
  ];

  const displayModules = modules.length > 0 ? modules : [
    { id: 'm-1', name: 'Billing & Invoicing' },
    { id: 'm-2', name: 'Auth & SSO' },
    { id: 'm-3', name: 'Infrastructure & Server Operations' }
  ];

  const handleSubmitRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const finalWebsite = websiteName || (displayWebsites.length > 0 ? displayWebsites[0].name : 'Betel PV');
    const finalModule = moduleName || (displayModules.length > 0 ? displayModules[0].name : 'Billing & Invoicing');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          websiteName: finalWebsite,
          moduleName: finalModule,
          screenshotUrl: screenshotUrl || undefined,
          authorId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (data.success || data.recommendation) {
        setTitle('');
        setDescription('');
        setScreenshotUrl('');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
        fetchRecommendations();
      } else {
        alert(data.message || 'Failed to submit recommendation.');
      }
    } catch (err) {
      console.error('Failed to submit suggestion:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (recId: string) => {
    if (!currentUser?.id) return;

    // Optimistic UI update for instant feedback
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
    } catch (err) {
      console.error('Failed to upvote recommendation:', err);
      fetchRecommendations();
    }
  };

  const handleUpdateStatus = async (recId: string, status: string) => {
    try {
      await fetch(`/api/v1/recommendations/${recId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to update recommendation status:', err);
    }
  };

  const filtered = recommendations.filter((r) => activeTab === 'ALL' || r.status === activeTab);

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-[#c16d18] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce text-xs font-bold">
          <CheckCircle2 className="w-5 h-5" />
          <span>Feature suggestion submitted successfully!</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#c16d18] to-[#d97d20] text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="bg-white/20 text-amber-100 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full">
            Feature Suggestion Portal
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">Customer Feature & Improvement Suggestions</h1>
        <p className="text-xs text-amber-100 max-w-2xl">
          Submit feature ideas with mockup screenshots, vote on popular community recommendations, and track development status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Submit Suggestion Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#c16d18]" />
              <span>Submit New Recommendation</span>
            </h2>

            <form onSubmit={handleSubmitRecommendation} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Website / Platform</label>
                <select
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18]/40 focus:outline-none font-bold text-slate-800"
                >
                  {displayWebsites.map((w: any) => (
                    <option key={w.id} value={w.name}>
                      {w.name} {w.url ? `(${w.url})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Module / Page</label>
                <select
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18]/40 focus:outline-none font-bold text-slate-800"
                >
                  {displayModules.map((m: any) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Feature Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dark Mode Toggle & High-Contrast Support"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18]/40 focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Feature Description & Value</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain how this feature improves user workflow..."
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mockup / Screenshot Preview</label>
                <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 text-center relative cursor-pointer hover:bg-amber-50/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="w-6 h-6 text-[#c16d18] mx-auto mb-1" />
                  <p className="font-bold text-slate-700 text-[11px]">Upload mockup screenshot</p>
                </div>

                {screenshotUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 max-h-32">
                    <img src={screenshotUrl} alt="Preview" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white font-bold text-xs shadow-md shadow-[#c16d18]/20 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Feature Suggestion</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Recommendations Stream & Voting */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Tabs */}
          <div className="flex flex-wrap bg-white p-2 rounded-2xl border border-slate-200 shadow-xs gap-1">
            {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'PLANNED', 'IN_DEVELOPMENT', 'IMPLEMENTED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab
                  ? 'bg-[#c16d18] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {convertedTicketMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{convertedTicketMsg}</span>
            </div>
          )}

          {/* Recommendations Stream */}
          {loading ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-semibold">
              Loading feature suggestions from database...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <Lightbulb className="w-10 h-10 text-amber-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No suggestions in this status</h3>
              <p className="text-xs text-slate-400">Be the first to submit a suggestion!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-amber-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          {rec.status.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {rec.websiteName} • {rec.moduleName}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">{rec.title}</h3>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {(() => {
                        const hasUserVoted = Array.isArray(rec.votes)
                          ? rec.votes.some((v: any) => v.userId === currentUser?.id)
                          : (rec.votedUserIds && Array.isArray(rec.votedUserIds) ? rec.votedUserIds.includes(currentUser?.id) : rec.userVoted);

                        return (
                          <button
                            onClick={() => handleUpvote(rec.id)}
                            title={hasUserVoted ? "Click to remove your upvote" : "Click to upvote this suggestion"}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                              hasUserVoted
                                ? 'bg-[#c16d18] text-white border border-[#c16d18] shadow-amber-600/30 ring-2 ring-[#c16d18]/20'
                                : 'border border-amber-300 bg-amber-50 hover:bg-[#c16d18] hover:text-white text-[#c16d18]'
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${hasUserVoted ? 'fill-white' : ''}`} />
                            <span>{hasUserVoted ? `Upvoted (${rec.upvotes})` : `Upvote (${rec.upvotes})`}</span>
                          </button>
                        );
                      })()}

                      {(currentRole === 'SUPER_ADMIN' || currentRole === 'MANAGER') && (
                        <select
                          value={rec.status}
                          onChange={(e) => handleUpdateStatus(rec.id, e.target.value)}
                          className="px-2.5 py-1 text-[11px] font-bold border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="SUBMITTED">Submitted</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="PLANNED">Planned</option>
                          <option value="IN_DEVELOPMENT">In Development</option>
                          <option value="IMPLEMENTED">Implemented</option>
                          <option value="DECLINED">Declined</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{rec.description}</p>

                  {rec.screenshotUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48">
                      <img src={rec.screenshotUrl} alt={rec.title} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}

                  {/* Team & Specialist Assignment Bar for Manager/Super Admin */}
                  {(currentRole === 'SUPER_ADMIN' || currentRole === 'MANAGER') && (
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Building className="w-3 h-3 text-[#c16d18]" />
                          <span>Team:</span>
                        </span>
                        <select
                          value={rec.teamId || ''}
                          onChange={(e) => handleAssignTeam(rec.id, e.target.value)}
                          className="px-2 py-1 text-[11px] font-bold border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="">-- Assign Team --</option>
                          {teams.map((t: any) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          <span>Specialist:</span>
                        </span>
                        <select
                          value={rec.assignedToId || ''}
                          onChange={(e) => handleAssignSpecialist(rec.id, e.target.value)}
                          className="px-2 py-1 text-[11px] font-bold border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="">-- Unassigned --</option>
                          {itSpecialists
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
                      </div>

                      {rec.status === 'IN_DEVELOPMENT' || rec.status === 'IMPLEMENTED' ? (
                        <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1 sm:ml-auto">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Converted to Ticket</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConvertToTicket(rec.id, rec.teamId, rec.assignedToId)}
                          className="px-3 py-1.5 bg-[#c16d18] hover:bg-[#a35810] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-xs transition-all sm:ml-auto"
                        >
                          <TicketIcon className="w-3.5 h-3.5" />
                          <span>Convert to Active Ticket</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span>Suggested by: <strong className="text-slate-700">{rec.author?.name || 'Guest User'}</strong></span>
                      {(rec.team || (rec.teamId && teams.find((t: any) => t.id === rec.teamId))) && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full font-bold border border-blue-200 text-[10px]">
                          Team: {rec.team?.name || teams.find((t: any) => t.id === rec.teamId)?.name}
                        </span>
                      )}
                      {(rec.assignedTo || (rec.assignedToId && itUsers.find((u: any) => u.id === rec.assignedToId))) && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-bold border border-emerald-200 text-[10px]">
                          Assigned: {rec.assignedTo?.name || itUsers.find((u: any) => u.id === rec.assignedToId)?.name}
                        </span>
                      )}
                    </div>
                    <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

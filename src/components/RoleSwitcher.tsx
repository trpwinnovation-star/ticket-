'use client';

import React from 'react';
import { useRole } from '@/context/RoleContext';
import { Role } from '@/lib/db';
import { ShieldCheck, UserCheck, Wrench, Crown, RefreshCw } from 'lucide-react';

const ROLES_CONFIG: {
  role: Role;
  level: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  badgeBg: string;
}[] = [
  {
    role: 'GUEST_USER',
    level: 'Level 1',
    title: 'Guest / Standard User',
    desc: 'Raise support tickets, upload attachments, track progress, & submit suggestions.',
    icon: UserCheck,
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    role: 'IT_SOFTWARE',
    level: 'Level 2',
    title: 'IT / Software Team',
    desc: 'Work on assigned tickets, log work hours, update technical status, add internal notes.',
    icon: Wrench,
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    role: 'MANAGER',
    level: 'Level 3',
    title: 'Manager / Account Lead',
    desc: 'Review incoming tickets, approve/reject requests, assign IT staff, resolve issues.',
    icon: ShieldCheck,
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    role: 'SUPER_ADMIN',
    level: 'Level 4',
    title: 'Platform Super Admin',
    desc: 'Global metrics dashboard, track logged hours, manage Subcontractor Teams & audit logs.',
    icon: Crown,
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
  },
];

export default function RoleSwitcher() {
  const { currentRole, switchRole, currentUser, resetDemoData } = useRole();

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 py-2.5 px-4 sm:px-8 text-xs font-medium">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Active perspective */}
        <div className="flex items-center gap-2">
          <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-amber-500/40">
            Role Switcher Toolbar
          </span>
          <span className="text-slate-400 hidden sm:inline">Active Perspective:</span>
          <span className="font-semibold text-white flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-4 h-4 rounded-full object-cover"
            />
            {currentUser.name} ({currentUser.jobTitle})
          </span>
        </div>

        {/* Center: Role Selectors */}
        <div className="flex flex-wrap items-center gap-1.5">
          {ROLES_CONFIG.map((item) => {
            const Icon = item.icon;
            const isActive = currentRole === item.role;
            return (
              <button
                key={item.role}
                onClick={() => switchRole(item.role)}
                title={item.desc}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all text-xs font-semibold ${
                  isActive
                    ? 'bg-[#c16d18] text-white shadow-md shadow-[#c16d18]/30 ring-2 ring-[#c16d18]/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.level}: {item.title.split('/')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Reset Demo Data */}
        <button
          onClick={resetDemoData}
          className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors self-end md:self-auto text-[11px]"
          title="Reset demo tickets, work logs, and recommendations"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );
}

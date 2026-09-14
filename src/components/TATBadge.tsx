'use client';

import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, Hourglass } from 'lucide-react';
import { getTicketTAT, TATResult } from '@/lib/tat';

interface TATBadgeProps {
  ticket: any;
  size?: 'xs' | 'sm' | 'md';
  showDetails?: boolean;
}

export default function TATBadge({ ticket, size = 'sm', showDetails = false }: TATBadgeProps) {
  const tat: TATResult = getTicketTAT(ticket);

  if (!tat.isApproved) {
    return (
      <span
        title={tat.slaLabel}
        className={`inline-flex items-center gap-1 font-bold rounded-md uppercase tracking-wider ${
          size === 'xs'
            ? 'px-1.5 py-0.5 text-[9px]'
            : size === 'sm'
            ? 'px-2 py-0.5 text-[10px]'
            : 'px-2.5 py-1 text-xs'
        } ${
          tat.badgeVariant === 'red'
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}
      >
        <Hourglass className="w-3 h-3 text-slate-400" />
        <span>{tat.badgeText}</span>
      </span>
    );
  }

  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[tat.badgeVariant];

  const iconStyles = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    red: 'text-red-600 animate-pulse',
    slate: 'text-slate-500',
  }[tat.badgeVariant];

  const Icon = tat.isClosed
    ? tat.isOverdue
      ? AlertTriangle
      : CheckCircle2
    : tat.isOverdue
    ? AlertTriangle
    : Clock;

  return (
    <span
      title={`Approved: ${tat.approvedAt ? tat.approvedAt.toLocaleString() : 'N/A'} • ${tat.slaLabel}`}
      className={`inline-flex items-center gap-1 font-bold rounded-md border shadow-2xs transition-all ${
        size === 'xs'
          ? 'px-1.5 py-0.5 text-[9px]'
          : size === 'sm'
          ? 'px-2 py-0.5 text-[10px]'
          : 'px-2.5 py-1 text-xs'
      } ${variantStyles}`}
    >
      <Icon className={`shrink-0 ${size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${iconStyles}`} />
      <span className="font-mono">{tat.badgeText}</span>
      {showDetails && tat.targetClosureDate && (
        <span className="text-[10px] opacity-75 font-normal ml-0.5">
          ({tat.slaLabel})
        </span>
      )}
    </span>
  );
}

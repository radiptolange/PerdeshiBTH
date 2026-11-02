import React from 'react';
import { cn } from '@/lib/utils';
import { MatchStatus } from '@/types/match';
import { TournamentStatus } from '@/types/tournament';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'live' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan' | 'gold';
  status?: MatchStatus | TournamentStatus | string;
}

export function Badge({ children, variant = 'default', status, className, ...props }: BadgeProps) {
  let resolvedVariant = variant;

  if (status) {
    switch (status) {
      case 'LIVE':
        resolvedVariant = 'live';
        break;
      case 'COMPLETED':
      case 'CONFIRMED':
      case 'APPROVED':
        resolvedVariant = 'success';
        break;
      case 'SCHEDULED':
      case 'REGISTRATION_OPEN':
      case 'PUBLISHED':
        resolvedVariant = 'cyan';
        break;
      case 'ONGOING':
        resolvedVariant = 'purple';
        break;
      case 'UNDER_REVIEW':
      case 'AWAITING_RESULT':
      case 'WAITING_CONFIRMATION':
      case 'PENDING':
        resolvedVariant = 'warning';
        break;
      case 'DISPUTED':
      case 'FORFEITED':
      case 'CANCELLED':
      case 'REJECTED':
      case 'SUSPENDED':
        resolvedVariant = 'danger';
        break;
      default:
        resolvedVariant = 'default';
    }
  }

  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    live: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse font-bold',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    purple: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    gold: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase',
        variantStyles[resolvedVariant],
        className
      )}
      {...props}
    >
      {resolvedVariant === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
      {children || status}
    </span>
  );
}


'use client';

import React from 'react';
import { MatchWithParticipants } from '@/types/match';
import { Badge } from '../ui/Badge';
import { cn, formatDateKathmandu } from '@/lib/utils';
import { Shield, Clock, AlertTriangle, ArrowRightLeft } from 'lucide-react';

export interface MatchCardProps {
  match: MatchWithParticipants;
  onClick?: (match: MatchWithParticipants) => void;
  compact?: boolean;
}

export function MatchCard({ match, onClick, compact = false }: MatchCardProps) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const isDisputed = match.status === 'DISPUTED';
  const homeIsWinner = isCompleted && match.winner_id === match.home_participant_id;
  const awayIsWinner = isCompleted && match.winner_id === match.away_participant_id;

  return (
    <div
      onClick={() => onClick && onClick(match)}
      className={cn(
        'group relative rounded-xl bg-[#1A2035] border transition-all duration-200 cursor-pointer overflow-hidden select-none',
        isLive
          ? 'border-red-500/60 shadow-glow-crimson ring-1 ring-red-500/50'
          : isDisputed
          ? 'border-rose-500/50 shadow-glow-crimson'
          : 'border-white/10 hover:border-violet-500/60 hover:shadow-glow-purple',
        compact ? 'w-[260px]' : 'w-[290px]'
      )}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#121626]/90 border-b border-white/5 text-[11px]">
        <span className="font-mono font-medium text-slate-400 tracking-wider">
          {match.id}
        </span>
        <Badge status={match.status} className="text-[10px] px-2 py-0">
          {match.status}
        </Badge>
      </div>

      {/* Participants Rows */}
      <div className="p-2.5 space-y-2">
        {/* Home Participant */}
        <div
          className={cn(
            'flex items-center justify-between p-1.5 rounded-lg transition-colors',
            homeIsWinner ? 'bg-emerald-500/10 font-bold text-white' : 'text-slate-300',
            !match.home_participant && 'opacity-50 italic'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-6 h-6 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden text-xs">
              {match.home_participant?.avatar_url ? (
                <img
                  src={match.home_participant.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="truncate text-xs">
              {match.home_participant ? (
                <span className="flex items-center gap-1.5">
                  {match.home_participant.seed && (
                    <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                      #{match.home_participant.seed}
                    </span>
                  )}
                  <span className="truncate">{match.home_participant.display_name}</span>
                </span>
              ) : (
                <span className="text-slate-500">TBD</span>
              )}
            </div>
          </div>
          <div
            className={cn(
              'font-mono text-sm px-2 py-0.5 rounded bg-black/40 border shrink-0',
              homeIsWinner ? 'border-emerald-500/50 text-emerald-400' : 'border-white/5 text-slate-400'
            )}
          >
            {isCompleted || isLive ? match.home_score : '-'}
          </div>
        </div>

        {/* Away Participant */}
        <div
          className={cn(
            'flex items-center justify-between p-1.5 rounded-lg transition-colors',
            awayIsWinner ? 'bg-emerald-500/10 font-bold text-white' : 'text-slate-300',
            !match.away_participant && 'opacity-50 italic'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-6 h-6 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden text-xs">
              {match.away_participant?.avatar_url ? (
                <img
                  src={match.away_participant.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="truncate text-xs">
              {match.away_participant ? (
                <span className="flex items-center gap-1.5">
                  {match.away_participant.seed && (
                    <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                      #{match.away_participant.seed}
                    </span>
                  )}
                  <span className="truncate">{match.away_participant.display_name}</span>
                </span>
              ) : (
                <span className="text-slate-500">TBD</span>
              )}
            </div>
          </div>
          <div
            className={cn(
              'font-mono text-sm px-2 py-0.5 rounded bg-black/40 border shrink-0',
              awayIsWinner ? 'border-emerald-500/50 text-emerald-400' : 'border-white/5 text-slate-400'
            )}
          >
            {isCompleted || isLive ? match.away_score : '-'}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      {match.scheduled_time && (
        <div className="px-3 py-1 bg-[#121626]/50 border-t border-white/5 text-[10px] text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span className="truncate">{formatDateKathmandu(match.scheduled_time)}</span>
        </div>
      )}
    </div>
  );
}


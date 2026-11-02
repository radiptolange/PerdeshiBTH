'use client';

import React, { useState, useMemo } from 'react';
import { MatchWithParticipants } from '@/types/match';
import { MatchCard } from '../match/MatchCard';
import { MatchDetailModal } from '../match/MatchDetailModal';
import { Button } from '../ui/Button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Trophy, ListOrdered, GitFork } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VisualBracketProps {
  matches: MatchWithParticipants[];
  onRefresh?: () => void;
}

export function VisualBracket({ matches, onRefresh }: VisualBracketProps) {
  const [selectedMatch, setSelectedMatch] = useState<MatchWithParticipants | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'TREE' | 'ROUNDS'>('TREE');
  const [selectedRoundTab, setSelectedRoundTab] = useState<number>(1);

  // Group matches by round
  const rounds = useMemo(() => {
    const map = new Map<number, { roundNumber: number; roundName: string; matches: MatchWithParticipants[] }>();

    for (const match of matches) {
      if (!map.has(match.round_number)) {
        map.set(match.round_number, {
          roundNumber: match.round_number,
          roundName: match.round_name,
          matches: [],
        });
      }
      map.get(match.round_number)!.matches.push(match);
    }

    // Sort rounds ascending
    return Array.from(map.values()).sort((a, b) => a.roundNumber - b.roundNumber);
  }, [matches]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.65));
  const handleResetZoom = () => setZoomLevel(1);

  const grandFinalMatch = useMemo(() => {
    return matches.find((m) => m.bracket_type === 'GRAND_FINAL' && m.status === 'COMPLETED');
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#121626] border border-white/5 space-y-3">
        <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-300">Bracket Not Generated Yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Tournament participants are confirmed. Click &quot;Generate Bracket&quot; in the Admin Console to draw the fixtures.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl bg-[#0E121E] border border-white/10 overflow-hidden shadow-2xl">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#121626]/90 border-b border-white/10 gap-3 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" /> Interactive Bracket
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {matches.length} Fixtures • {rounds.length} Rounds
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher for Mobile */}
          <div className="flex rounded-lg bg-slate-900 p-0.5 border border-white/5 text-xs">
            <button
              onClick={() => setViewMode('TREE')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1',
                viewMode === 'TREE' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              )}
            >
              <GitFork className="w-3.5 h-3.5" /> Tree View
            </button>
            <button
              onClick={() => setViewMode('ROUNDS')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1',
                viewMode === 'ROUNDS' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              )}
            >
              <ListOrdered className="w-3.5 h-3.5" /> Round View
            </button>
          </div>

          {/* Zoom controls */}
          {viewMode === 'TREE' && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Champion Banner (If grand final is completed) */}
      {grandFinalMatch?.winner_id && (
        <div className="bg-gradient-to-r from-amber-500/20 via-violet-600/20 to-amber-500/20 border-b border-amber-500/30 px-6 py-2.5 text-center flex items-center justify-center gap-2 animate-in fade-in">
          <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
          <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">Tournament Champion:</span>
          <span className="text-sm font-black text-white">
            {grandFinalMatch.winner_id === grandFinalMatch.home_participant_id
              ? grandFinalMatch.home_participant?.display_name
              : grandFinalMatch.away_participant?.display_name}
          </span>
        </div>
      )}

      {/* Main Bracket Canvas */}
      {viewMode === 'TREE' ? (
        <div className="p-6 overflow-x-auto min-h-[540px] flex items-center justify-start cursor-grab active:cursor-grabbing">
          <div
            className="flex gap-12 sm:gap-16 items-stretch transition-transform duration-150 origin-top-left"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {rounds.map((round, rIndex) => (
              <div key={round.roundNumber} className="flex flex-col min-w-[280px]">
                {/* Round Header */}
                <div className="mb-6 text-center pb-2 border-b border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 font-mono">
                    {round.roundName}
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    {round.matches.length} {round.matches.length === 1 ? 'Match' : 'Matches'}
                  </span>
                </div>

                {/* Match Cards Column with evenly spaced distribution */}
                <div className="flex-1 flex flex-col justify-around gap-6 py-2">
                  {round.matches.map((m) => (
                    <div key={m.id} className="relative flex items-center">
                      <MatchCard match={m} onClick={setSelectedMatch} />

                      {/* Right SVG Connector line if not last round */}
                      {rIndex < rounds.length - 1 && (
                        <div className="hidden sm:block absolute right-[-48px] sm:right-[-64px] top-1/2 w-12 sm:w-16 h-0.5 bg-gradient-to-r from-violet-500/60 to-transparent pointer-events-none" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Round-by-Round Tabbed View (Mobile & Tablet optimized) */
        <div className="p-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
            {rounds.map((r) => (
              <button
                key={r.roundNumber}
                onClick={() => setSelectedRoundTab(r.roundNumber)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer',
                  selectedRoundTab === r.roundNumber
                    ? 'bg-violet-600 text-white shadow-glow-purple'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                )}
              >
                {r.roundName}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rounds
              .find((r) => r.roundNumber === selectedRoundTab)
              ?.matches.map((m) => (
                <div key={m.id} className="flex justify-center">
                  <MatchCard match={m} onClick={setSelectedMatch} compact={false} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Match Detail & Progression Modal */}
      {selectedMatch && (
        <MatchDetailModal
          matchId={selectedMatch.id}
          isOpen={Boolean(selectedMatch)}
          onClose={() => setSelectedMatch(null)}
          onMatchUpdated={() => {
            onRefresh && onRefresh();
          }}
        />
      )}
    </div>
  );
}


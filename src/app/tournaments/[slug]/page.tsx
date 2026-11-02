'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VisualBracket } from '@/components/bracket/VisualBracket';
import { StandingsTable } from '@/components/tournament/StandingsTable';
import { MatchCard } from '@/components/match/MatchCard';
import { MatchDetailModal } from '@/components/match/MatchDetailModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateKathmandu } from '@/lib/utils';
import {
  Trophy,
  GitFork,
  ListOrdered,
  Users,
  FileText,
  Clock,
  Sparkles,
  Award,
  RefreshCw,
  Shield,
  Settings,
} from 'lucide-react';

export default function TournamentDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [tournament, setTournament] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BRACKET' | 'STANDINGS' | 'MATCHES' | 'PARTICIPANTS' | 'RULES'>('BRACKET');
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (slug) {
      loadTournamentData();
    }
  }, [slug]);

  const loadTournamentData = async () => {
    setLoading(true);
    try {
      // 1. Fetch tournament info, participants, standings
      const res = await fetch(`/api/tournaments/${slug}`);
      const data = await res.json();
      if (res.ok) {
        setTournament(data.tournament);
        setParticipants(data.participants || []);
        setStandings(data.standings || []);

        // 2. Fetch matches
        const mRes = await fetch(`/api/tournaments/${data.tournament.id}/matches`);
        const mData = await mRes.json();
        if (mRes.ok) {
          setMatches(mData.matches || []);
        }
      }
    } catch (err) {
      console.error('Failed to load tournament data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBracket = async () => {
    if (!tournament) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/generate-bracket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true, seeding: 'SEEDED' }),
      });
      if (res.ok) {
        loadTournamentData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-400 text-sm">
        Loading tournament data and bracket matrix...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Tournament Not Found</h2>
        <p className="text-xs text-slate-400">The requested tournament could not be located in the system.</p>
      </div>
    );
  }

  const isRoundRobin = tournament.format === 'ROUND_ROBIN' || tournament.format === 'GROUP_STAGE_KNOCKOUT';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tournament Banner & Header */}
      <div className="rounded-2xl bg-[#121626] border border-white/10 overflow-hidden shadow-2xl">
        <div className="h-56 sm:h-72 w-full bg-slate-900 relative overflow-hidden">
          <img
            src={tournament.banner_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200'}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121626] via-[#121626]/60 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-xs font-bold text-cyan-400 uppercase tracking-wider border border-white/15">
              {tournament.game}
            </span>
            <span className="px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-xs font-mono text-slate-300 uppercase tracking-wider border border-white/15">
              {tournament.format.replace(/_/g, ' ')}
            </span>
            <Badge status={tournament.status} />
          </div>

          {/* Banner Meta Info */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wider font-mono">
                {tournament.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {tournament.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-mono">
                <span>Start: <strong>{formatDateKathmandu(tournament.start_date)}</strong></span>
                <span>Participants: <strong>{participants.length}</strong></span>
                {tournament.prize_pool && (
                  <span className="text-amber-400 font-bold">🏆 {tournament.prize_pool}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={loadTournamentData}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
              </Button>
              {matches.length === 0 && (
                <Button size="sm" variant="glow" onClick={handleGenerateBracket} isLoading={isGenerating}>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Draw Bracket
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-t border-white/10 bg-[#1A2035]/80 flex gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('BRACKET')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'BRACKET'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-4 h-4" /> Visual Bracket ({matches.length})
          </button>

          {isRoundRobin && (
            <button
              onClick={() => setActiveTab('STANDINGS')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'STANDINGS'
                  ? 'border-violet-500 text-violet-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" /> Standings Table
            </button>
          )}

          <button
            onClick={() => setActiveTab('MATCHES')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'MATCHES'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4" /> All Fixtures
          </button>

          <button
            onClick={() => setActiveTab('PARTICIPANTS')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'PARTICIPANTS'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Participants ({participants.length})
          </button>

          <button
            onClick={() => setActiveTab('RULES')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'RULES'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Rules & Regulations
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="space-y-6">
        {/* TAB 1: Visual Bracket Canvas */}
        {activeTab === 'BRACKET' && (
          <VisualBracket matches={matches} onRefresh={loadTournamentData} />
        )}

        {/* TAB 2: Standings Table */}
        {activeTab === 'STANDINGS' && (
          <StandingsTable standings={standings} title={`${tournament.title} • Standings`} />
        )}

        {/* TAB 3: All Fixtures List */}
        {activeTab === 'MATCHES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Tournament Fixture List
              </h3>
              <span className="text-xs text-slate-400">{matches.length} Total Matches</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((m) => (
                <div key={m.id} className="flex justify-center">
                  <MatchCard match={m} onClick={setSelectedMatch} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Participants */}
        {activeTab === 'PARTICIPANTS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Confirmed Participants
              </h3>
              <span className="text-xs text-slate-400">{participants.length} Teams Registered</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-[#121626] border border-white/5 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                      {p.seed && (
                        <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                          #{p.seed}
                        </span>
                      )}
                      <span>{p.display_name}</span>
                    </div>
                    {p.tag && <div className="text-xs text-cyan-400 font-mono">[{p.tag}]</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Rules & Regulations */}
        {activeTab === 'RULES' && (
          <div className="p-6 rounded-2xl bg-[#121626] border border-white/10 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Official Rulebook & Settings
            </h3>
            <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
              <p className="whitespace-pre-line">{tournament.rules_markdown}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block font-medium">Substitutions Allowed</span>
                <strong className="text-slate-200">
                  {tournament.substitutions_allowed ? `Yes (Max ${tournament.max_substitutions_per_match})` : 'No'}
                </strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block font-medium">Referee Approval</span>
                <strong className="text-slate-200">
                  {tournament.requires_referee_approval ? 'Mandatory Sign-off' : 'Optional'}
                </strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block font-medium">Default Timezone</span>
                <strong className="text-slate-200">{tournament.timezone}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Match Modal */}
      {selectedMatch && (
        <MatchDetailModal
          matchId={selectedMatch.id}
          isOpen={Boolean(selectedMatch)}
          onClose={() => setSelectedMatch(null)}
          onMatchUpdated={loadTournamentData}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MatchDetailModal } from '@/components/match/MatchDetailModal';
import {
  Trophy,
  Users,
  Shield,
  Play,
  Clock,
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  GitFork,
  CheckCircle2,
  Settings,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [pendingMatches, setPendingMatches] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Load tournaments
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      if (res.ok) {
        setTournaments(data.tournaments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawBracket = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/generate-bracket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true, seeding: 'SEEDED' }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotice(`Bracket successfully drawn for tournament!`);
        loadDashboardData();
      } else {
        setActionNotice(data.error || 'Failed to draw bracket');
      }
    } catch (err: any) {
      setActionNotice(err.message);
    }
  };

  const handleUpdateStatus = async (tournamentId: string, status: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeTournamentsCount = tournaments.filter((t) => t.status === 'ONGOING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-mono text-[11px] font-bold uppercase tracking-wider border border-violet-500/30">
              Admin Command Center
            </span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mt-1 flex items-center gap-2 font-sans">
            Tournament Management Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time bracket generator, match approvals, and tournament lifecycle controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Link href="/admin/create">
            <Button variant="glow" size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" /> New Tournament
            </Button>
          </Link>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-200 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121626] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-violet-400" /> Total Tournaments
          </div>
          <div className="text-2xl font-black text-white font-mono">{tournaments.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121626] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-emerald-400" /> Active Tournaments
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{activeTournamentsCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121626] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" /> Registered Clans
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">8 Clans</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121626] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Timezone
          </div>
          <div className="text-sm font-bold text-slate-200 font-mono mt-1">Asia/Kathmandu (+5:45)</div>
        </div>
      </div>

      {/* Active Tournaments Management Table */}
      <div className="rounded-xl bg-[#121626] border border-white/10 overflow-hidden shadow-xl space-y-3">
        <div className="p-4 bg-[#1A2035] border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Trophy className="w-4 h-4 text-violet-400" /> Tournament Operations Directory
          </h2>
          <span className="text-xs text-slate-400 font-mono">{tournaments.length} Tournaments Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-white/5 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tournament</th>
                <th className="py-3 px-3">Game</th>
                <th className="py-3 px-3">Format</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Matches</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {tournaments.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-sm">{t.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{t.slug}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-cyan-400">{t.game}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{t.format.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-3">
                    <Badge status={t.status} />
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                    {t.total_matches_count || 0}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link href={`/tournaments/${t.slug}`}>
                      <Button size="sm" variant="outline" className="text-xs py-1">
                        View Bracket
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleDrawBracket(t.id)}
                      className="text-xs py-1"
                    >
                      <GitFork className="w-3.5 h-3.5 mr-1" /> Draw Bracket
                    </Button>

                    <select
                      value={t.status}
                      onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded bg-slate-900 border border-white/10 text-slate-300 focus:outline-none"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="REGISTRATION_OPEN">Registration Open</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="PAUSED">Paused</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Match Modal */}
      {selectedMatchId && (
        <MatchDetailModal
          matchId={selectedMatchId}
          isOpen={Boolean(selectedMatchId)}
          onClose={() => setSelectedMatchId(null)}
          onMatchUpdated={loadDashboardData}
        />
      )}
    </div>
  );
}


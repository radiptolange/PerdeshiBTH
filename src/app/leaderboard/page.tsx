import React from 'react';
import { query } from '@/lib/db';
import { Award, Trophy, TrendingUp, Users, Shield } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function LeaderboardPage() {
  // Aggregate stats across all completed matches for clans
  const clanStats = query<any>(
    `SELECT c.id, c.name, c.tag, c.country,
            count(ts.id) as tournaments_played,
            sum(ts.played) as total_played,
            sum(ts.won) as total_won,
            sum(ts.drawn) as total_drawn,
            sum(ts.lost) as total_lost,
            sum(ts.goals_for) as total_gf,
            sum(ts.goals_against) as total_ga,
            sum(ts.goal_difference) as total_gd,
            sum(ts.points) as total_points
     FROM clans c
     LEFT JOIN tournament_participants tp ON tp.participant_id = c.id
     LEFT JOIN tournament_standings ts ON ts.participant_id = tp.id
     GROUP BY c.id
     ORDER BY total_points DESC, total_gd DESC`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-black text-white uppercase tracking-wide flex items-center gap-2.5">
          <Award className="w-8 h-8 text-amber-400" /> BTH Esports Leaderboards & Rankings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Official competitive tier standings computed directly from verified tournament results
        </p>
      </div>

      {/* Main Leaderboard Table */}
      <div className="rounded-2xl bg-[#121626] border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#1A2035] border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Clan Championship Tier Rankings
          </h2>
          <span className="text-xs text-slate-400 font-mono">Season 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-white/5 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 text-center w-14">Rank</th>
                <th className="py-3 px-4">Clan / Organization</th>
                <th className="py-3 px-3 text-center">MP</th>
                <th className="py-3 px-3 text-center text-emerald-400">W</th>
                <th className="py-3 px-3 text-center text-amber-400">D</th>
                <th className="py-3 px-3 text-center text-rose-400">L</th>
                <th className="py-3 px-3 text-center hidden sm:table-cell">GF</th>
                <th className="py-3 px-3 text-center hidden sm:table-cell">GA</th>
                <th className="py-3 px-3 text-center font-mono">GD</th>
                <th className="py-3 px-4 text-center font-bold text-white font-mono bg-violet-950/40">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {clanStats.map((clan, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;

                return (
                  <tr key={clan.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {isFirst ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-glow-gold">
                          1
                        </span>
                      ) : isSecond ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 text-xs font-black">
                          2
                        </span>
                      ) : isThird ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-black">
                          3
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-cyan-400 font-mono shadow">
                          {clan.tag}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 text-sm">{clan.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{clan.country}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">{clan.total_played || 0}</td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-emerald-400">
                      {clan.total_won || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-amber-400">
                      {clan.total_drawn || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-rose-400">
                      {clan.total_lost || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400 hidden sm:table-cell">
                      {clan.total_gf || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400 hidden sm:table-cell">
                      {clan.total_ga || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold">
                      <span
                        className={
                          (clan.total_gd || 0) > 0
                            ? 'text-emerald-400'
                            : (clan.total_gd || 0) < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {(clan.total_gd || 0) > 0 ? `+${clan.total_gd}` : clan.total_gd || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-black text-white text-base bg-violet-950/40">
                      {clan.total_points || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

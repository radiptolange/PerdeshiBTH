import React from 'react';
import { query } from '@/lib/db';
import { Shield, Users, Trophy, Award, MapPin } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ClansDirectoryPage() {
  const clans = query<any>(
    `SELECT c.*, u.display_name as leader_name, count(r.id) as roster_count
     FROM clans c
     LEFT JOIN users u ON u.id = c.leader_id
     LEFT JOIN clan_rosters r ON r.clan_id = c.id
     GROUP BY c.id
     ORDER BY c.name ASC`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-black text-white uppercase tracking-wide flex items-center gap-2.5">
          <Shield className="w-8 h-8 text-violet-400" /> Competitive Clans & Rosters
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Official esports organizations and player lineups registered in the BTH ecosystem
        </p>
      </div>

      {/* Clans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clans.map((clan: any) => {
          // Fetch members for this clan
          const members = query<any>(
            `SELECT r.*, u.username, u.display_name, u.avatar_url, u.role
             FROM clan_rosters r
             JOIN users u ON u.id = r.user_id
             WHERE r.clan_id = ?
             ORDER BY CASE WHEN r.role_in_clan = 'LEADER' THEN 1 ELSE 2 END`,
            [clan.id]
          );

          return (
            <div
              key={clan.id}
              className="rounded-2xl bg-[#121626] border border-white/10 hover:border-violet-500/40 transition shadow-xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Banner */}
                <div className="p-5 bg-[#1A2035] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center font-bold text-base text-cyan-400 font-mono shadow">
                      {clan.tag}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{clan.name}</h3>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-violet-400" /> {clan.country}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[10px] font-bold font-mono">
                    {clan.roster_count || members.length} PLAYERS
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-400 line-clamp-2">{clan.description}</p>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">
                      Active Roster Lineup
                    </span>
                    <div className="space-y-1.5">
                      {members.map((m: any) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-slate-800 text-[10px] flex items-center justify-center text-slate-300 font-mono">
                              {m.role_in_clan === 'LEADER' ? '👑' : '🎮'}
                            </div>
                            <span className="font-semibold text-slate-200">{m.display_name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                            {m.role_in_clan}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#1A2035]/60 border-t border-white/5 text-xs text-right">
                <Link
                  href="/tournaments"
                  className="text-violet-400 hover:text-cyan-400 font-semibold text-xs transition"
                >
                  View Active Tournaments →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


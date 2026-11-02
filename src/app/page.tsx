import React from 'react';
import Link from 'next/link';
import { query } from '@/lib/db';
import { Trophy, Shield, Users, Flame, ArrowRight, Zap, Target, Award, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MatchCard } from '@/components/match/MatchCard';
import { formatDateKathmandu } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  // Fetch active tournaments
  const tournaments = query<any>(
    `SELECT t.*, count(p.id) as participant_count
     FROM tournaments t
     LEFT JOIN tournament_participants p ON p.tournament_id = t.id
     GROUP BY t.id
     ORDER BY t.created_at DESC LIMIT 4`
  );

  // Fetch live and upcoming matches
  const featuredMatches = query<any>(
    `SELECT m.*,
            hp.display_name as home_name, hp.tag as home_tag, hp.avatar_url as home_avatar, hp.seed as home_seed,
            ap.display_name as away_name, ap.tag as away_tag, ap.avatar_url as away_avatar, ap.seed as away_seed,
            t.title as tournament_title
     FROM matches m
     JOIN tournaments t ON t.id = m.tournament_id
     LEFT JOIN tournament_participants hp ON hp.id = m.home_participant_id
     LEFT JOIN tournament_participants ap ON ap.id = m.away_participant_id
     WHERE m.status IN ('LIVE', 'SCHEDULED', 'AWAITING_RESULT')
     ORDER BY CASE WHEN m.status = 'LIVE' THEN 1 ELSE 2 END, m.scheduled_time ASC
     LIMIT 4`
  ).map((m: any) => ({
    ...m,
    home_participant: m.home_participant_id
      ? {
          id: m.home_participant_id,
          display_name: m.home_name,
          tag: m.home_tag,
          avatar_url: m.home_avatar,
          seed: m.home_seed,
        }
      : undefined,
    away_participant: m.away_participant_id
      ? {
          id: m.away_participant_id,
          display_name: m.away_name,
          tag: m.away_tag,
          avatar_url: m.away_avatar,
          seed: m.away_seed,
        }
      : undefined,
  }));

  // Fetch top clans
  const topClans = query<any>(
    `SELECT c.*, count(r.id) as member_count
     FROM clans c
     LEFT JOIN clan_rosters r ON r.clan_id = c.id
     GROUP BY c.id
     LIMIT 6`
  );

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-white/10 bg-radial from-violet-950/30 via-slate-950/80 to-[#0B0E17]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/15 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-violet-300 text-xs font-semibold tracking-wider uppercase shadow-glow-purple">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            BTH Esports Tournament Engine 2.0
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase font-sans">
            BTH ESPORTS <br />
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              RISE AND SHINE
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            The enterprise-grade competitive tournament engine powering eFootball, PUBG Mobile, Valorant, and major esports championships across South Asia.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/tournaments">
              <Button size="lg" variant="glow" className="text-sm px-8">
                <Trophy className="w-5 h-5 mr-2" /> Explore Tournaments
              </Button>
            </Link>
            <Link href="/admin/create">
              <Button size="lg" variant="secondary" className="text-sm px-6">
                Create Tournament
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-white/10">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="text-2xl font-black text-white font-mono">{tournaments.length}</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Active Majors</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="text-2xl font-black text-cyan-400 font-mono">42+</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Matches Generated</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="text-2xl font-black text-violet-400 font-mono">{topClans.length}</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Registered Clans</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="text-2xl font-black text-emerald-400 font-mono">Asia/Kathmandu</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Server Timezone</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tournaments Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Flame className="w-6 h-6 text-rose-500" /> Major Tournaments
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Explore active brackets, standings, and registered participants</p>
          </div>
          <Link href="/tournaments" className="text-xs font-semibold text-violet-400 hover:text-cyan-400 flex items-center gap-1">
            View All Tournaments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((t: any) => (
            <Link
              key={t.id}
              href={`/tournaments/${t.slug}`}
              className="group rounded-2xl bg-[#121626] border border-white/10 hover:border-violet-500/50 hover:shadow-glow-purple transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Banner Thumbnail */}
                <div className="h-44 w-full bg-slate-900 relative overflow-hidden">
                  <img
                    src={t.banner_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200'}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121626] via-[#121626]/40 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-bold text-cyan-400 uppercase tracking-wider border border-white/10">
                      {t.game}
                    </span>
                    <Badge status={t.status} />
                  </div>
                  {t.prize_pool && (
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-md bg-amber-500/20 backdrop-blur-md text-[11px] font-bold text-amber-300 border border-amber-500/40">
                      🏆 {t.prize_pool}
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{t.description}</p>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-[#1A2035]/60 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Format: <strong className="text-slate-200">{t.format.replace('_', ' ')}</strong></span>
                <span className="text-violet-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                  View Bracket <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Live & Upcoming Matches */}
      {featuredMatches.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
                <Play className="w-5 h-5 text-cyan-400" /> Featured Matches
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Live fixtures and upcoming championship matches</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredMatches.map((m: any) => (
              <div key={m.id} className="flex justify-center">
                <MatchCard match={m} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Clans & Teams Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-6 h-6 text-violet-400" /> Competitive Clans
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Top esports divisions registered on BTH Gaming</p>
          </div>
          <Link href="/clans" className="text-xs font-semibold text-violet-400 hover:text-cyan-400 flex items-center gap-1">
            All Clans <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {topClans.map((c: any) => (
            <div
              key={c.id}
              className="p-4 rounded-xl bg-[#121626] border border-white/5 hover:border-violet-500/40 text-center space-y-2 transition group"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-sm text-cyan-400 font-mono shadow group-hover:scale-105 transition">
                {c.tag}
              </div>
              <div>
                <div className="text-xs font-bold text-white truncate">{c.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{c.country}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

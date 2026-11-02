'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Search, Filter, ArrowRight, Shield, Calendar, Award } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { POPULAR_GAMES, TOURNAMENT_FORMATS } from '@/components/tournament/TournamentWizard';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState('ALL');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, [selectedGame, selectedFormat, searchQuery]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGame !== 'ALL') params.set('game', selectedGame);
      if (selectedFormat !== 'ALL') params.set('format', selectedFormat);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/tournaments?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setTournaments(data.tournaments || []);
      }
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wide flex items-center gap-2.5">
            <Trophy className="w-8 h-8 text-violet-400" /> Esports Tournaments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse official BTH championships, visual brackets, and standings tables
          </p>
        </div>
        <Link
          href="/admin/create"
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-glow-purple flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer"
        >
          Create Tournament
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#121626] border border-white/10">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Games</option>
            {POPULAR_GAMES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Formats</option>
            {TOURNAMENT_FORMATS.map((tf) => (
              <option key={tf.format} value={tf.format}>
                {tf.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#121626] border border-white/5 space-y-3">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Tournaments Found</h3>
          <p className="text-xs text-slate-500">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/tournaments/${t.slug}`}
              className="group rounded-2xl bg-[#121626] border border-white/10 hover:border-violet-500/50 hover:shadow-glow-purple transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
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
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-amber-500/20 backdrop-blur-md text-[11px] font-bold text-amber-300 border border-amber-500/40">
                      🏆 {t.prize_pool}
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{t.description}</p>
                </div>
              </div>

              <div className="px-5 py-3 bg-[#1A2035]/60 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>{t.format.replace(/_/g, ' ')}</span>
                <span className="text-violet-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                  Bracket <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


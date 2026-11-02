'use client';

import React from 'react';
import { StandingRow } from '@/types/tournament';
import { Shield, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StandingsTableProps {
  standings: StandingRow[];
  title?: string;
}

export function StandingsTable({ standings, title = 'Tournament Standings' }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl bg-[#121626] border border-white/5 text-slate-400 text-xs italic">
        Standings will be automatically calculated when tournament matches are verified.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#121626] border border-white/10 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1A2035] border-b border-white/10">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <TrendingUp className="w-4 h-4 text-cyan-400" /> {title}
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          Win: 3pts • Draw: 1pt • Loss: 0pts
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-white/5 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">#</th>
              <th className="py-2.5 px-3">Participant</th>
              <th className="py-2.5 px-2 text-center">MP</th>
              <th className="py-2.5 px-2 text-center text-emerald-400">W</th>
              <th className="py-2.5 px-2 text-center text-amber-400">D</th>
              <th className="py-2.5 px-2 text-center text-rose-400">L</th>
              <th className="py-2.5 px-2 text-center hidden sm:table-cell">GF</th>
              <th className="py-2.5 px-2 text-center hidden sm:table-cell">GA</th>
              <th className="py-2.5 px-2 text-center font-mono">GD</th>
              <th className="py-2.5 px-3 text-center font-bold text-white font-mono bg-violet-950/40">PTS</th>
              <th className="py-2.5 px-3 text-center hidden md:table-cell">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {standings.map((row, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              return (
                <tr
                  key={row.participant_id}
                  className={cn(
                    'hover:bg-slate-800/40 transition-colors',
                    isFirst && 'bg-amber-500/5'
                  )}
                >
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    {isFirst ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-xs">
                        1
                      </span>
                    ) : isSecond ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 text-slate-950 text-xs">
                        2
                      </span>
                    ) : isThird ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-700 text-white text-xs">
                        3
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {row.participant_avatar ? (
                          <img src={row.participant_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Shield className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="font-semibold text-slate-100 truncate max-w-[180px]">
                        {row.participant_name}
                        {row.participant_tag && (
                          <span className="ml-1 text-[10px] text-slate-400 font-mono">[{row.participant_tag}]</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-400">{row.played}</td>
                  <td className="py-3 px-2 text-center font-mono font-medium text-emerald-400">{row.won}</td>
                  <td className="py-3 px-2 text-center font-mono font-medium text-amber-400">{row.drawn}</td>
                  <td className="py-3 px-2 text-center font-mono font-medium text-rose-400">{row.lost}</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-400 hidden sm:table-cell">{row.goals_for}</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-400 hidden sm:table-cell">{row.goals_against}</td>
                  <td className="py-3 px-2 text-center font-mono font-semibold">
                    <span
                      className={
                        row.goal_difference > 0
                          ? 'text-emerald-400'
                          : row.goal_difference < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }
                    >
                      {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-extrabold text-white text-sm bg-violet-950/40">
                    {row.points}
                  </td>
                  <td className="py-3 px-3 text-center hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {row.form && row.form.length > 0 ? (
                        row.form.map((res, fIdx) => (
                          <span
                            key={fIdx}
                            className={cn(
                              'w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center font-mono text-white',
                              res === 'W' && 'bg-emerald-500',
                              res === 'D' && 'bg-amber-500',
                              res === 'L' && 'bg-rose-500'
                            )}
                          >
                            {res}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-500">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


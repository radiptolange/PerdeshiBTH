'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { TournamentFormat, CompetitionType } from '@/types/tournament';
import { Trophy, Shield, Calendar, Settings, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const POPULAR_GAMES = [
  'eFootball',
  'PUBG Mobile',
  'Mobile Legends: Bang Bang',
  'Valorant',
  'Free Fire',
  'Counter-Strike 2',
  'Dota 2',
  'EA Sports FC',
];

export const TOURNAMENT_FORMATS: { format: TournamentFormat; name: string; desc: string }[] = [
  {
    format: 'SINGLE_ELIMINATION',
    name: 'Single Elimination (Knockout)',
    desc: 'Lose once and you are out. Fast, high-stakes brackets with automatic byes.',
  },
  {
    format: 'DOUBLE_ELIMINATION',
    name: 'Double Elimination',
    desc: 'Winners and Losers brackets. Participants get a second chance before elimination.',
  },
  {
    format: 'ROUND_ROBIN',
    name: 'Round Robin / League',
    desc: 'Every participant plays every other participant. Automatic points table.',
  },
  {
    format: 'GROUP_STAGE_KNOCKOUT',
    name: 'Group Stage + Knockout',
    desc: 'Multi-group round robin followed by cross-group knockout playoffs.',
  },
  {
    format: 'SWISS',
    name: 'Swiss System',
    desc: 'Rounds paired by matching scores without rematches. Fixed number of rounds.',
  },
];

export function TournamentWizard() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    game: 'eFootball',
    category: 'National Championship',
    format: 'SINGLE_ELIMINATION' as TournamentFormat,
    competition_type: 'PLAYER_1V1' as CompetitionType,
    team_size: 1,
    min_participants: 4,
    max_participants: 16,
    timezone: 'Asia/Kathmandu',
    registration_start: '',
    registration_end: '',
    start_date: '',
    end_date: '',
    match_deadline_hours: 24,
    prize_pool: 'NPR 100,000 + Trophy',
    rules_markdown: 'Official BTH esports rules apply. Fair play is strictly enforced.',
    banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
    is_public: true,
    substitutions_allowed: true,
    max_substitutions_per_match: 2,
    requires_referee_approval: true,
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1 && !formData.title.trim()) {
      setErrorMsg('Please enter a tournament name');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/tournaments/${data.tournament.slug}`);
      } else {
        setErrorMsg(data.error || 'Failed to create tournament');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto rounded-2xl bg-[#121626] border border-white/10 shadow-2xl overflow-hidden">
      {/* Wizard Header */}
      <div className="p-6 bg-[#1A2035] border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Trophy className="w-5 h-5 text-violet-400" /> Tournament Creation Wizard
            </h2>
            <p className="text-xs text-slate-400 mt-1">Configure your competitive esports tournament engine</p>
          </div>
          <span className="text-xs font-mono font-bold text-violet-400 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
            Step {step} of 4
          </span>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { num: 1, label: 'General Info' },
            { num: 2, label: 'Format & Teams' },
            { num: 3, label: 'Schedule' },
            { num: 4, label: 'Rules & Rules' },
          ].map((s) => (
            <div key={s.num} className="space-y-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= s.num ? 'bg-violet-500 shadow-glow-purple' : 'bg-slate-800'
                }`}
              />
              <span className={`text-[10px] font-medium block truncate ${step >= s.num ? 'text-violet-300' : 'text-slate-500'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Body */}
      <div className="p-6 space-y-6">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: General Info */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tournament Name *</label>
              <input
                type="text"
                placeholder="e.g. Nepal Champions Cup 2026 - eFootball"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Esports Game</label>
                <select
                  value={formData.game}
                  onChange={(e) => updateField('game', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                >
                  {POPULAR_GAMES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Major Championship, Clan Scrims"
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tournament Description</label>
              <textarea
                rows={3}
                placeholder="Detailed summary of the championship, history, and organizer..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Banner Image URL</label>
              <input
                type="url"
                value={formData.banner_url}
                onChange={(e) => updateField('banner_url', e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Format & Competition */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Tournament Format Engine</label>
              <div className="grid grid-cols-1 gap-2.5">
                {TOURNAMENT_FORMATS.map((tf) => (
                  <div
                    key={tf.format}
                    onClick={() => updateField('format', tf.format)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      formData.format === tf.format
                        ? 'bg-violet-600/15 border-violet-500 shadow-glow-purple'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100">{tf.name}</span>
                      {formData.format === tf.format && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{tf.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Competition Type</label>
                <select
                  value={formData.competition_type}
                  onChange={(e) => updateField('competition_type', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
                >
                  <option value="PLAYER_1V1">Player 1v1</option>
                  <option value="CLAN_1V1">Clan 1v1</option>
                  <option value="TEAM_VS_TEAM">Team vs Team</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Min Participants</label>
                <input
                  type="number"
                  min={2}
                  max={64}
                  value={formData.min_participants}
                  onChange={(e) => updateField('min_participants', parseInt(e.target.value) || 2)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Max Participants</label>
                <input
                  type="number"
                  min={2}
                  max={128}
                  value={formData.max_participants}
                  onChange={(e) => updateField('max_participants', parseInt(e.target.value) || 16)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Dates & Deadlines */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in text-xs">
            <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-cyan-300 text-xs">
              Default Timezone: <strong>Asia/Kathmandu (Nepal Time, UTC+05:45)</strong>. Timestamps are server-authoritative.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Registration Opens</label>
                <input
                  type="datetime-local"
                  value={formData.registration_start}
                  onChange={(e) => updateField('registration_start', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Registration Closes</label>
                <input
                  type="datetime-local"
                  value={formData.registration_end}
                  onChange={(e) => updateField('registration_end', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Tournament Starts</label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => updateField('start_date', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Match Deadline (Hours)</label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={formData.match_deadline_hours}
                  onChange={(e) => updateField('match_deadline_hours', parseInt(e.target.value) || 24)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Rules & Prizes */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Prize Pool Information</label>
              <input
                type="text"
                placeholder="e.g. NPR 150,000 Total Pool + Winner Medals"
                value={formData.prize_pool}
                onChange={(e) => updateField('prize_pool', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Rules & Regulations (Markdown)</label>
              <textarea
                rows={4}
                value={formData.rules_markdown}
                onChange={(e) => updateField('rules_markdown', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
              <span className="font-bold text-slate-200">Substitution & Administrative Controls</span>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.substitutions_allowed}
                    onChange={(e) => updateField('substitutions_allowed', e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 bg-slate-800 border-white/20"
                  />
                  <span>Allow Mid-Match Substitutions</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_referee_approval}
                    onChange={(e) => updateField('requires_referee_approval', e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 bg-slate-800 border-white/20"
                  />
                  <span>Referee Approval Mandatory</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Controls */}
      <div className="p-4 bg-[#1A2035] border-t border-white/10 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button variant="primary" size="sm" onClick={handleNext}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button variant="glow" size="md" onClick={handleSubmit} isLoading={isSubmitting}>
            <Trophy className="w-4 h-4 mr-1.5" /> Publish Tournament
          </Button>
        )}
      </div>
    </div>
  );
}


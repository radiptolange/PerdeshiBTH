'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MatchWithParticipants } from '@/types/match';
import { formatDateKathmandu } from '@/lib/utils';
import {
  Shield,
  Clock,
  Key,
  UserCheck,
  FileText,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle,
  Copy,
  Upload,
  ExternalLink,
} from 'lucide-react';

export interface MatchDetailModalProps {
  matchId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onMatchUpdated?: () => void;
}

export function MatchDetailModal({
  matchId,
  isOpen,
  onClose,
  onMatchUpdated,
}: MatchDetailModalProps) {
  const [matchData, setMatchData] = useState<MatchWithParticipants | null>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [subsList, setSubsList] = useState<any[]>([]);
  const [disputesList, setDisputesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'SCORE' | 'EVIDENCE' | 'SUBSTITUTIONS' | 'DISPUTES'>('DETAILS');

  // Form states
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [subPlayerOut, setSubPlayerOut] = useState('');
  const [subPlayerIn, setSubPlayerIn] = useState('');
  const [subReason, setSubReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (matchId && isOpen) {
      loadMatchDetails(matchId);
    }
  }, [matchId, isOpen]);

  const loadMatchDetails = async (id: string) => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/matches/${id}`);
      const data = await res.json();
      if (res.ok) {
        setMatchData(data.match);
        setEvidenceList(data.evidence || []);
        setSubsList(data.substitutions || []);
        setDisputesList(data.disputes || []);
        setHomeScore(data.match.home_score || 0);
        setAwayScore(data.match.away_score || 0);
      }
    } catch (err: any) {
      console.error('Failed to load match details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMatchId = () => {
    if (matchData?.id) {
      navigator.clipboard.writeText(matchData.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleScoreSubmit = async () => {
    if (!matchData) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchData.id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_score: homeScore, away_score: awayScore, status: 'UNDER_REVIEW' }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: 'Score submitted and pending verification!', type: 'success' });
        loadMatchDetails(matchData.id);
        onMatchUpdated && onMatchUpdated();
      } else {
        setActionMessage({ text: data.error || 'Failed to submit score', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveResult = async () => {
    if (!matchData) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchData.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: 'Result officially approved! Bracket updated.', type: 'success' });
        loadMatchDetails(matchData.id);
        onMatchUpdated && onMatchUpdated();
      } else {
        setActionMessage({ text: data.error || 'Approval failed', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchData || !evidenceUrl) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchData.id}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: evidenceUrl, evidence_type: 'SCREENSHOT', note: evidenceNote }),
      });
      if (res.ok) {
        setEvidenceUrl('');
        setEvidenceNote('');
        setActionMessage({ text: 'Evidence recorded successfully', type: 'success' });
        loadMatchDetails(matchData.id);
      }
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSubstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchData || !subPlayerOut || !subPlayerIn) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchData.id}/substitution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REQUEST', player_out_id: subPlayerOut, player_in_id: subPlayerIn, reason: subReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubPlayerOut('');
        setSubPlayerIn('');
        setSubReason('');
        setActionMessage({ text: data.message, type: 'success' });
        loadMatchDetails(matchData.id);
      } else {
        setActionMessage({ text: data.error, type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSub = async (subId: string) => {
    if (!matchData) return;
    try {
      await fetch(`/api/matches/${matchData.id}/substitution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', substitution_id: subId }),
      });
      loadMatchDetails(matchData.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchData || !disputeReason) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchData.id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OPEN', reason: disputeReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setDisputeReason('');
        setActionMessage({ text: data.message, type: 'success' });
        loadMatchDetails(matchData.id);
        onMatchUpdated && onMatchUpdated();
      } else {
        setActionMessage({ text: data.error, type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapSlots = async () => {
    if (!matchData) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchData.id}/swap-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SWAP_INTERNAL' }),
      });
      if (res.ok) {
        setActionMessage({ text: 'Participant positions swapped', type: 'success' });
        loadMatchDetails(matchData.id);
        onMatchUpdated && onMatchUpdated();
      }
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!matchData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      {/* Header Info */}
      <div className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
              {matchData.id}
            </span>
            <button
              onClick={copyMatchId}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Copy Match ID"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <Badge status={matchData.status} />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {matchData.round_name} • {(matchData as any).tournament_title}
          </span>
        </div>

        {actionMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {actionMessage.text}
          </div>
        )}

        {/* Versus Scoreboard Banner */}
        <div className="grid grid-cols-7 items-center bg-[#1A2035] rounded-xl p-4 border border-white/10">
          <div className="col-span-3 text-center sm:text-left flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              {matchData.home_participant?.avatar_url ? (
                <img src={matchData.home_participant.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="truncate">
              <div className="text-sm font-bold text-slate-100 truncate">
                {matchData.home_participant?.display_name || 'TBD'}
              </div>
              <div className="text-[11px] text-slate-400">
                {matchData.home_participant?.seed ? `Seed #${matchData.home_participant.seed}` : 'Slot 1'}
              </div>
            </div>
          </div>

          <div className="col-span-1 text-center font-mono">
            <div className="text-xl font-black text-white">
              {matchData.home_score} : {matchData.away_score}
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">VS</span>
          </div>

          <div className="col-span-3 text-center sm:text-right flex flex-col sm:flex-row-reverse items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              {matchData.away_participant?.avatar_url ? (
                <img src={matchData.away_participant.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="truncate">
              <div className="text-sm font-bold text-slate-100 truncate">
                {matchData.away_participant?.display_name || 'TBD'}
              </div>
              <div className="text-[11px] text-slate-400">
                {matchData.away_participant?.seed ? `Seed #${matchData.away_participant.seed}` : 'Slot 2'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-1 overflow-x-auto text-xs font-semibold py-1">
        {(['DETAILS', 'SCORE', 'EVIDENCE', 'SUBSTITUTIONS', 'DISPUTES'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'bg-violet-600 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab}
            {tab === 'EVIDENCE' && evidenceList.length > 0 && ` (${evidenceList.length})`}
            {tab === 'SUBSTITUTIONS' && subsList.length > 0 && ` (${subsList.length})`}
            {tab === 'DISPUTES' && disputesList.length > 0 && ` (${disputesList.length})`}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="py-4 space-y-4">
        {activeTab === 'DETAILS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
              <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Scheduled Time (Nepal Time)
              </div>
              <div className="text-slate-200 font-semibold">{formatDateKathmandu(matchData.scheduled_time)}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
              <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Key className="w-3.5 h-3.5 text-amber-400" /> Match Room Credentials
              </div>
              <div className="text-slate-200 font-mono">
                {matchData.room_id ? (
                  <span>
                    ID: <strong className="text-white">{matchData.room_id}</strong> • Pass:{' '}
                    <strong className="text-white">{matchData.room_password || 'None'}</strong>
                  </span>
                ) : (
                  <span className="text-slate-500">Not yet generated</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
              <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Assigned Referee
              </div>
              <div className="text-slate-200 font-semibold">
                {(matchData as any).referee_name || 'Official BTH Referee'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
              <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                <ArrowRightLeft className="w-3.5 h-3.5 text-violet-400" /> Bracket Adjustment
              </div>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSwapSlots}
                  disabled={matchData.status === 'COMPLETED'}
                  className="text-[11px] py-1"
                >
                  Swap Home/Away Slots
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SCORE' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Enter Match Score</h4>
              <div className="flex items-center justify-around gap-4">
                <div className="text-center space-y-1">
                  <label className="text-xs text-slate-400 block truncate max-w-[120px]">
                    {matchData.home_participant?.display_name || 'Home'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={homeScore}
                    onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-center text-2xl font-mono font-bold py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <span className="text-2xl font-bold text-slate-500">:</span>

                <div className="text-center space-y-1">
                  <label className="text-xs text-slate-400 block truncate max-w-[120px]">
                    {matchData.away_participant?.display_name || 'Away'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={awayScore}
                    onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-center text-2xl font-mono font-bold py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button size="sm" variant="secondary" onClick={handleScoreSubmit} isLoading={isLoading}>
                  Save & Request Review
                </Button>
                <Button size="sm" variant="primary" onClick={handleApproveResult} isLoading={isLoading}>
                  <CheckCircle className="w-4 h-4 mr-1 text-emerald-300" /> Approve Result & Advance Winner
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'EVIDENCE' && (
          <div className="space-y-4 text-xs">
            {/* Upload Form */}
            <form onSubmit={handleUploadEvidence} className="p-3 rounded-lg bg-slate-900/60 border border-white/10 space-y-2">
              <span className="font-semibold text-slate-200">Attach Screenshot or Video Evidence URL</span>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://imgur.com/screenshot.png"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Note (e.g. End Screen 90 min)"
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  className="w-48 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
                <Button size="sm" variant="glow" type="submit" isLoading={isLoading}>
                  <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                </Button>
              </div>
            </form>

            {/* Evidence List */}
            <div className="space-y-2">
              {evidenceList.length === 0 ? (
                <p className="text-slate-500 text-center py-4 italic">No match evidence submitted yet.</p>
              ) : (
                evidenceList.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200">{ev.note || 'Screenshot Evidence'}</div>
                      <div className="text-[10px] text-slate-400">By {ev.submitter_name || 'Player'} • {formatDateKathmandu(ev.created_at)}</div>
                    </div>
                    <a
                      href={ev.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'SUBSTITUTIONS' && (
          <div className="space-y-4 text-xs">
            <form onSubmit={handleRequestSubstitution} className="p-3 rounded-lg bg-slate-900/60 border border-white/10 space-y-3">
              <span className="font-semibold text-slate-200">Request Mid-Match Roster Substitution</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Player Leaving (Out)"
                  value={subPlayerOut}
                  onChange={(e) => setSubPlayerOut(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Player Entering (In)"
                  value={subPlayerIn}
                  onChange={(e) => setSubPlayerIn(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Reason for substitution (e.g. Tactical rotation, Device disconnect)"
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                />
                <Button size="sm" variant="primary" type="submit" isLoading={isLoading}>
                  Request Sub
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              {subsList.length === 0 ? (
                <p className="text-slate-500 text-center py-4 italic">No substitutions registered for this match.</p>
              ) : (
                subsList.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200">
                        <span className="text-rose-400">OUT: {s.player_out_name || s.player_out_id}</span> ➔{' '}
                        <span className="text-emerald-400">IN: {s.player_in_name || s.player_in_id}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Reason: {s.reason} • {formatDateKathmandu(s.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={s.status} />
                      {s.status === 'PENDING' && (
                        <Button size="sm" variant="secondary" onClick={() => handleApproveSub(s.id)}>
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'DISPUTES' && (
          <div className="space-y-4 text-xs">
            <form onSubmit={handleOpenDispute} className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-2">
              <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Open Formal Dispute
              </span>
              <p className="text-[11px] text-slate-400">
                Opening a dispute immediately halts automatic bracket advancement until an official referee rules on the appeal.
              </p>
              <textarea
                rows={2}
                placeholder="State the violation, score discrepancy, or rule breach..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                required
              />
              <div className="text-right">
                <Button size="sm" variant="danger" type="submit" isLoading={isLoading}>
                  Submit Dispute
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              {disputesList.length === 0 ? (
                <p className="text-slate-500 text-center py-4 italic">No active disputes.</p>
              ) : (
                disputesList.map((d) => (
                  <div key={d.id} className="p-3 rounded-lg bg-slate-900 border border-rose-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-400">Dispute #{d.id}</span>
                      <Badge status={d.status} />
                    </div>
                    <p className="text-slate-300">{d.reason}</p>
                    {d.resolution_notes && (
                      <div className="mt-1 pt-1 border-t border-white/5 text-emerald-400 text-[11px]">
                        Ruling: {d.resolution_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

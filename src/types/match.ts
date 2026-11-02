export type MatchStatus =
  | 'UPCOMING'
  | 'SCHEDULED'
  | 'WAITING_CONFIRMATION'
  | 'READY'
  | 'LIVE'
  | 'PAUSED'
  | 'AWAITING_RESULT'
  | 'UNDER_REVIEW'
  | 'DISPUTED'
  | 'COMPLETED'
  | 'FORFEITED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export type BracketType =
  | 'WINNERS'
  | 'LOSERS'
  | 'GRAND_FINAL'
  | 'GRAND_FINAL_RESET'
  | 'THIRD_PLACE'
  | 'GROUP'
  | 'ROUND_ROBIN'
  | 'SWISS';

export interface Match {
  id: string; // Permanent Unique Match ID: BTH-NCC-2026-R01-M001
  tournament_id: string;
  group_id?: string;
  bracket_type: BracketType;
  round_number: number;
  round_name: string;
  match_number: number;
  home_participant_id?: string;
  away_participant_id?: string;
  home_score: number;
  away_score: number;
  winner_id?: string;
  loser_id?: string;
  status: MatchStatus;
  next_match_id?: string;
  next_match_slot?: 'HOME' | 'AWAY';
  loser_next_match_id?: string;
  loser_next_match_slot?: 'HOME' | 'AWAY';
  scheduled_time?: string;
  deadline?: string;
  room_id?: string;
  room_password?: string;
  referee_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MatchWithParticipants extends Match {
  home_participant?: {
    id: string;
    display_name: string;
    tag?: string;
    avatar_url?: string;
    seed?: number;
  };
  away_participant?: {
    id: string;
    display_name: string;
    tag?: string;
    avatar_url?: string;
    seed?: number;
  };
  evidence?: MatchEvidence[];
  substitutions?: MatchSubstitution[];
  disputes?: MatchDispute[];
}

export interface MatchEvidence {
  id: string;
  match_id: string;
  submitted_by: string;
  submitter_name?: string;
  file_url: string;
  evidence_type: 'SCREENSHOT' | 'VIDEO_URL' | 'LOG';
  note?: string;
  created_at: string;
}

export interface MatchDispute {
  id: string;
  match_id: string;
  opened_by: string;
  opener_name?: string;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolution_notes?: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
}

export interface MatchSubstitution {
  id: string;
  match_id: string;
  requester_id: string;
  requester_name?: string;
  player_out_id: string;
  player_out_name?: string;
  player_in_id: string;
  player_in_name?: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  created_at: string;
}


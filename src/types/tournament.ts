export type TournamentFormat =
  | 'SINGLE_ELIMINATION'
  | 'DOUBLE_ELIMINATION'
  | 'ROUND_ROBIN'
  | 'GROUP_STAGE_KNOCKOUT'
  | 'SWISS';

export type CompetitionType =
  | 'PLAYER_1V1'
  | 'CLAN_1V1'
  | 'TEAM_VS_TEAM'
  | 'INDIVIDUAL_LEAGUE'
  | 'CLAN_LEAGUE';

export type TournamentStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'ONGOING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface Tournament {
  id: string;
  org_id?: string;
  title: string;
  slug: string;
  description?: string;
  game: string;
  category: string;
  format: TournamentFormat;
  competition_type: CompetitionType;
  team_size: number;
  status: TournamentStatus;
  timezone: string;
  min_participants: number;
  max_participants: number;
  current_participants: number;
  registration_start?: string;
  registration_end?: string;
  start_date?: string;
  end_date?: string;
  match_deadline_hours?: number;
  prize_pool?: string;
  rules_markdown?: string;
  banner_url?: string;
  logo_url?: string;
  is_public: boolean;
  substitutions_allowed: boolean;
  max_substitutions_per_match: number;
  requires_referee_approval: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  participant_type: 'PLAYER' | 'CLAN';
  participant_id: string; // user id or clan id
  display_name: string;
  tag?: string;
  avatar_url?: string;
  seed?: number;
  group_id?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'DISQUALIFIED';
  created_at: string;
}

export interface TournamentGroup {
  id: string;
  tournament_id: string;
  group_name: string; // e.g. "Group A"
  advancers_count: number;
}

export interface StandingRow {
  id: string;
  tournament_id: string;
  group_id?: string;
  participant_id: string;
  participant_name: string;
  participant_avatar?: string;
  participant_tag?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  rank: number;
  form: ('W' | 'D' | 'L')[];
}

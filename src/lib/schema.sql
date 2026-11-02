-- BTH Esports Management Platform Schema
-- Storage: SQLite 3.x / node:sqlite with Foreign Keys enabled

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  primary_color TEXT DEFAULT '#7C3AED',
  social_links TEXT DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  game_ids TEXT DEFAULT '{}',
  role TEXT NOT NULL DEFAULT 'SPECTATOR',
  clan_id TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clans (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL,
  leader_id TEXT,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  country TEXT DEFAULT 'Nepal',
  created_at TEXT NOT NULL,
  FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS clan_rosters (
  id TEXT PRIMARY KEY,
  clan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role_in_clan TEXT DEFAULT 'MEMBER',
  is_main_roster INTEGER DEFAULT 1,
  joined_at TEXT NOT NULL,
  FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(clan_id, user_id)
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  game TEXT NOT NULL,
  category TEXT DEFAULT 'Championship',
  format TEXT NOT NULL,
  competition_type TEXT NOT NULL DEFAULT 'PLAYER_1V1',
  team_size INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  timezone TEXT DEFAULT 'Asia/Kathmandu',
  min_participants INTEGER DEFAULT 2,
  max_participants INTEGER DEFAULT 16,
  current_participants INTEGER DEFAULT 0,
  registration_start TEXT,
  registration_end TEXT,
  start_date TEXT,
  end_date TEXT,
  match_deadline_hours INTEGER DEFAULT 24,
  prize_pool TEXT,
  rules_markdown TEXT,
  banner_url TEXT,
  logo_url TEXT,
  is_public INTEGER DEFAULT 1,
  substitutions_allowed INTEGER DEFAULT 1,
  max_substitutions_per_match INTEGER DEFAULT 2,
  requires_referee_approval INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tournament_groups (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  advancers_count INTEGER DEFAULT 2,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tournament_participants (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  participant_type TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  tag TEXT,
  avatar_url TEXT,
  seed INTEGER,
  group_id TEXT,
  status TEXT DEFAULT 'CONFIRMED',
  created_at TEXT NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES tournament_groups(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  group_id TEXT,
  bracket_type TEXT DEFAULT 'WINNERS',
  round_number INTEGER NOT NULL,
  round_name TEXT NOT NULL,
  match_number INTEGER NOT NULL,
  home_participant_id TEXT,
  away_participant_id TEXT,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  winner_id TEXT,
  loser_id TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  next_match_id TEXT,
  next_match_slot TEXT,
  loser_next_match_id TEXT,
  loser_next_match_slot TEXT,
  scheduled_time TEXT,
  deadline TEXT,
  room_id TEXT,
  room_password TEXT,
  referee_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES tournament_groups(id) ON DELETE SET NULL,
  FOREIGN KEY (home_participant_id) REFERENCES tournament_participants(id) ON DELETE SET NULL,
  FOREIGN KEY (away_participant_id) REFERENCES tournament_participants(id) ON DELETE SET NULL,
  FOREIGN KEY (winner_id) REFERENCES tournament_participants(id) ON DELETE SET NULL,
  FOREIGN KEY (loser_id) REFERENCES tournament_participants(id) ON DELETE SET NULL,
  FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tournament_standings (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  group_id TEXT,
  participant_id TEXT NOT NULL,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  form TEXT DEFAULT '[]',
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES tournament_groups(id) ON DELETE SET NULL,
  FOREIGN KEY (participant_id) REFERENCES tournament_participants(id) ON DELETE CASCADE,
  UNIQUE(tournament_id, participant_id)
);

CREATE TABLE IF NOT EXISTS match_substitutions (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  requester_id TEXT NOT NULL,
  player_out_id TEXT NOT NULL,
  player_in_id TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'PENDING',
  approved_by TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (player_out_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (player_in_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS match_evidence (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  file_url TEXT NOT NULL,
  evidence_type TEXT DEFAULT 'SCREENSHOT',
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_disputes (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  opened_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',
  resolution_notes TEXT,
  resolved_by TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (opened_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT DEFAULT '{}',
  ip_address TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  link_url TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Essential Performance Indexes
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_standings_tournament ON tournament_standings(tournament_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

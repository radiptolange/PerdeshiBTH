# DATABASE.md — Database Architecture & Schema Specification

> **Platform**: BTH Esports Tournament Management Platform  
> **Storage Layer**: SQLite (`node:sqlite`) with ACID transactions, foreign keys enabled, WAL journaling mode. Fully compatible with PostgreSQL / MySQL schemas.

---

## 1. Schema Entity Relationship Overview

```
 organizations (1) ──< tournaments (N)
                             │
                             ├──< tournament_stages (N)
                             │           │
                             │           └──< tournament_groups (N)
                             │
                             ├──< tournament_participants (N) >── clans / players
                             │           │
                             │           └──< tournament_standings (N)
                             │
                             └──< matches (N)
                                     │
                                     ├──< match_games (N)
                                     ├──< match_substitutions (N)
                                     ├──< match_evidence (N)
                                     └──< match_disputes (N)
```

---

## 2. Table Definitions

### 1. `organizations`
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `slug` (TEXT UNIQUE NOT NULL)
- `logo_url` (TEXT)
- `banner_url` (TEXT)
- `primary_color` (TEXT DEFAULT '#7C3AED')
- `social_links` (TEXT JSON)
- `created_at` (TEXT NOT NULL)

### 2. `users`
- `id` (TEXT PRIMARY KEY)
- `username` (TEXT UNIQUE NOT NULL)
- `email` (TEXT UNIQUE NOT NULL)
- `password_hash` (TEXT NOT NULL)
- `display_name` (TEXT NOT NULL)
- `avatar_url` (TEXT)
- `game_ids` (TEXT JSON — e.g. `{"efootball": "123456789", "pubg": "5123984"}`)
- `role` (TEXT NOT NULL DEFAULT 'SPECTATOR')
- `clan_id` (TEXT REFERENCES clans(id))
- `status` (TEXT DEFAULT 'ACTIVE' — 'ACTIVE', 'SUSPENDED', 'PENDING')
- `created_at` (TEXT NOT NULL)

### 3. `clans`
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT UNIQUE NOT NULL)
- `tag` (TEXT UNIQUE NOT NULL) — e.g., "BTH"
- `leader_id` (TEXT REFERENCES users(id))
- `logo_url` (TEXT)
- `banner_url` (TEXT)
- `description` (TEXT)
- `country` (TEXT DEFAULT 'Nepal')
- `created_at` (TEXT NOT NULL)

### 4. `clan_rosters`
- `id` (TEXT PRIMARY KEY)
- `clan_id` (TEXT REFERENCES clans(id) ON DELETE CASCADE)
- `user_id` (TEXT REFERENCES users(id) ON DELETE CASCADE)
- `role_in_clan` (TEXT DEFAULT 'MEMBER' — 'LEADER', 'CO_LEADER', 'ELDER', 'MEMBER')
- `is_main_roster` (INTEGER DEFAULT 1) — 1: Main, 0: Reserve
- `joined_at` (TEXT NOT NULL)

### 5. `tournaments`
- `id` (TEXT PRIMARY KEY)
- `org_id` (TEXT REFERENCES organizations(id))
- `title` (TEXT NOT NULL)
- `slug` (TEXT UNIQUE NOT NULL)
- `game` (TEXT NOT NULL) — e.g., 'eFootball', 'PUBG Mobile', 'Valorant', 'Mobile Legends'
- `format` (TEXT NOT NULL) — 'SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'GROUP_STAGE_KNOCKOUT', 'SWISS'
- `competition_type` (TEXT NOT NULL) — 'PLAYER_1V1', 'CLAN_1V1', 'TEAM_VS_TEAM'
- `team_size` (INTEGER DEFAULT 1)
- `status` (TEXT NOT NULL DEFAULT 'DRAFT') — 'DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'PAUSED', 'COMPLETED', 'ARCHIVED'
- `timezone` (TEXT DEFAULT 'Asia/Kathmandu')
- `min_participants` (INTEGER DEFAULT 2)
- `max_participants` (INTEGER DEFAULT 16)
- `current_participants` (INTEGER DEFAULT 0)
- `registration_start` (TEXT)
- `registration_end` (TEXT)
- `start_date` (TEXT)
- `end_date` (TEXT)
- `prize_pool` (TEXT)
- `rules_markdown` (TEXT)
- `banner_url` (TEXT)
- `logo_url` (TEXT)
- `substitutions_allowed` (INTEGER DEFAULT 1)
- `max_substitutions_per_match` (INTEGER DEFAULT 2)
- `requires_referee_approval` (INTEGER DEFAULT 1)
- `created_by` (TEXT REFERENCES users(id))
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)

### 6. `tournament_participants`
- `id` (TEXT PRIMARY KEY)
- `tournament_id` (TEXT REFERENCES tournaments(id) ON DELETE CASCADE)
- `participant_type` (TEXT NOT NULL) — 'PLAYER' or 'CLAN'
- `participant_id` (TEXT NOT NULL) — References users(id) or clans(id)
- `display_name` (TEXT NOT NULL)
- `avatar_url` (TEXT)
- `seed` (INTEGER)
- `status` (TEXT DEFAULT 'CONFIRMED' — 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'DISQUALIFIED')
- `created_at` (TEXT NOT NULL)

### 7. `tournament_groups`
- `id` (TEXT PRIMARY KEY)
- `tournament_id` (TEXT REFERENCES tournaments(id) ON DELETE CASCADE)
- `group_name` (TEXT NOT NULL) — e.g. "Group A"
- `advancers_count` (INTEGER DEFAULT 2)

### 8. `matches`
- `id` (TEXT PRIMARY KEY) — Format: `BTH-{EVENT}-{YEAR}-R{ROUND}-M{MATCH}`
- `tournament_id` (TEXT REFERENCES tournaments(id) ON DELETE CASCADE)
- `group_id` (TEXT REFERENCES tournament_groups(id))
- `bracket_type` (TEXT DEFAULT 'WINNERS') — 'WINNERS', 'LOSERS', 'GRAND_FINAL', 'THIRD_PLACE', 'GROUP', 'ROUND_ROBIN'
- `round_number` (INTEGER NOT NULL)
- `round_name` (TEXT NOT NULL) — e.g. "Quarter-Finals"
- `match_number` (INTEGER NOT NULL)
- `home_participant_id` (TEXT REFERENCES tournament_participants(id))
- `away_participant_id` (TEXT REFERENCES tournament_participants(id))
- `home_score` (INTEGER DEFAULT 0)
- `away_score` (INTEGER DEFAULT 0)
- `winner_id` (TEXT REFERENCES tournament_participants(id))
- `status` (TEXT NOT NULL DEFAULT 'SCHEDULED') — 'UPCOMING', 'SCHEDULED', 'READY', 'LIVE', 'AWAITING_RESULT', 'UNDER_REVIEW', 'DISPUTED', 'COMPLETED', 'FORFEITED', 'CANCELLED'
- `next_match_id` (TEXT)
- `next_match_slot` (TEXT) — 'HOME' or 'AWAY'
- `loser_next_match_id` (TEXT) — For Double Elimination
- `loser_next_match_slot` (TEXT)
- `scheduled_time` (TEXT)
- `deadline` (TEXT)
- `room_id` (TEXT)
- `room_password` (TEXT)
- `referee_id` (TEXT REFERENCES users(id))
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)

### 9. `match_substitutions`
- `id` (TEXT PRIMARY KEY)
- `match_id` (TEXT REFERENCES matches(id) ON DELETE CASCADE)
- `requester_id` (TEXT REFERENCES users(id))
- `player_out_id` (TEXT REFERENCES users(id))
- `player_in_id` (TEXT REFERENCES users(id))
- `reason` (TEXT)
- `status` (TEXT DEFAULT 'PENDING' — 'PENDING', 'APPROVED', 'REJECTED')
- `approved_by` (TEXT REFERENCES users(id))
- `created_at` (TEXT NOT NULL)

### 10. `match_evidence`
- `id` (TEXT PRIMARY KEY)
- `match_id` (TEXT REFERENCES matches(id) ON DELETE CASCADE)
- `submitted_by` (TEXT REFERENCES users(id))
- `file_url` (TEXT NOT NULL)
- `evidence_type` (TEXT DEFAULT 'SCREENSHOT' — 'SCREENSHOT', 'VIDEO_URL', 'LOG')
- `note` (TEXT)
- `created_at` (TEXT NOT NULL)

### 11. `match_disputes`
- `id` (TEXT PRIMARY KEY)
- `match_id` (TEXT REFERENCES matches(id) ON DELETE CASCADE)
- `opened_by` (TEXT REFERENCES users(id))
- `reason` (TEXT NOT NULL)
- `status` (TEXT DEFAULT 'OPEN' — 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED')
- `resolution_notes` (TEXT)
- `resolved_by` (TEXT REFERENCES users(id))
- `created_at` (TEXT NOT NULL)
- `resolved_at` (TEXT)

### 12. `tournament_standings`
- `id` (TEXT PRIMARY KEY)
- `tournament_id` (TEXT REFERENCES tournaments(id) ON DELETE CASCADE)
- `group_id` (TEXT REFERENCES tournament_groups(id))
- `participant_id` (TEXT REFERENCES tournament_participants(id) ON DELETE CASCADE)
- `played` (INTEGER DEFAULT 0)
- `won` (INTEGER DEFAULT 0)
- `drawn` (INTEGER DEFAULT 0)
- `lost` (INTEGER DEFAULT 0)
- `goals_for` (INTEGER DEFAULT 0)
- `goals_against` (INTEGER DEFAULT 0)
- `goal_difference` (INTEGER DEFAULT 0)
- `points` (INTEGER DEFAULT 0)
- `rank` (INTEGER DEFAULT 0)
- `form` (TEXT DEFAULT '[]') — JSON array of last results: '["W","D","W"]'

### 13. `audit_logs`
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT)
- `action` (TEXT NOT NULL)
- `entity_type` (TEXT NOT NULL)
- `entity_id` (TEXT NOT NULL)
- `details` (TEXT JSON)
- `ip_address` (TEXT)
- `created_at` (TEXT NOT NULL)

### 14. `notifications`
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT REFERENCES users(id) ON DELETE CASCADE)
- `title` (TEXT NOT NULL)
- `message` (TEXT NOT NULL)
- `type` (TEXT DEFAULT 'INFO' — 'INFO', 'SUCCESS', 'WARNING', 'ALERT')
- `link_url` (TEXT)
- `is_read` (INTEGER DEFAULT 0)
- `created_at` (TEXT NOT NULL)

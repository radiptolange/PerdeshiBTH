# API.md — REST API & Service Endpoints Specification

> **Platform**: BTH Esports Tournament Management Platform  
> **Conventions**: JSON input and output, standard HTTP response codes (200, 201, 400, 401, 403, 404, 500), server-authoritative validation.

---

## 1. Authentication & Session

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ user: { id, username, email, role, clan_id, avatar_url }, token }`
- `POST /api/auth/register`
  - Body: `{ username, email, password, display_name, game_ids }`
  - Response: `{ user, message }`
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>` or session cookie
  - Response: `{ user }`
- `POST /api/auth/logout`

---

## 2. Tournaments

- `GET /api/tournaments`
  - Query: `?status=ONGOING&game=eFootball&format=SINGLE_ELIMINATION&search=nepal`
  - Response: `{ tournaments: Tournament[] }`
- `POST /api/tournaments`
  - Requires: `TOURNAMENT_ADMIN` or `SUPER_ADMIN`
  - Body: Tournament creation payload (title, game, format, team_size, max_participants, dates, rules)
  - Response: `{ tournament: Tournament }`
- `GET /api/tournaments/[id]`
  - Response: `{ tournament, stages, groups, participantsCount, standings }`
- `PATCH /api/tournaments/[id]`
  - Body: Partial tournament update
- `POST /api/tournaments/[id]/generate-bracket`
  - Body: `{ shuffle: boolean, seeding: 'SEEDED' | 'RANDOM' | 'BALANCED' }`
  - Generates matches according to format.
- `POST /api/tournaments/[id]/reset-bracket`
  - Requires Admin confirmation.

---

## 3. Participants & Registration

- `GET /api/tournaments/[id]/participants`
  - Response: `{ participants: Participant[] }`
- `POST /api/tournaments/[id]/register`
  - Body: `{ participant_type: 'PLAYER' | 'CLAN', participant_id: string }`
  - Response: `{ participant: Participant }`
- `PATCH /api/tournaments/[id]/participants/[participantId]`
  - Body: `{ seed: number, status: 'CONFIRMED' | 'DISQUALIFIED' }`

---

## 4. Matches & Brackets

- `GET /api/tournaments/[id]/matches`
  - Response: `{ matches: Match[] }`
- `GET /api/matches/[matchId]`
  - Response: `{ match, home_participant, away_participant, evidence, substitutions, disputes }`
- `PATCH /api/matches/[matchId]/schedule`
  - Body: `{ scheduled_time, deadline, room_id, room_password, referee_id }`
- `POST /api/matches/[matchId]/score`
  - Body: `{ home_score: number, away_score: number, winner_id?: string }`
- `POST /api/matches/[matchId]/approve`
  - Requires: `MATCH_REFEREE` or `TOURNAMENT_ADMIN`
  - Advances winner in bracket or updates standings.
- `POST /api/matches/[matchId]/evidence`
  - Body: `{ file_url: string, evidence_type: string, note?: string }`
- `POST /api/matches/[matchId]/dispute`
  - Body: `{ reason: string }`
- `POST /api/matches/[matchId]/substitution`
  - Body: `{ player_out_id: string, player_in_id: string, reason: string }`
- `POST /api/matches/[matchId]/swap-slots`
  - Admin bracket adjustment: swaps two match participants.

---

## 5. Clans & Teams

- `GET /api/clans`
  - Response: `{ clans: Clan[] }`
- `POST /api/clans`
  - Body: `{ name, tag, description, logo_url }`
- `GET /api/clans/[id]`
  - Response: `{ clan, leader, roster, stats }`
- `POST /api/clans/[id]/roster`
  - Body: `{ user_id, role_in_clan, is_main_roster }`

---

## 6. Standings & Leaderboards

- `GET /api/tournaments/[id]/standings`
  - Response: `{ standings: StandingRow[] }`
- `GET /api/leaderboard/global`
  - Response: `{ rankings: PlayerRanking[] }`
- `GET /api/leaderboard/clans`
  - Response: `{ rankings: ClanRanking[] }`

---

## 7. Notifications & Audit

- `GET /api/notifications`
  - Response: `{ notifications: Notification[] }`
- `PATCH /api/notifications/[id]/read`
- `GET /api/audit-logs`
  - Query: `?entity_type=match&entity_id=BTH-NCC-2026-R01-M001`

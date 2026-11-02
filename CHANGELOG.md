# CHANGELOG.md — BTH Esports Platform Version History

All notable changes to the BTH Esports Tournament Management Platform will be documented here.

## [2.0.0-rc.1] - 2026-11-03

### Added
- **Core Architecture & Standards**:
  - Implemented Next.js 15 App Router architecture with strict TypeScript 5.7 and Tailwind CSS esports dark theme tokens.
  - Formulated full documentation suite: `AGENTS.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `TOURNAMENT_ENGINE.md`, `FEATURES.md`, `DECISIONS.md`, `AI_CONTEXT.md`, and `IMPLEMENTATION_STATUS.md`.
- **Tournament Engine**:
  - Pure functional Knockout / Single Elimination engine with power-of-two byes, international seed protection, and third-place playoff matching.
  - Double Elimination engine with upper winners bracket, lower losers bracket with alternating round drop-downs, Grand Final, and reset match.
  - Round Robin engine implementing the Berger rotation algorithm with balanced home/away fixtures and odd-participant byes.
  - Group Stage + Knockout engine with snake distribution, intra-group fixtures, and cross-group playoff seeding.
  - Swiss System engine pairing matching score buckets while preventing rematches.
  - Standings engine calculating Points, Goal Difference, Goals For, and Head-to-Head tiebreakers.
  - Permanent immutable Match ID generator (`BTH-NCC-2026-R01-M001`).
- **Interactive UI Components**:
  - Visual Interactive Bracket (`VisualBracket.tsx`) with SVG connectors, zoom & pan controls, tree view, and mobile round view.
  - Esports Match Card with seed badges, team logos, and live score boxes (`MatchCard.tsx`).
  - Comprehensive Match Detail Modal (`MatchDetailModal.tsx`) with score submission, referee approval, evidence uploader, substitution panel, and dispute resolution.
  - Standings & Leaderboard Table (`StandingsTable.tsx`).
  - Multi-step Tournament Creation Wizard (`TournamentWizard.tsx`).
- **Pages & Routes**:
  - Home Portal (`/`), Tournament Explorer (`/tournaments`), Deep Tournament Page (`/tournaments/[slug]`), Admin Command Center (`/admin`), Tournament Creator (`/admin/create`), Clan Directory (`/clans`), and Season Rankings (`/leaderboard`).
  - Complete REST API endpoints under `/api/tournaments` and `/api/matches`.
- **Database & Data**:
  - Relational SQL schema with foreign keys, WAL mode, and ACID transactions via `src/lib/db.ts`.
  - Database seed script (`scripts/seed.ts`) populating 4 tournaments, 8 clans, rosters, live matches, and standings.
- **Verification**:
  - 17 unit tests verified in `scripts/test-tournament-engine.ts` with 100% pass rate.
  - Production build compiled with zero errors.

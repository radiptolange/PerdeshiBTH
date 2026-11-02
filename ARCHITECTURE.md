# ARCHITECTURE.md — System Architecture & Module Connections

> **Platform**: BTH Esports Tournament Management Platform  
> **Architecture Pattern**: Decoupled Modular Monolith with Pure Functional Tournament Engines, Type-Safe Data Layer, and Edge-Ready Next.js Frontend.

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSERS                                   |
|   (Public Visitors, Players, Clan Leaders, Tournament Admins, Match Referees)     |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ HTTPS / WebSocket / Server Actions
+-----------------------------------------------------------------------------------+
|                               NEXT.JS 15 APP ROUTER                               |
|                                                                                   |
|  ┌─────────────────────┐  ┌─────────────────────┐  ┌───────────────────────────┐  |
|  |    Public Portal    |  |   Admin Dashboard   |  |   Interactive Bracket     |  |
|  |  Tournaments, Clans |  |  Creation Wizard,   |  |   Zoom/Pan, SVG Links,    |  |
|  |  Standings, Matches |  |  Match Approvals    |  |   Live Score Updates      |  |
|  └─────────────────────┘  └─────────────────────┘  └───────────────────────────┘  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ Internal Service Layer
+-----------------------------------------------------------------------------------+
|                           BUSINESS LOGIC & ENGINE LAYER                           |
|                                                                                   |
|  ┌───────────────────────────────┐        ┌───────────────────────────────────┐   |
|  |   TOURNAMENT FORMAT ENGINE    |        |      MATCH MANAGEMENT ENGINE      |   |
|  |  - Single Elimination (Byes)  |        |  - Immutable Match ID Generator   |   |
|  |  - Double Elimination         |        |  - Deadline & Forfeit Evaluator   |   |
|  |  - Round Robin (Berger alg.)  |        |  - Substitution Protocol          |   |
|  |  - Group Stage + Knockout     |        |  - Evidence & Dispute Flow        |   |
|  |  - Swiss System Pairing       |        |  - Multi-game Settings            |   |
|  └───────────────────────────────┘        └───────────────────────────────────┘   |
|                                                                                   |
|  ┌───────────────────────────────┐        ┌───────────────────────────────────┐   |
|  |     SCORING & STANDINGS       |        |         RBAC & AUTH LAYER         |   |
|  |  - Dynamic Points & Tiebreak  |        |  - 9 Granular User Roles          |   |
|  |  - Head-to-Head, GD, GF       |        |  - Session Tokens & Audit Log     |   |
|  └───────────────────────────────┘        └───────────────────────────────────┘   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ Data Repository Layer
+-----------------------------------------------------------------------------------+
|                        DATABASE LAYER (Modular SQLite/SQL)                        |
|                                                                                   |
|  - Users, Organizations & Roles         - Tournaments & Stages                    |
|  - Clans, Teams & Player Rosters        - Fixtures, Matches & Substitutions       |
|  - Match Scores & Evidence Attachments  - Audit Logs & In-App Notifications       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory Layout & Module Responsibilities

- **`src/engine/`**: Pure functional tournament algorithms. Contains zero DOM/React dependencies. Can be tested directly with Node test runners.
  - `knockout.ts`: Power-of-two bracket builder, seeding positions, byes allocation, automatic winner advancement.
  - `double-elim.ts`: Upper bracket, lower bracket drop-down mapping, grand final and bracket reset.
  - `round-robin.ts`: Berger round rotation algorithm, home/away balancing, points assignment.
  - `group-stage.ts`: Balanced/seeded participant group distribution, standings generation, cross-group knockout qualification (e.g. A1 vs B2).
  - `swiss.ts`: Swiss system round-by-round pairings based on equal scores, non-repeat matchup constraints.
  - `standings.ts`: Universal ranking engine with configurable tie-breakers (Points, Goal Diff, Goals For, Head-to-Head).
  - `match-id.ts`: Deterministic unique match code generation (`BTH-{EVENT}-{YEAR}-R{ROUND}-M{MATCH}`).

- **`src/lib/db.ts` & `src/lib/schema.sql`**:
  - Encapsulated database access using `node:sqlite` in local environments or deployable cloud SQL.
  - Foreign keys, transactions (`runTransaction`), and indexed lookups for sub-millisecond query execution.

- **`src/lib/auth.ts`**:
  - Role-Based Access Control enforcing permissions across 9 distinct roles:
    1. `SUPER_ADMIN`
    2. `ORGANIZATION_OWNER`
    3. `TOURNAMENT_ADMIN`
    4. `TOURNAMENT_MANAGER`
    5. `MATCH_REFEREE`
    6. `CLAN_MANAGER`
    7. `TEAM_CAPTAIN`
    8. `REGISTERED_PLAYER`
    9. `SPECTATOR`

- **`src/components/bracket/`**:
  - `BracketView.tsx`: Canvas rendering matches by rounds with SVG connector paths, live scores, seed badges, and interactive click handlers.
  - `BracketControls.tsx`: Zoom in/out, reset view, toggle fullscreen, switch between tree view and round view.
  - `BracketEditor.tsx`: Admin tool to swap seeds, insert manual participants, replace slots, or freeze draw.

- **`src/components/match/`**:
  - `MatchCard.tsx`: Compact esports match card with team logos, scores, status indicator, and match ID.
  - `MatchDetailModal.tsx`: Comprehensive modal showing room credentials, assigned referee, substitution history, evidence screenshot viewer, and score dispute panel.
  - `SubstitutionModal.tsx`: Mid-match player replacement request form with eligibility checks.

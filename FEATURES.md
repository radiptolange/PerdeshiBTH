# FEATURES.md — Feature Inventory & Implementation Matrix

> **Platform**: BTH Esports Tournament & Bracket Management Platform  
> **Status Overview**: Core architectural modules, engines, components, and API specs.

---

## 1. Feature Matrix

| Category | Feature Name | Description | Status |
| :--- | :--- | :--- | :--- |
| **Tournaments** | Multi-Format Engine | Single Elimination, Double Elimination, Round Robin, Group Stage, Swiss | In Progress (Phase 4) |
| **Tournaments** | Wizard Creation | Multi-step wizard: Basic info, games, rules, registration dates, prizes | In Progress (Phase 3) |
| **Tournaments** | Competition Types | 1v1 Player, Clan 1v1, Team vs Team (configurable roster size) | Planned (Phase 3) |
| **Tournaments** | Status Lifecycle | Draft, Published, Registration, Active, Completed, Paused, Archived | In Progress (Phase 3) |
| **Brackets** | Auto Bracket Generator | Power-of-2 algorithm, automatic byes, standard seed placement | Planned (Phase 5) |
| **Brackets** | Interactive Visual Canvas | SVG connectors, live status, zoom, pan, mobile responsive cards | Planned (Phase 5) |
| **Brackets** | Manual Draw Editor | Swap positions, replace participants, freeze draw, seed overrides | Planned (Phase 5) |
| **Matches** | Permanent Unique Match IDs | Immutable IDs (e.g. `BTH-NCC-2026-R01-M001`), shareable links | Planned (Phase 6) |
| **Matches** | Scheduling & Deadlines | Server-authoritative Nepal Time (`Asia/Kathmandu`) deadline checks | Planned (Phase 6) |
| **Matches** | Mid-Match Substitutions | Roster sub requests, verification, referee approval, audit history | Planned (Phase 6) |
| **Matches** | Evidence & Proof | Screenshots, match recording links, referee score verification | Planned (Phase 6) |
| **Matches** | Dispute Handling | Dispute submission, lock branch progression, admin adjudication | Planned (Phase 6) |
| **Leaderboards**| Dynamic Points & Standings | Configurable win/draw/loss points, GD, GF, Head-to-Head tiebreakers | Planned (Phase 4) |
| **Clans & Teams**| Clan & Roster Management| Clan profiles, crests, rosters (Main & Reserve), leadership roles | Planned (Phase 2) |
| **Auth & RBAC** | Role-Based Access Control | 9 granular roles with strict server-side permission checks | Planned (Phase 2) |
| **Design** | Esports Gaming Theme | Dark-first UI, cyber violet accents, glow states, mobile-responsive | In Progress (Phase 1) |
| **Real-time** | Live Score & Updates | Dynamic polling with event callbacks, optimistic UI updates | Planned (Phase 7) |
| **Audit & Logs** | Administrative Audit Trail| Log of every bracket generation, score approval, and manual change | Planned (Phase 6) |
| **Public Portal**| Tournament Hub | Public bracket exploration, participant rosters, match schedules | Planned (Phase 7) |


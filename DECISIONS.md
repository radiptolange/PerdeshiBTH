# DECISIONS.md — Architecture & Technical Decision Records (ADR)

> **Platform**: BTH Esports Tournament Management Platform  
> **Repository**: `PerdeshiBTH`

---

## ADR-001: Next.js 15 App Router with TypeScript as Frontend & Fullstack Framework
- **Context**: BTH 1.0 was written in procedural PHP 7/8. To achieve real-time bracket interactions, component modularity, instant responsive updates, mobile responsiveness, and deployment flexibility on Vercel, a modern fullstack TypeScript framework is required.
- **Decision**: Adopt Next.js 15 (App Router) with TypeScript.
- **Rationale**: Next.js combines server-side rendering for SEO (public tournament pages) with high-performance React client components for interactive bracket zoom/pan.
- **Alternatives Rejected**: Continuing with legacy PHP (lacks reactive client bracket editing, difficult to maintain stateful UI).

---

## ADR-002: Modular Functional Tournament Engine with Zero UI Coupling
- **Context**: Previous tournament systems entangled bracket math with HTML generation and SQL queries inside 2000-line monolithic PHP classes.
- **Decision**: All tournament generation and progression logic is written as pure, deterministic TypeScript functions inside `src/engine/` that take clean inputs (participants, options) and return structured bracket/match objects.
- **Rationale**: Pure functions are 100% unit-testable in seconds without needing a live database or browser DOM. UI components only render data; they never implement mathematical bracket formulas.

---

## ADR-003: Embedded SQL with ACID Transactions & Portability
- **Context**: The tournament platform requires atomic transactions (e.g., advancing a match winner and populating the next round must occur atomically without partial writes).
- **Decision**: Use an embedded SQL database interface utilizing Node's native `DatabaseSync` (`node:sqlite`) with foreign keys and WAL mode for zero-latency local development and standalone execution, abstracted behind a repository interface that seamlessly switches to PostgreSQL/Prisma when `DATABASE_URL` is configured for production cloud deployment.
- **Rationale**: Zero external binary dependencies, immediate Windows/Linux portability, sub-millisecond query execution, and robust relational integrity.

---

## ADR-004: Immutable, Deterministic Match ID Format
- **Context**: Matches need to be referenced in live streams, Discord webhooks, WhatsApp communications, and referee logs without ambiguity.
- **Decision**: Match IDs use the immutable standard: `{PREFIX}-{CODE}-{YEAR}-R{ROUND}-M{MATCH}` (e.g., `BTH-NCC-2026-R01-M001`). Once generated, a Match ID is never altered or reused.
- **Rationale**: Human-readable, searchable, and audit-friendly.

---

## ADR-005: Server-Authoritative Nepal Time (`Asia/Kathmandu`)
- **Context**: BTH Esports operates primarily in Nepal (`UTC+05:45`). Matches, deadlines, and registration windows must align with Nepal Standard Time while allowing users in other regions to see converted times.
- **Decision**: Store all timestamps in ISO 8601 UTC in the database, with server-side validation and client-side presentation defaulting to `Asia/Kathmandu` with explicit timezone labeling.


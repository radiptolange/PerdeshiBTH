# AGENTS.md — Master Development Instructions & AI Continuity

> **Platform**: BTH Esports Tournament & Bracket Management Platform (BTH 2.0)  
> **Repository**: `PerdeshiBTH`  
> **Organization**: BTH Esports (Nepal / South Asia)  
> **Timezone**: `Asia/Kathmandu` (UTC+05:45)  
> **Philosophy**: Professional esports experience, reusable tournament engine, robust bracket generation, real-time progression, multi-format & multi-game flexibility.

---

## 1. Prime Directives for All AI Coding Agents

Every AI agent (Gemini, Claude, GPT, Cursor, etc.) working on this repository **MUST** adhere to these core rules:

1. **Read Before Writing**:
   - Read this `AGENTS.md` before making any architectural or code changes.
   - Read `DESIGN.md` before creating or updating any UI components, colors, or layouts.
   - Read `AI_CONTEXT.md` for overall architecture, current module statuses, and conventions.
   - Read `DECISIONS.md` to understand why choices were made and avoid repeating rejected approaches.

2. **Never Break Working Systems**:
   - Existing working features, routes, API contracts, and database records must remain functional.
   - Run tests (`npm run test:engine`) and build verification (`npm run build`) before concluding any phase.

3. **Production-Ready & Fully Functional**:
   - Do NOT create mock/placeholder buttons that do nothing when clicked. Every interactive button, modal, dropdown, and tab must execute real logic.
   - Never use fake or dummy hardcoded data in production workflows.
   - Handle all states gracefully: Loading, Empty, Submitting, Success, and Error.

4. **Preserve Documentation Integrity**:
   - Update `IMPLEMENTATION_STATUS.md`, `CHANGELOG.md`, and relevant architecture docs after completing each phase.
   - Leave a clear handover summary and instructions for the next agent.

5. **Type Safety & Quality Standards**:
   - Strict TypeScript everywhere (`noImplicitAny`, proper interfaces, no unhandled promises).
   - Server-side validation on every mutation; client-side validation for instant user feedback.
   - Server-authoritative timestamps in ISO 8601, formatted to `Asia/Kathmandu` by default with local time toggle.

---

## 2. Technology Stack & Architecture

- **Framework**: Next.js 15 (App Router, Server Actions, API Route Handlers)
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS with custom esports theme (`#0B0E17` dark-first background, electric violet `#7C3AED`, cyan `#06B6D4`, crimson `#EF4444`, emerald `#10B981`)
- **Icons**: `lucide-react`
- **Database Engine**: Modular SQL Layer (`node:sqlite` for high-performance zero-config embedded persistence with full ACID transactions & WAL mode, designed with an interface swappable with PostgreSQL/Prisma for cloud deployment)
- **Timezone**: Default `Asia/Kathmandu` (`+05:45`)

---

## 3. Core Engine Architecture

The platform is strictly decoupled into distinct layers:

```
src/
├── app/                  # Next.js App Router (Pages, Layouts, API endpoints)
│   ├── (public)/         # Public tournament exploration, bracket viewer, player/clan profiles
│   ├── (auth)/           # Authentication (Login, Register, Password Reset)
│   ├── admin/            # Administrative control center & Tournament creation wizard
│   └── api/              # RESTful API endpoints for external integrations & webhooks
├── components/           # Reusable UI component library (Design System compliant)
│   ├── bracket/          # Interactive Visual Bracket Engine (Single/Double Elim, Groups)
│   ├── match/            # Match cards, substitution workflow, score proof modal
│   ├── tournament/       # Creation wizard, settings, registration forms
│   └── ui/               # Base primitives (Button, Modal, Badge, Input, Card, Tabs)
├── engine/               # Pure Tournament Logic (Zero UI dependencies, 100% testable)
│   ├── knockout.ts       # Single elimination, seeding, power-of-two byes, progression
│   ├── double-elim.ts    # Winners & Losers brackets, Grand Final, bracket reset
│   ├── round-robin.ts    # Berger algorithm (single/double leg), table calculation
│   ├── group-stage.ts    # Group distribution (seeded/random/balanced), cross-group playoff seeding
│   ├── swiss.ts          # Swiss pairing algorithm & tie-breakers (Buchholz / Sonneborn-Berger)
│   ├── match-id.ts       # Standardized permanent Match ID generator (e.g. BTH-NCC-2026-R01-M001)
│   └── standings.ts      # Multi-criteria points & tie-breaking engine (Points, GD, GF, H2H)
├── lib/                  # Shared utilities, database connection, auth, date formatting
│   ├── db.ts             # Database interface & transaction runner
│   ├── auth.ts           # Session & RBAC verification
│   └── utils.ts          # Class merging, date helpers, sanitization
└── types/                # Strict TypeScript declarations across tournaments, matches, teams, users
```

---

## 4. Coding Conventions

- **Component Structure**: Functional React components with named exports.
- **Client vs Server**: Mark interactive components explicitly with `'use client';`. Keep data fetching in Server Components or dedicated service actions.
- **Match IDs**: Formatted strictly as `{PREFIX}-{TOURNAMENT_CODE}-{YEAR}-R{ROUND_NUM}-M{MATCH_NUM}` (e.g., `BTH-EFT-2026-R01-M001`). Once assigned, match IDs are immutable.
- **Result Approvals**: Match scores require formal submission + opponent/referee verification before the tournament engine advances participants to the next round.
- **Substitutions**: Mid-match roster substitutions must respect tournament rules (max allowed, window, referee approval requirement) and create an audit log.

---

## 5. Handover Protocol

Before wrapping up your response or passing work to another AI:
1. Run `npm run build` or verify TypeScript compilation.
2. Run test suites.
3. Update `IMPLEMENTATION_STATUS.md`.
4. Summarize exactly what was completed and what the next agent should tackle.


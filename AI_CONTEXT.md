# AI_CONTEXT.md — Portable AI Knowledge & Project Context

> **Audience**: AI Coding Agents (Gemini, Claude, GPT, Cursor, Copilot)  
> **Purpose**: Serves as the continuous context and source of truth across development sessions.

---

## 1. Project At A Glance

- **Name**: BTH Esports Tournament & Bracket Management Platform (BTH 2.0)
- **Domain**: Professional competitive esports platform for BTH Gaming (Nepal & South Asia), supporting eFootball, PUBG Mobile, Valorant, Free Fire, Mobile Legends, and custom games.
- **Repository Path**: `d:\PerdeshiBTH`
- **Key Characteristics**:
  - Fully decoupled, pure functional tournament engine (`src/engine/`).
  - Production-grade Next.js 15 App Router with TypeScript.
  - Native embedded SQL database (`node:sqlite`) with ACID transactions, WAL mode, foreign keys.
  - Dark-first esports design system defined in `DESIGN.md`.
  - Immutable permanent match IDs (e.g. `BTH-EFT-2026-R01-M001`).
  - Server-authoritative Nepal Standard Time (`Asia/Kathmandu` / `UTC+05:45`).

---

## 2. Directory Architecture Map

```
PerdeshiBTH/
├── AGENTS.md                   # Agent guidelines, prime directives, coding rules
├── DESIGN.md                   # Esports design system tokens, components, responsive rules
├── ARCHITECTURE.md             # System architecture & module relations
├── DATABASE.md                 # SQL schema, tables, relationships
├── API.md                      # REST endpoints & payload contracts
├── TOURNAMENT_ENGINE.md        # Mathematical algorithms & progression logic
├── FEATURES.md                 # Feature status matrix
├── IMPLEMENTATION_STATUS.md    # Active progress & phase tracking
├── DECISIONS.md                # Architectural Decision Records (ADR)
├── AI_CONTEXT.md               # This context file
├── CHANGELOG.md                # Version history
├── package.json                # Dependencies and scripts
├── src/
│   ├── app/                    # Next.js App Router pages and APIs
│   ├── components/             # Reusable UI & bracket components
│   ├── engine/                 # Pure tournament algorithms (no UI/DB dependencies)
│   ├── lib/                    # Database, auth, formatting, helpers
│   └── types/                  # Strict TypeScript interfaces
└── scripts/                    # Database seeds and engine test suites
```

---

## 3. Important Rules to Remember

1. **Never use dummy non-functional buttons**: If a button exists, it must either perform its real action or open a functional modal.
2. **Never break existing features**: Keep the build green (`npm run build`) and test suites passing (`npm run test:engine`).
3. **Keep the tournament engine functional**: The math in `src/engine/` must remain pure functions that return clean data structures without side effects.
4. **Timezone awareness**: Store UTC in database, format to `Asia/Kathmandu` for display.

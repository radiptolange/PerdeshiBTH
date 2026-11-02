# DESIGN.md — Esports Visual Identity & Design System

> **Platform**: BTH Esports Tournament Management Platform  
> **Aesthetic**: Premium Competitive Esports, Dark-First, Cyber-Precision, High-Contrast Visibility  
> **Target Devices**: Mobile (320px–480px), Tablet (768px–1024px), Desktop (1280px–1920px+)

---

## 1. Design Philosophy

The BTH Esports platform embraces a clean, aggressive, and modern competitive gaming identity. It combines deep interstellar dark backgrounds with glowing neon accents, sharp geometric accents, and legible typography optimized for split-second score reading and complex bracket navigation.

Key principles:
- **Dark-First Hierarchy**: Reduces eye strain during long gaming sessions while allowing vivid accent colors (electric violet, neon cyan, victory gold, combat crimson) to pop.
- **Precision Data Visualization**: Match cards, brackets, and leaderboards provide instant clarity of scores, statuses, seeds, and progression.
- **Tactile Interactivity**: Smooth micro-interactions, subtle borders with inner glow on hover, responsive touch targets (minimum 44x44px on mobile).
- **Zero Decorative Clutter**: Every element serves an informational or navigational purpose. Avoid cartoonish or distracting animations.

---

## 2. Color Palette & Tokens

### Primary Canvas (Dark-First)
- **Background Primary**: `#0B0E17` (Deep Void Navy)
- **Background Secondary / Surface**: `#121626` (Abyssal Slate)
- **Background Elevated / Card**: `#1A2035` (Command Navy)
- **Background Highlight / Hover**: `#242C48` (Tactical Slate)
- **Border Subtle**: `rgba(255, 255, 255, 0.08)`
- **Border Active / Focus**: `rgba(124, 58, 237, 0.5)` (Glow Violet)

### Esports Accent System
- **Primary Brand / Magic Violet**: `#7C3AED` (`violet-600`) — Tournament crowns, primary CTAs, active rounds.
- **Cyber Cyan**: `#06B6D4` (`cyan-500`) — Live matches, active participants, player stats, highlight links.
- **Victory Emerald**: `#10B981` (`emerald-500`) — Match winners, qualified teams, approved results, online status.
- **Alert Crimson**: `#EF4444` (`red-500`) — Disputed matches, forfeits, penalties, eliminated participants.
- **Champion Gold**: `#F59E0B` (`amber-500`) — 1st place medals, championship trophies, MVP badges.

### Text & Readability Tokens
- **Text Headings / Bright**: `#F8FAFC` (`slate-50`)
- **Text Body / Standard**: `#CBD5E1` (`slate-300`)
- **Text Muted / Subtitle**: `#94A3B8` (`slate-400`)
- **Text Dimmed / Meta**: `#64748B` (`slate-500`)

---

## 3. Typography

- **Headings**: Modern geometric sans (`font-sans` / Inter, Rajdhani, or system UI font with aggressive letter-spacing for titles).
- **Stats / Scores / Match IDs**: Monospace numbers (`font-mono`) to ensure tabular alignment in brackets and leaderboards.
- **Hierarchy**:
  - `Display / Banner`: 32px – 48px, Bold / Extrabold, uppercase tracking (`tracking-wide`)
  - `H1 / Section Titles`: 24px – 32px, Bold
  - `H2 / Card Headers`: 18px – 22px, Semibold
  - `H3 / Match Headers`: 14px – 16px, Medium / Semibold
  - `Body`: 14px – 15px, Regular
  - `Caption / Meta / Badges`: 11px – 12px, Semibold, uppercase tracking

---

## 4. UI Components Specification

### A. Match Cards
- Compact 2-row layout with Team A and Team B.
- Participant row includes:
  - Avatar / Clan Crest (24x24px).
  - Name / Gamertag with truncation on small screens.
  - Seed number badge (e.g., `#1`).
  - Score box (`font-mono`, bold, highlighted if winner).
- Status header:
  - Unique Match ID (e.g., `BTH-NCC-2026-R01-M001`).
  - Scheduled time / Countdown / Status pill (`SCHEDULED`, `LIVE`, `AWAITING_RESULT`, `UNDER_REVIEW`, `COMPLETED`).
- Connector nodes on right/left for bracket tree lines.

### B. Visual Bracket Canvas
- Horizontally scrollable on desktop & mobile with drag/pan and zoom support.
- Round headers (`Round of 16`, `Quarter-Finals`, `Semi-Finals`, `Grand Final`).
- SVG dynamic connector curves between paired matches.
- Winner progression animation.

### C. Leaderboard & Standings Table
- Sticky headers on mobile.
- Columns: Rank, Clan/Player, MP (Matches Played), W, D, L, GF, GA, GD, Pts, Form (Last 5 matches with W/D/L pills).
- Top positions highlighted with qualification border or gold/silver/bronze badges.

### D. Action Modals & Drawers
- Backdrop blur (`backdrop-blur-md bg-black/70`).
- Card container with glowing accent border (`border border-violet-500/30`).
- Clear confirmation buttons: Green for approve, Red for dispute/reject, Purple for primary action.

---

## 5. Responsive Rules & Breakpoints

- **Mobile (< 768px)**:
  - Single column dashboard cards.
  - Bracket supports switch between "Round-by-Round Tabbed View" and "Swipeable Tree View".
  - Bottom navigation bar or compact header hamburger menu.
  - Match details modal opens as a slide-up bottom sheet.
- **Tablet (768px – 1024px)**:
  - 2-column dashboard layout.
  - Horizontally pannable bracket tree.
- **Desktop (1024px+)**:
  - Full multi-column admin dashboard with real-time stats overview.
  - Complete bracket visualization with zoom & fullscreen toggle.


# TOURNAMENT_ENGINE.md — Tournament Generation Algorithms & Progression Engine

> **Platform**: BTH Esports Tournament Engine  
> **Philosophy**: Mathematical determinism, zero side effects, strict seed protection, byes handling, and real-time winner advancement.

---

## 1. Supported Formats & Mathematical Rules

### A. Single Elimination (Knockout)
1. **Bracket Size**: Next power of 2:
   $$N_{bracket} = 2^{\lceil \log_2(P) \rceil}$$
   where $P$ is the total count of confirmed participants.
2. **Byes Allocation**:
   $$N_{byes} = N_{bracket} - P$$
   Byes are awarded to the highest seeds ($1, 2, \dots, N_{byes}$) so top performers skip Round 1.
3. **Standard Seed Pairing Scheme**:
   In any round with $K$ matches, the sum of seeds in match $i$ is $2K + 1$.
   For an 8-slot bracket:
   - Match 1: Seed 1 vs Seed 8
   - Match 2: Seed 4 vs Seed 5
   - Match 3: Seed 2 vs Seed 7
   - Match 4: Seed 3 vs Seed 6
   This guarantees that seeds 1 and 2 cannot meet until the Grand Final, and seeds 1, 2, 3, 4 cannot meet until the Semi-Finals.
4. **Third Place Match**:
   Semi-final losers are automatically mapped to an optional bronze medal match (`THIRD_PLACE`).
5. **Progression Trigger**:
   When Match $M_i$ in Round $R$ has an approved winner $W$, $W$ is populated into the designated `next_match_id` in Round $R+1$ at either the `HOME` or `AWAY` slot.

---

### B. Double Elimination
1. **Upper Bracket (Winners)**: Standard single-elimination progression.
2. **Lower Bracket (Losers)**:
   - Round 1 Losers drop into Lower Round 1.
   - Subsequent Winners in the Lower Bracket face the dropping losers from the Upper Bracket in alternating rounds.
3. **Grand Final**:
   Winner of Upper Bracket faces Winner of Lower Bracket.
4. **Bracket Reset**:
   If the Lower Bracket winner defeats the Upper Bracket winner in Match 1 of the Grand Final, an optional Grand Final Reset Match (Match 2) is automatically unlocked.

---

### C. Round Robin (Berger Algorithm)
1. **Participants**: If $P$ is odd, add a dummy "BYE" participant:
   $$N = \begin{cases} P & \text{if } P \text{ is even} \\ P + 1 & \text{if } P \text{ is odd} \end{cases}$$
2. **Total Rounds**: $N - 1$ rounds for single leg (or $2(N - 1)$ for double leg home/away).
3. **Matches Per Round**: $N / 2$ matches per round.
4. **Rotation Matrix**:
   Keep participant 1 fixed at position 0, rotate all remaining $N-1$ participants clockwise every round:
   - Match $j$ in round $r$ pairs position $j$ with position $(N - 1 - j)$.
   - Alternating home/away status prevents one participant from having excessive consecutive home fixtures.
5. **Double Leg**: In Leg 2, swap home and away participant assignments.

---

### D. Group Stage + Knockout
1. **Group Assignment**:
   - $K$ groups (e.g. Group A, Group B, Group C, Group D).
   - Participants sorted by seed or randomized, then distributed snake-wise:
     - Group A: Seed 1, 8, 9, 16...
     - Group B: Seed 2, 7, 10, 15...
     - Group C: Seed 3, 6, 11, 14...
     - Group D: Seed 4, 5, 12, 13...
2. **Internal Group Play**: Single or double round-robin within each group.
3. **Advancement**: Top $M$ participants (usually top 2) qualify for the Knockout Stage.
4. **Cross-Group Knockout Mapping**:
   To ensure competitive balance:
   - Match 1: 1st Group A vs 2nd Group B
   - Match 2: 1st Group C vs 2nd Group D
   - Match 3: 1st Group B vs 2nd Group A
   - Match 4: 1st Group D vs 2nd Group C

---

### E. Swiss System
1. **Rounds**: Typically $\lceil \log_2(P) \rceil$ rounds.
2. **Pairing Criteria**:
   - Pair participants with identical or closest match records (e.g. 1-0 vs 1-0, 0-1 vs 0-1).
   - Prevent repeat matchups across all previous rounds.
   - In case of odd players, award a bye to the lowest-ranked player who has not yet received a bye.
3. **Tie-Breaking Scores**:
   - Buchholz Score: Sum of all opponents' total scores.
   - Sonneborn-Berger Score: Sum of scores of opponents defeated + 0.5 * opponents drawn.

---

## 2. Match ID Deterministic Specification

Match IDs follow a strict format that never changes after creation:

$$\text{Prefix}-\text{TournamentSlug}-\text{Year}-\text{RoundCode}-\text{MatchCode}$$

Examples:
- `BTH-NCC-2026-R01-M001` (Round 1, Match 1)
- `BTH-NCC-2026-QF-M003` (Quarter-Finals, Match 3)
- `BTH-NCC-2026-GF-M001` (Grand Final)
- `BTH-NCC-2026-GA-R01-M002` (Group A, Round 1, Match 2)

---

## 3. Results Approval & Progression Pipeline

1. **Submission**: Team Captain or Player enters scores (e.g., 2 - 1) and uploads screenshot evidence. Match status becomes `AWAITING_RESULT` or `UNDER_REVIEW`.
2. **Opponent Confirmation**: Opponent can confirm or dispute within deadline (default 30 minutes post-match).
3. **Referee / Admin Approval**:
   - Score verified against evidence.
   - Status updated to `COMPLETED`.
   - Engine calls `advanceWinner(matchId)`.
   - Winner is inserted into the corresponding slot of the next match.
   - For Group / Round-Robin: `recomputeStandings(tournamentId, groupId)` recalculates points, goal difference, and ranks.
4. **Dispute**:
   - If disputed, status changes to `DISPUTED`.
   - Progression is halted for that branch until an Administrator or Referee issues a formal ruling.


import { Match, BracketType } from '../types/match';
import { TournamentParticipant } from '../types/tournament';
import { generateMatchId } from './match-id';
import { nextPowerOfTwo, getSeedingOrder } from './knockout';

export interface DoubleElimOptions {
  tournamentId: string;
  tournamentCode: string;
  year?: number;
  seeding?: 'SEEDED' | 'RANDOM';
  enableBracketReset?: boolean; // Default true
}

/**
 * Pure generator for Double Elimination Tournament Brackets.
 * Supports 4, 8, 16, 32 participants (or power of two with byes).
 */
export function generateDoubleElimMatches(
  participants: TournamentParticipant[],
  options: DoubleElimOptions
): {
  matches: Match[];
  upperMatches: Match[];
  lowerMatches: Match[];
  grandFinalMatches: Match[];
  totalRoundsUpper: number;
  totalRoundsLower: number;
} {
  const pCount = participants.length;
  if (pCount < 4) {
    throw new Error('Double Elimination requires at least 4 participants');
  }

  const bracketSize = nextPowerOfTwo(pCount);
  const totalRoundsUpper = Math.log2(bracketSize);
  const totalRoundsLower = (totalRoundsUpper - 1) * 2;
  const now = new Date().toISOString();

  // Sort participants
  let sorted = [...participants];
  if (options.seeding === 'RANDOM') {
    sorted.sort(() => Math.random() - 0.5);
  } else {
    sorted.sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  }

  const seedToParticipantMap = new Map<number, TournamentParticipant>();
  sorted.forEach((p, idx) => {
    seedToParticipantMap.set(idx + 1, p);
  });

  const seedPairs = getSeedingOrder(bracketSize);

  // 1. Generate Upper Bracket Matches
  const upperRoundMap = new Map<number, Match[]>();
  for (let r = 1; r <= totalRoundsUpper; r++) {
    const matchesCount = bracketSize / Math.pow(2, r);
    const roundMatches: Match[] = [];
    const isFinal = r === totalRoundsUpper;

    for (let m = 1; m <= matchesCount; m++) {
      const matchId = generateMatchId({
        prefix: 'BTH',
        tournamentCode: options.tournamentCode,
        year: options.year,
        stageCode: 'UB',
        roundNumber: r,
        matchNumber: m,
      });

      roundMatches.push({
        id: matchId,
        tournament_id: options.tournamentId,
        bracket_type: isFinal ? 'WINNERS' : 'WINNERS',
        round_number: r,
        round_name: isFinal ? 'Winners Final' : `Upper Round ${r}`,
        match_number: m,
        home_score: 0,
        away_score: 0,
        status: 'SCHEDULED',
        created_at: now,
        updated_at: now,
      });
    }
    upperRoundMap.set(r, roundMatches);
  }

  // Link progression within Upper Bracket
  for (let r = 1; r < totalRoundsUpper; r++) {
    const cur = upperRoundMap.get(r)!;
    const next = upperRoundMap.get(r + 1)!;
    for (let m = 0; m < cur.length; m++) {
      cur[m].next_match_id = next[Math.floor(m / 2)].id;
      cur[m].next_match_slot = m % 2 === 0 ? 'HOME' : 'AWAY';
    }
  }

  // Populate Round 1 of Upper Bracket
  const upperRound1 = upperRoundMap.get(1)!;
  for (let i = 0; i < upperRound1.length; i++) {
    const homeP = seedToParticipantMap.get(seedPairs[i * 2]);
    const awayP = seedToParticipantMap.get(seedPairs[i * 2 + 1]);
    const match = upperRound1[i];
    if (homeP) match.home_participant_id = homeP.id;
    if (awayP) match.away_participant_id = awayP.id;

    // Handle byes
    if (homeP && !awayP) {
      match.winner_id = homeP.id;
      match.status = 'COMPLETED';
      if (match.next_match_id) {
        const nextRound = upperRoundMap.get(2)!;
        const nextMatch = nextRound.find((nm) => nm.id === match.next_match_id);
        if (nextMatch) {
          if (match.next_match_slot === 'HOME') nextMatch.home_participant_id = homeP.id;
          else nextMatch.away_participant_id = homeP.id;
        }
      }
    }
  }

  // 2. Generate Lower Bracket Matches
  const lowerRoundMap = new Map<number, Match[]>();
  let currentLowerMatchesCount = bracketSize / 4;

  for (let lr = 1; lr <= totalRoundsLower; lr++) {
    const roundMatches: Match[] = [];
    const isLowerFinal = lr === totalRoundsLower;

    for (let m = 1; m <= currentLowerMatchesCount; m++) {
      const matchId = generateMatchId({
        prefix: 'BTH',
        tournamentCode: options.tournamentCode,
        year: options.year,
        stageCode: 'LB',
        roundNumber: lr,
        matchNumber: m,
      });

      roundMatches.push({
        id: matchId,
        tournament_id: options.tournamentId,
        bracket_type: 'LOSERS',
        round_number: lr,
        round_name: isLowerFinal ? 'Losers Final' : `Lower Round ${lr}`,
        match_number: m,
        home_score: 0,
        away_score: 0,
        status: 'SCHEDULED',
        created_at: now,
        updated_at: now,
      });
    }
    lowerRoundMap.set(lr, roundMatches);

    // In double elimination lower bracket, match count halves every odd round:
    // e.g. For 8 bracket: LR1 has 2 matches, LR2 has 2 matches, LR3 has 1 match, LR4 has 1 match (Losers Final).
    if (lr % 2 === 0) {
      currentLowerMatchesCount = Math.max(1, currentLowerMatchesCount / 2);
    }
  }

  // Link lower bracket progression
  for (let lr = 1; lr < totalRoundsLower; lr++) {
    const cur = lowerRoundMap.get(lr)!;
    const next = lowerRoundMap.get(lr + 1)!;

    if (lr % 2 === 1) {
      // Odd round to Even round: 1-to-1 mapping into home slot (away slot filled by Upper bracket loser)
      for (let m = 0; m < cur.length; m++) {
        if (next[m]) {
          cur[m].next_match_id = next[m].id;
          cur[m].next_match_slot = 'HOME';
        }
      }
    } else {
      // Even round to Odd round: 2-to-1 mapping
      for (let m = 0; m < cur.length; m++) {
        const nextIdx = Math.floor(m / 2);
        if (next[nextIdx]) {
          cur[m].next_match_id = next[nextIdx].id;
          cur[m].next_match_slot = m % 2 === 0 ? 'HOME' : 'AWAY';
        }
      }
    }
  }

  // Link Upper Bracket losers dropping into Lower Bracket
  // Upper Round 1 losers drop into Lower Round 1
  const upperR1 = upperRoundMap.get(1)!;
  const lowerR1 = lowerRoundMap.get(1)!;
  for (let m = 0; m < upperR1.length; m++) {
    const targetMatch = lowerR1[Math.floor(m / 2)];
    if (targetMatch) {
      upperR1[m].loser_next_match_id = targetMatch.id;
      upperR1[m].loser_next_match_slot = m % 2 === 0 ? 'HOME' : 'AWAY';
    }
  }

  // Upper subsequent round losers drop into Lower even rounds (LR2, LR4, etc.)
  for (let ur = 2; ur < totalRoundsUpper; ur++) {
    const upperR = upperRoundMap.get(ur)!;
    const targetLowerRoundNum = (ur - 1) * 2;
    const lowerR = lowerRoundMap.get(targetLowerRoundNum);
    if (lowerR) {
      for (let m = 0; m < upperR.length; m++) {
        if (lowerR[m]) {
          upperR[m].loser_next_match_id = lowerR[m].id;
          upperR[m].loser_next_match_slot = 'AWAY';
        }
      }
    }
  }

  // Upper Final loser drops into Losers Final (totalRoundsLower)
  const upperFinal = upperRoundMap.get(totalRoundsUpper)![0];
  const lowerFinal = lowerRoundMap.get(totalRoundsLower)![0];
  if (upperFinal && lowerFinal) {
    upperFinal.loser_next_match_id = lowerFinal.id;
    upperFinal.loser_next_match_slot = 'AWAY';
  }

  // 3. Generate Grand Final
  const gfId1 = generateMatchId({
    prefix: 'BTH',
    tournamentCode: options.tournamentCode,
    year: options.year,
    stageCode: 'GF',
    roundNumber: 1,
    matchNumber: 1,
  });

  const grandFinal1: Match = {
    id: gfId1,
    tournament_id: options.tournamentId,
    bracket_type: 'GRAND_FINAL',
    round_number: totalRoundsUpper + 1,
    round_name: 'Grand Final',
    match_number: 1,
    home_score: 0,
    away_score: 0,
    status: 'SCHEDULED',
    created_at: now,
    updated_at: now,
  };

  // Winners Final winner -> Grand Final HOME slot
  upperFinal.next_match_id = gfId1;
  upperFinal.next_match_slot = 'HOME';

  // Losers Final winner -> Grand Final AWAY slot
  lowerFinal.next_match_id = gfId1;
  lowerFinal.next_match_slot = 'AWAY';

  const grandFinalMatches: Match[] = [grandFinal1];

  // Optional Grand Final Reset match
  if (options.enableBracketReset !== false) {
    const gfId2 = generateMatchId({
      prefix: 'BTH',
      tournamentCode: options.tournamentCode,
      year: options.year,
      stageCode: 'GF',
      roundNumber: 2,
      matchNumber: 2,
    });

    const grandFinal2: Match = {
      id: gfId2,
      tournament_id: options.tournamentId,
      bracket_type: 'GRAND_FINAL_RESET',
      round_number: totalRoundsUpper + 2,
      round_name: 'Grand Final (Reset)',
      match_number: 2,
      home_score: 0,
      away_score: 0,
      status: 'UPCOMING',
      created_at: now,
      updated_at: now,
    };

    grandFinal1.next_match_id = gfId2;
    grandFinalMatches.push(grandFinal2);
  }

  // Flatten all matches
  const upperMatches: Match[] = [];
  for (let r = 1; r <= totalRoundsUpper; r++) {
    upperMatches.push(...upperRoundMap.get(r)!);
  }

  const lowerMatches: Match[] = [];
  for (let lr = 1; lr <= totalRoundsLower; lr++) {
    lowerMatches.push(...lowerRoundMap.get(lr)!);
  }

  const allMatches = [...upperMatches, ...lowerMatches, ...grandFinalMatches];

  return {
    matches: allMatches,
    upperMatches,
    lowerMatches,
    grandFinalMatches,
    totalRoundsUpper,
    totalRoundsLower,
  };
}


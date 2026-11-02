import { Match, BracketType } from '../types/match';
import { TournamentParticipant } from '../types/tournament';
import { generateMatchId } from './match-id';

export interface KnockoutOptions {
  tournamentId: string;
  tournamentCode: string;
  year?: number;
  includeThirdPlace?: boolean;
  seeding?: 'SEEDED' | 'RANDOM';
}

/**
 * Returns the next power of 2 greater than or equal to n.
 */
export function nextPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Generates standard tournament seeding order for a given power-of-two size.
 * Example for 8: [1, 8, 4, 5, 2, 7, 3, 6]
 * This ensures Seed 1 and 2 are in opposite halves, Seed 3 and 4 are in opposite quarters.
 */
export function getSeedingOrder(bracketSize: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < bracketSize) {
    const nextSeeds: number[] = [];
    const currentSum = seeds.length * 2 + 1;
    for (const seed of seeds) {
      nextSeeds.push(seed);
      nextSeeds.push(currentSum - seed);
    }
    seeds = nextSeeds;
  }
  return seeds;
}

export function getRoundName(totalRounds: number, currentRound: number): string {
  const roundsRemaining = totalRounds - currentRound;
  switch (roundsRemaining) {
    case 0:
      return 'Grand Final';
    case 1:
      return 'Semi-Finals';
    case 2:
      return 'Quarter-Finals';
    case 3:
      return 'Round of 16';
    case 4:
      return 'Round of 32';
    case 5:
      return 'Round of 64';
    default:
      return `Round ${currentRound}`;
  }
}

/**
 * Pure generator for Single Elimination (Knockout) Brackets.
 */
export function generateKnockoutMatches(
  participants: TournamentParticipant[],
  options: KnockoutOptions
): {
  matches: Match[];
  bracketSize: number;
  totalRounds: number;
  byesCount: number;
} {
  const pCount = participants.length;
  if (pCount < 2) {
    throw new Error('Knockout requires at least 2 participants');
  }

  const bracketSize = nextPowerOfTwo(pCount);
  const totalRounds = Math.log2(bracketSize);
  const byesCount = bracketSize - pCount;

  // Prepare seeded or shuffled participant slots
  let sortedParticipants = [...participants];
  if (options.seeding === 'RANDOM') {
    // Deterministic or pseudo-random shuffle
    sortedParticipants.sort(() => Math.random() - 0.5);
  } else {
    // Sort by seed if provided, otherwise preserve original order
    sortedParticipants.sort((a, b) => {
      const seedA = a.seed ?? 9999;
      const seedB = b.seed ?? 9999;
      return seedA - seedB;
    });
  }

  // Map participants to seed positions (1 to pCount)
  const seedToParticipantMap = new Map<number, TournamentParticipant>();
  sortedParticipants.forEach((p, idx) => {
    seedToParticipantMap.set(idx + 1, p);
  });

  const seedPairs = getSeedingOrder(bracketSize);
  const matches: Match[] = [];
  const now = new Date().toISOString();

  // Create match shells round by round
  // Round 1 matches count = bracketSize / 2
  // Round 2 matches count = bracketSize / 4, etc.
  const roundMatchesMap = new Map<number, Match[]>();

  for (let r = 1; r <= totalRounds; r++) {
    const matchesInRound = bracketSize / Math.pow(2, r);
    const roundMatches: Match[] = [];
    const roundName = getRoundName(totalRounds, r);

    for (let m = 1; m <= matchesInRound; m++) {
      const matchId = generateMatchId({
        prefix: 'BTH',
        tournamentCode: options.tournamentCode,
        year: options.year,
        roundNumber: r,
        matchNumber: m,
      });

      const match: Match = {
        id: matchId,
        tournament_id: options.tournamentId,
        bracket_type: r === totalRounds ? 'GRAND_FINAL' : 'WINNERS',
        round_number: r,
        round_name: roundName,
        match_number: m,
        home_score: 0,
        away_score: 0,
        status: 'SCHEDULED',
        created_at: now,
        updated_at: now,
      };

      roundMatches.push(match);
    }
    roundMatchesMap.set(r, roundMatches);
  }

  // Link progression pointers: match m in round r feeds match ceil(m/2) in round r+1
  for (let r = 1; r < totalRounds; r++) {
    const currentRound = roundMatchesMap.get(r)!;
    const nextRound = roundMatchesMap.get(r + 1)!;

    for (let m = 0; m < currentRound.length; m++) {
      const nextMatchIdx = Math.floor(m / 2);
      const isHome = m % 2 === 0;
      currentRound[m].next_match_id = nextRound[nextMatchIdx].id;
      currentRound[m].next_match_slot = isHome ? 'HOME' : 'AWAY';
    }
  }

  // Populate Round 1 participants using the seeded bracket order
  const round1Matches = roundMatchesMap.get(1)!;
  for (let i = 0; i < round1Matches.length; i++) {
    const homeSeed = seedPairs[i * 2];
    const awaySeed = seedPairs[i * 2 + 1];

    const homeP = seedToParticipantMap.get(homeSeed);
    const awayP = seedToParticipantMap.get(awaySeed);

    const match = round1Matches[i];

    if (homeP) {
      match.home_participant_id = homeP.id;
    }
    if (awayP) {
      match.away_participant_id = awayP.id;
    }

    // Auto-advance byes:
    // If home participant exists and away participant is undefined (BYE)
    if (homeP && !awayP) {
      match.winner_id = homeP.id;
      match.status = 'COMPLETED';
      // Feed winner to next round
      if (match.next_match_id && totalRounds > 1) {
        const nextRound = roundMatchesMap.get(2)!;
        const nextMatch = nextRound.find((nm) => nm.id === match.next_match_id);
        if (nextMatch) {
          if (match.next_match_slot === 'HOME') {
            nextMatch.home_participant_id = homeP.id;
          } else {
            nextMatch.away_participant_id = homeP.id;
          }
        }
      }
    } else if (!homeP && awayP) {
      match.winner_id = awayP.id;
      match.status = 'COMPLETED';
      if (match.next_match_id && totalRounds > 1) {
        const nextRound = roundMatchesMap.get(2)!;
        const nextMatch = nextRound.find((nm) => nm.id === match.next_match_id);
        if (nextMatch) {
          if (match.next_match_slot === 'HOME') {
            nextMatch.home_participant_id = awayP.id;
          } else {
            nextMatch.away_participant_id = awayP.id;
          }
        }
      }
    }
  }

  // Flatten matches into result
  for (let r = 1; r <= totalRounds; r++) {
    matches.push(...roundMatchesMap.get(r)!);
  }

  // Handle optional Third Place Match (between Semi-Final losers)
  if (options.includeThirdPlace && totalRounds >= 2) {
    const semiRound = totalRounds - 1;
    const semiMatches = roundMatchesMap.get(semiRound);

    if (semiMatches && semiMatches.length === 2) {
      const thirdPlaceId = generateMatchId({
        prefix: 'BTH',
        tournamentCode: options.tournamentCode,
        year: options.year,
        stageCode: '3RD',
        roundNumber: semiRound,
        matchNumber: 1,
      });

      const thirdPlaceMatch: Match = {
        id: thirdPlaceId,
        tournament_id: options.tournamentId,
        bracket_type: 'THIRD_PLACE',
        round_number: totalRounds,
        round_name: 'Third Place Playoff',
        match_number: 99,
        home_score: 0,
        away_score: 0,
        status: 'SCHEDULED',
        created_at: now,
        updated_at: now,
      };

      semiMatches[0].loser_next_match_id = thirdPlaceId;
      semiMatches[0].loser_next_match_slot = 'HOME';

      semiMatches[1].loser_next_match_id = thirdPlaceId;
      semiMatches[1].loser_next_match_slot = 'AWAY';

      matches.push(thirdPlaceMatch);
    }
  }

  return {
    matches,
    bracketSize,
    totalRounds,
    byesCount,
  };
}

/**
 * Updates a match with scores, sets winner/loser, and advances the winner (and loser if 3rd place exists).
 */
export function advanceWinnerInKnockout(
  matches: Match[],
  matchId: string,
  winnerId: string,
  loserId?: string
): Match[] {
  const matchIndex = matches.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) {
    throw new Error(`Match with ID ${matchId} not found`);
  }

  const updatedMatches = matches.map((m) => ({ ...m }));
  const match = updatedMatches[matchIndex];

  match.winner_id = winnerId;
  match.loser_id = loserId;
  match.status = 'COMPLETED';
  match.updated_at = new Date().toISOString();

  // Advance winner to next round
  if (match.next_match_id) {
    const nextMatch = updatedMatches.find((m) => m.id === match.next_match_id);
    if (nextMatch) {
      if (match.next_match_slot === 'HOME') {
        nextMatch.home_participant_id = winnerId;
      } else {
        nextMatch.away_participant_id = winnerId;
      }
      nextMatch.updated_at = new Date().toISOString();
    }
  }

  // Advance loser to 3rd place match if configured
  if (match.loser_next_match_id && loserId) {
    const thirdMatch = updatedMatches.find((m) => m.id === match.loser_next_match_id);
    if (thirdMatch) {
      if (match.loser_next_match_slot === 'HOME') {
        thirdMatch.home_participant_id = loserId;
      } else {
        thirdMatch.away_participant_id = loserId;
      }
      thirdMatch.updated_at = new Date().toISOString();
    }
  }

  return updatedMatches;
}


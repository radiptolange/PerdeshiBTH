import { Match } from '../types/match';
import { TournamentParticipant } from '../types/tournament';
import { generateMatchId } from './match-id';

export interface SwissOptions {
  tournamentId: string;
  tournamentCode: string;
  year?: number;
  totalRounds?: number;
}

export interface SwissStanding {
  participant: TournamentParticipant;
  score: number; // Wins or points
  buchholz: number; // Sum of opponents' scores
  opponentsFaced: string[]; // List of participant IDs
}

/**
 * Generates Swiss pairing for the next round based on completed match history.
 */
export function generateNextSwissRound(
  participants: TournamentParticipant[],
  completedMatches: Match[],
  currentRoundNumber: number,
  options: SwissOptions
): Match[] {
  // 1. Calculate record and opponents faced for each participant
  const recordMap = new Map<string, {
    score: number;
    opponents: Set<string>;
    participant: TournamentParticipant;
  }>();

  for (const p of participants) {
    recordMap.set(p.id, {
      score: 0,
      opponents: new Set<string>(),
      participant: p,
    });
  }

  for (const match of completedMatches) {
    const h = match.home_participant_id;
    const a = match.away_participant_id;
    if (!h || !a) continue;

    const hRec = recordMap.get(h);
    const aRec = recordMap.get(a);
    if (!hRec || !aRec) continue;

    hRec.opponents.add(a);
    aRec.opponents.add(h);

    if (match.winner_id === h) {
      hRec.score += 1;
    } else if (match.winner_id === a) {
      aRec.score += 1;
    } else if (match.home_score === match.away_score && match.status === 'COMPLETED') {
      hRec.score += 0.5;
      aRec.score += 0.5;
    }
  }

  // 2. Sort participants descending by score
  const sorted = Array.from(recordMap.values()).sort((x, y) => {
    if (y.score !== x.score) return y.score - x.score;
    return (x.participant.seed ?? 999) - (y.participant.seed ?? 999);
  });

  // 3. Greedy pairing matching similar scores without rematches
  const pairedSet = new Set<string>();
  const matches: Match[] = [];
  const now = new Date().toISOString();
  let matchCounter = 1;

  for (let i = 0; i < sorted.length; i++) {
    const p1 = sorted[i];
    if (pairedSet.has(p1.participant.id)) continue;

    // Find best opponent (closest score, not yet played)
    let bestOpponentIndex = -1;
    for (let j = i + 1; j < sorted.length; j++) {
      const p2 = sorted[j];
      if (pairedSet.has(p2.participant.id)) continue;

      if (!p1.opponents.has(p2.participant.id)) {
        bestOpponentIndex = j;
        break;
      }
    }

    // Fallback if everyone in this tier was already played
    if (bestOpponentIndex === -1) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (!pairedSet.has(sorted[j].participant.id)) {
          bestOpponentIndex = j;
          break;
        }
      }
    }

    if (bestOpponentIndex !== -1) {
      const p2 = sorted[bestOpponentIndex];
      pairedSet.add(p1.participant.id);
      pairedSet.add(p2.participant.id);

      const matchId = generateMatchId({
        prefix: 'BTH',
        tournamentCode: options.tournamentCode,
        year: options.year,
        stageCode: 'SW',
        roundNumber: currentRoundNumber,
        matchNumber: matchCounter++,
      });

      matches.push({
        id: matchId,
        tournament_id: options.tournamentId,
        bracket_type: 'SWISS',
        round_number: currentRoundNumber,
        round_name: `Swiss Round ${currentRoundNumber}`,
        match_number: matchCounter - 1,
        home_participant_id: p1.participant.id,
        away_participant_id: p2.participant.id,
        home_score: 0,
        away_score: 0,
        status: 'SCHEDULED',
        created_at: now,
        updated_at: now,
      });
    } else {
      // Bye for odd player
      pairedSet.add(p1.participant.id);
      const matchId = generateMatchId({
        prefix: 'BTH',
        tournamentCode: options.tournamentCode,
        year: options.year,
        stageCode: 'SW',
        roundNumber: currentRoundNumber,
        matchNumber: matchCounter++,
      });

      matches.push({
        id: matchId,
        tournament_id: options.tournamentId,
        bracket_type: 'SWISS',
        round_number: currentRoundNumber,
        round_name: `Swiss Round ${currentRoundNumber}`,
        match_number: matchCounter - 1,
        home_participant_id: p1.participant.id,
        away_participant_id: undefined,
        home_score: 1,
        away_score: 0,
        winner_id: p1.participant.id,
        status: 'COMPLETED',
        created_at: now,
        updated_at: now,
      });
    }
  }

  return matches;
}


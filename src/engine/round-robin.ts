import { Match } from '../types/match';
import { TournamentParticipant } from '../types/tournament';
import { generateMatchId } from './match-id';

export interface RoundRobinOptions {
  tournamentId: string;
  tournamentCode: string;
  year?: number;
  stageCode?: string; // e.g. 'RR' or 'GA' (Group A)
  groupId?: string;
  legs?: number; // 1 for single round robin, 2 for home & away
  seeding?: 'SEEDED' | 'RANDOM';
}

/**
 * Pure generator for Round Robin tournaments using the Berger Rotation Algorithm.
 */
export function generateRoundRobinMatches(
  participants: TournamentParticipant[],
  options: RoundRobinOptions
): {
  matches: Match[];
  totalRounds: number;
  matchesPerRound: number;
} {
  const pCount = participants.length;
  if (pCount < 2) {
    throw new Error('Round Robin requires at least 2 participants');
  }

  const legs = options.legs || 1;
  const now = new Date().toISOString();

  // Sort or shuffle participants
  let pool = [...participants];
  if (options.seeding === 'RANDOM') {
    pool.sort(() => Math.random() - 0.5);
  } else {
    pool.sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  }

  // If odd, append a dummy null (representing a BYE)
  const isOdd = pool.length % 2 !== 0;
  const dummyBye: TournamentParticipant | null = isOdd ? null : null;
  const slots: (TournamentParticipant | null)[] = [...pool];
  if (isOdd) {
    slots.push(dummyBye);
  }

  const n = slots.length; // Always even now
  const singleLegRounds = n - 1;
  const totalRounds = singleLegRounds * legs;
  const matchesPerRound = n / 2;
  const matches: Match[] = [];

  let globalMatchCounter = 1;

  for (let leg = 1; leg <= legs; leg++) {
    // Current rotation copy
    const currentSlots = [...slots];

    for (let r = 1; r <= singleLegRounds; r++) {
      const overallRoundNum = (leg - 1) * singleLegRounds + r;
      const roundName = `Round ${overallRoundNum}`;

      for (let m = 0; m < matchesPerRound; m++) {
        let home = currentSlots[m];
        let away = currentSlots[n - 1 - m];

        // In leg 2, reverse home and away
        if (leg === 2) {
          const temp = home;
          home = away;
          away = temp;
        }

        // Alternating home/away for the fixed pivot slot
        if (m === 0 && r % 2 === 0) {
          const temp = home;
          home = away;
          away = temp;
        }

        // If neither is null (not a Bye match), create the fixture
        if (home && away) {
          const matchId = generateMatchId({
            prefix: 'BTH',
            tournamentCode: options.tournamentCode,
            year: options.year,
            stageCode: options.stageCode || 'RR',
            roundNumber: overallRoundNum,
            matchNumber: globalMatchCounter++,
          });

          matches.push({
            id: matchId,
            tournament_id: options.tournamentId,
            group_id: options.groupId,
            bracket_type: options.groupId ? 'GROUP' : 'ROUND_ROBIN',
            round_number: overallRoundNum,
            round_name: roundName,
            match_number: m + 1,
            home_participant_id: home.id,
            away_participant_id: away.id,
            home_score: 0,
            away_score: 0,
            status: 'SCHEDULED',
            created_at: now,
            updated_at: now,
          });
        }
      }

      // Rotate slots: keep slots[0] fixed, rotate all others clockwise
      // slots[1] through slots[n-1]
      const fixed = currentSlots[0];
      const last = currentSlots[n - 1];
      for (let k = n - 1; k > 1; k--) {
        currentSlots[k] = currentSlots[k - 1];
      }
      currentSlots[1] = last;
      currentSlots[0] = fixed;
    }
  }

  return {
    matches,
    totalRounds,
    matchesPerRound,
  };
}

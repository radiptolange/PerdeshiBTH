import { Match } from '../types/match';
import { TournamentParticipant, TournamentGroup } from '../types/tournament';
import { generateRoundRobinMatches } from './round-robin';
import { generateKnockoutMatches } from './knockout';
import { generateMatchId } from './match-id';

export interface GroupStageOptions {
  tournamentId: string;
  tournamentCode: string;
  year?: number;
  groupCount: number;
  advancersPerGroup: number;
  legs?: number; // 1 or 2
  seeding?: 'SEEDED' | 'RANDOM';
  includeThirdPlace?: boolean;
}

export function distributeParticipantsIntoGroups(
  participants: TournamentParticipant[],
  groupCount: number,
  seeding: 'SEEDED' | 'RANDOM' = 'SEEDED'
): {
  groups: TournamentGroup[];
  assignedParticipants: TournamentParticipant[];
} {
  if (groupCount < 1) throw new Error('Must have at least 1 group');
  if (participants.length < groupCount) {
    throw new Error(`Cannot distribute ${participants.length} participants into ${groupCount} groups`);
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const groups: TournamentGroup[] = [];

  for (let g = 0; g < groupCount; g++) {
    const groupName = `Group ${alphabet[g] || g + 1}`;
    groups.push({
      id: `grp-${g + 1}`,
      tournament_id: participants[0]?.tournament_id || 'tourn-1',
      group_name: groupName,
      advancers_count: 2,
    });
  }

  let pool = [...participants];
  if (seeding === 'RANDOM') {
    pool.sort(() => Math.random() - 0.5);
  } else {
    pool.sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  }

  const assignedParticipants: TournamentParticipant[] = [];
  // Snake distribution: 0, 1, 2, 3 ... 3, 2, 1, 0 ...
  let forward = true;
  let currentGroupIdx = 0;

  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    const group = groups[currentGroupIdx];

    assignedParticipants.push({
      ...p,
      group_id: group.id,
    });

    if (forward) {
      if (currentGroupIdx === groupCount - 1) {
        forward = false;
      } else {
        currentGroupIdx++;
      }
    } else {
      if (currentGroupIdx === 0) {
        forward = true;
      } else {
        currentGroupIdx--;
      }
    }
  }

  return { groups, assignedParticipants };
}

/**
 * Generates all group-stage matches across multiple groups.
 */
export function generateGroupStageMatches(
  assignedParticipants: TournamentParticipant[],
  groups: TournamentGroup[],
  options: GroupStageOptions
): Match[] {
  const allMatches: Match[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const groupParticipants = assignedParticipants.filter((p) => p.group_id === group.id);
    const stageCode = `G${String.fromCharCode(65 + i)}`; // GA, GB, GC...

    const { matches } = generateRoundRobinMatches(groupParticipants, {
      tournamentId: options.tournamentId,
      tournamentCode: options.tournamentCode,
      year: options.year,
      stageCode,
      groupId: group.id,
      legs: options.legs || 1,
      seeding: options.seeding,
    });

    allMatches.push(...matches);
  }

  return allMatches;
}

/**
 * Builds cross-group knockout bracket from qualifiers.
 * For example:
 * With 2 groups:
 *   Semi-Final 1: 1st Group A vs 2nd Group B
 *   Semi-Final 2: 1st Group B vs 2nd Group A
 * With 4 groups:
 *   QF 1: 1st Group A vs 2nd Group B
 *   QF 2: 1st Group C vs 2nd Group D
 *   QF 3: 1st Group B vs 2nd Group A
 *   QF 4: 1st Group D vs 2nd Group C
 */
export function generateCrossGroupPlayoffs(
  groupWinnersAndRunnersUp: { groupIndex: number; rank: number; participant: TournamentParticipant }[],
  options: {
    tournamentId: string;
    tournamentCode: string;
    year?: number;
    includeThirdPlace?: boolean;
  }
): Match[] {
  // Sort into standard seeded playoff format
  const qualifiedList: TournamentParticipant[] = [];

  // Group into rank 1 and rank 2
  const groupCount = Math.max(...groupWinnersAndRunnersUp.map((g) => g.groupIndex)) + 1;

  if (groupCount === 2) {
    // 4 participants: M1 (A1 vs B2), M2 (B1 vs A2)
    // Knockout pairs (Seed 1 vs Seed 4) and (Seed 2 vs Seed 3)
    const a1 = groupWinnersAndRunnersUp.find((g) => g.groupIndex === 0 && g.rank === 1)?.participant;
    const b2 = groupWinnersAndRunnersUp.find((g) => g.groupIndex === 1 && g.rank === 2)?.participant;
    const b1 = groupWinnersAndRunnersUp.find((g) => g.groupIndex === 1 && g.rank === 1)?.participant;
    const a2 = groupWinnersAndRunnersUp.find((g) => g.groupIndex === 0 && g.rank === 2)?.participant;

    if (a1) qualifiedList.push({ ...a1, seed: 1 });
    if (b1) qualifiedList.push({ ...b1, seed: 2 });
    if (a2) qualifiedList.push({ ...a2, seed: 3 });
    if (b2) qualifiedList.push({ ...b2, seed: 4 });
  } else if (groupCount === 4) {
    // 8 participants:
    // M1: Seed 1 (A1) vs Seed 8 (B2)
    // M2: Seed 4 (C1) vs Seed 5 (D2)
    // M3: Seed 2 (B1) vs Seed 7 (A2)
    // M4: Seed 3 (D1) vs Seed 6 (C2)
    const seedMapping = [
      { g: 0, r: 1, seed: 1 }, // A1
      { g: 1, r: 1, seed: 2 }, // B1
      { g: 3, r: 1, seed: 3 }, // D1
      { g: 2, r: 1, seed: 4 }, // C1
      { g: 3, r: 2, seed: 5 }, // D2
      { g: 2, r: 2, seed: 6 }, // C2
      { g: 0, r: 2, seed: 7 }, // A2
      { g: 1, r: 2, seed: 8 }, // B2
    ];

    seedMapping.forEach((item) => {
      const p = groupWinnersAndRunnersUp.find((g) => g.groupIndex === item.g && g.rank === item.r)?.participant;
      if (p) qualifiedList.push({ ...p, seed: item.seed });
    });
  } else {
    // Generic fallback: sequential seeds
    groupWinnersAndRunnersUp.forEach((g, idx) => {
      qualifiedList.push({ ...g.participant, seed: idx + 1 });
    });
  }

  const { matches } = generateKnockoutMatches(qualifiedList, {
    tournamentId: options.tournamentId,
    tournamentCode: `${options.tournamentCode}-KO`,
    year: options.year,
    includeThirdPlace: options.includeThirdPlace,
    seeding: 'SEEDED',
  });

  return matches;
}

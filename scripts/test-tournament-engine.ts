import assert from 'node:assert';
import {
  generateMatchId,
  parseMatchId,
  nextPowerOfTwo,
  getSeedingOrder,
  generateKnockoutMatches,
  advanceWinnerInKnockout,
  generateRoundRobinMatches,
  computeStandings,
  distributeParticipantsIntoGroups,
  generateGroupStageMatches,
  generateCrossGroupPlayoffs,
  generateDoubleElimMatches,
  generateNextSwissRound,
} from '../src/engine';

console.log('🏁 Starting BTH Esports Tournament Engine Test Suite...\n');

let passedTests = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// Helper to make test participants
function makeParticipants(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `p-${i + 1}`,
    tournament_id: 'tourn-bth-test',
    participant_type: 'PLAYER',
    participant_id: `user-${i + 1}`,
    display_name: `Player ${i + 1}`,
    seed: i + 1,
    status: 'CONFIRMED',
    created_at: new Date().toISOString(),
  }));
}

// 1. MATCH ID TESTS
runTest('Match ID generation and deterministic formatting', () => {
  const id1 = generateMatchId({
    prefix: 'BTH',
    tournamentCode: 'EFT26',
    year: 2026,
    roundNumber: 1,
    matchNumber: 1,
  });
  assert.strictEqual(id1, 'BTH-EFT26-2026-R01-M001');

  const parsed = parseMatchId(id1);
  assert.strictEqual(parsed?.prefix, 'BTH');
  assert.strictEqual(parsed?.tournamentCode, 'EFT26');
  assert.strictEqual(parsed?.year, 2026);
  assert.strictEqual(parsed?.roundNumber, 1);
  assert.strictEqual(parsed?.matchNumber, 1);
});

// 2. POWER OF TWO & SEEDING TESTS
runTest('Next Power of 2 calculations', () => {
  assert.strictEqual(nextPowerOfTwo(2), 2);
  assert.strictEqual(nextPowerOfTwo(3), 4);
  assert.strictEqual(nextPowerOfTwo(5), 8);
  assert.strictEqual(nextPowerOfTwo(8), 8);
  assert.strictEqual(nextPowerOfTwo(10), 16);
  assert.strictEqual(nextPowerOfTwo(16), 16);
  assert.strictEqual(nextPowerOfTwo(32), 32);
});

runTest('Seed pair order ensures seeds 1 & 2 meet only in final', () => {
  const seeds8 = getSeedingOrder(8);
  assert.deepStrictEqual(seeds8, [1, 8, 4, 5, 2, 7, 3, 6]);
});

// 3. KNOCKOUT ENGINE TESTS ACROSS MULTIPLE SIZES
const sizesToTest = [2, 3, 5, 8, 10, 16, 32];
for (const size of sizesToTest) {
  runTest(`Knockout bracket generation for ${size} participants`, () => {
    const participants = makeParticipants(size);
    const result = generateKnockoutMatches(participants, {
      tournamentId: 't1',
      tournamentCode: 'TEST',
      year: 2026,
      includeThirdPlace: true,
      seeding: 'SEEDED',
    });

    const expectedBracketSize = nextPowerOfTwo(size);
    const expectedRounds = Math.log2(expectedBracketSize);
    assert.strictEqual(result.bracketSize, expectedBracketSize);
    assert.strictEqual(result.totalRounds, expectedRounds);

    const expectedByes = expectedBracketSize - size;
    assert.strictEqual(result.byesCount, expectedByes);

    // Verify all Round 1 Byes are automatically completed
    const r1Matches = result.matches.filter((m) => m.round_number === 1);
    const completedByes = r1Matches.filter((m) => m.status === 'COMPLETED' && (!m.home_participant_id || !m.away_participant_id));
    assert.strictEqual(completedByes.length, expectedByes);

    // If third place included and >= 4 participants, verify third place exists
    if (size >= 4) {
      const thirdPlace = result.matches.find((m) => m.bracket_type === 'THIRD_PLACE');
      assert.ok(thirdPlace, 'Third place match must exist');
    }
  });
}

// 4. KNOCKOUT ADVANCEMENT TEST
runTest('Knockout winner advancement into next round and 3rd place', () => {
  const participants = makeParticipants(4);
  const result = generateKnockoutMatches(participants, {
    tournamentId: 't1',
    tournamentCode: 'TEST',
    includeThirdPlace: true,
  });

  const semi1 = result.matches.find((m) => m.round_number === 1 && m.match_number === 1);
  assert.ok(semi1);

  // Advance winner p-1 over p-4
  const updated = advanceWinnerInKnockout(result.matches, semi1.id, 'p-1', 'p-4');
  const updatedSemi1 = updated.find((m) => m.id === semi1.id);
  assert.strictEqual(updatedSemi1.winner_id, 'p-1');
  assert.strictEqual(updatedSemi1.status, 'COMPLETED');

  // Check Grand Final has p-1 in home slot
  const grandFinal = updated.find((m) => m.bracket_type === 'GRAND_FINAL');
  assert.strictEqual(grandFinal.home_participant_id, 'p-1');

  // Check Third Place match has loser p-4
  const thirdPlace = updated.find((m) => m.bracket_type === 'THIRD_PLACE');
  assert.strictEqual(thirdPlace.home_participant_id, 'p-4');
});

// 5. ROUND ROBIN TESTS
runTest('Round Robin Berger rotation for 4 participants (single leg)', () => {
  const participants = makeParticipants(4);
  const result = generateRoundRobinMatches(participants, {
    tournamentId: 't1',
    tournamentCode: 'RR',
    legs: 1,
  });

  // 4 participants = 3 rounds, 2 matches per round = 6 matches total
  assert.strictEqual(result.totalRounds, 3);
  assert.strictEqual(result.matches.length, 6);

  // Ensure every participant plays exactly 3 matches
  for (const p of participants) {
    const pMatches = result.matches.filter((m) => m.home_participant_id === p.id || m.away_participant_id === p.id);
    assert.strictEqual(pMatches.length, 3);
  }
});

runTest('Round Robin with odd participants (5 participants with Byes)', () => {
  const participants = makeParticipants(5);
  const result = generateRoundRobinMatches(participants, {
    tournamentId: 't1',
    tournamentCode: 'RR',
    legs: 1,
  });

  // 5 participants -> expanded to 6 with dummy bye -> 5 rounds, 2 matches per round (1 bye per round) = 10 matches
  assert.strictEqual(result.totalRounds, 5);
  assert.strictEqual(result.matches.length, 10);

  // Each participant plays 4 matches
  for (const p of participants) {
    const pMatches = result.matches.filter((m) => m.home_participant_id === p.id || m.away_participant_id === p.id);
    assert.strictEqual(pMatches.length, 4);
  }
});

// 6. STANDINGS & TIEBREAKERS TEST
runTest('Standings calculation with points, goal difference, and head-to-head', () => {
  const participants = makeParticipants(3);
  const matches = [
    {
      id: 'm1',
      tournament_id: 't1',
      home_participant_id: 'p-1',
      away_participant_id: 'p-2',
      home_score: 3,
      away_score: 1,
      status: 'COMPLETED',
      updated_at: '2026-11-01T10:00:00Z',
    },
    {
      id: 'm2',
      tournament_id: 't1',
      home_participant_id: 'p-2',
      away_participant_id: 'p-3',
      home_score: 2,
      away_score: 0,
      status: 'COMPLETED',
      updated_at: '2026-11-01T11:00:00Z',
    },
    {
      id: 'm3',
      tournament_id: 't1',
      home_participant_id: 'p-3',
      away_participant_id: 'p-1',
      home_score: 1,
      away_score: 1,
      status: 'COMPLETED',
      updated_at: '2026-11-01T12:00:00Z',
    },
  ];

  const standings = computeStandings(participants, matches);

  // P1: 1 win (3-1 vs P2), 1 draw (1-1 vs P3) = 4 pts, GD +2 (GF 4, GA 2)
  // P2: 1 loss (1-3 vs P1), 1 win (2-0 vs P3) = 3 pts, GD 0 (GF 3, GA 3)
  // P3: 1 loss (0-2 vs P2), 1 draw (1-1 vs P1) = 1 pt, GD -2 (GF 1, GA 3)

  assert.strictEqual(standings[0].participant_id, 'p-1');
  assert.strictEqual(standings[0].points, 4);
  assert.strictEqual(standings[0].rank, 1);

  assert.strictEqual(standings[1].participant_id, 'p-2');
  assert.strictEqual(standings[1].points, 3);
  assert.strictEqual(standings[1].rank, 2);

  assert.strictEqual(standings[2].participant_id, 'p-3');
  assert.strictEqual(standings[2].points, 1);
  assert.strictEqual(standings[2].rank, 3);
});

// 7. GROUP STAGE + KNOCKOUT PLAYOFFS TEST
runTest('Group stage snake distribution and cross-group knockout bracket', () => {
  const participants = makeParticipants(8);
  const { groups, assignedParticipants } = distributeParticipantsIntoGroups(participants, 2, 'SEEDED');

  assert.strictEqual(groups.length, 2);
  const groupA = assignedParticipants.filter((p) => p.group_id === groups[0].id);
  const groupB = assignedParticipants.filter((p) => p.group_id === groups[1].id);

  assert.strictEqual(groupA.length, 4);
  assert.strictEqual(groupB.length, 4);

  // Group A should have seed 1, 4, 5, 8
  // Group B should have seed 2, 3, 6, 7
  assert.deepStrictEqual(groupA.map((p) => p.seed), [1, 4, 5, 8]);
  assert.deepStrictEqual(groupB.map((p) => p.seed), [2, 3, 6, 7]);

  // Generate Group stage matches
  const groupMatches = generateGroupStageMatches(assignedParticipants, groups, {
    tournamentId: 't-gs',
    tournamentCode: 'GS',
    groupCount: 2,
    advancersPerGroup: 2,
  });
  // 4 participants per group = 6 matches per group * 2 = 12 matches
  assert.strictEqual(groupMatches.length, 12);

  // Cross-group playoff test
  const qualifiers = [
    { groupIndex: 0, rank: 1, participant: groupA[0] }, // A1 (Seed 1)
    { groupIndex: 0, rank: 2, participant: groupA[1] }, // A2 (Seed 4)
    { groupIndex: 1, rank: 1, participant: groupB[0] }, // B1 (Seed 2)
    { groupIndex: 1, rank: 2, participant: groupB[1] }, // B2 (Seed 3)
  ];

  const playoffMatches = generateCrossGroupPlayoffs(qualifiers, {
    tournamentId: 't-gs',
    tournamentCode: 'GS',
    includeThirdPlace: true,
  });

  // Semi-Final 1 should be A1 vs B2
  const sf1 = playoffMatches.find((m) => m.round_number === 1 && m.match_number === 1);
  assert.strictEqual(sf1.home_participant_id, groupA[0].id);
  assert.strictEqual(sf1.away_participant_id, groupB[1].id);

  // Semi-Final 2 should be B1 vs A2
  const sf2 = playoffMatches.find((m) => m.round_number === 1 && m.match_number === 2);
  assert.strictEqual(sf2.home_participant_id, groupB[0].id);
  assert.strictEqual(sf2.away_participant_id, groupA[1].id);
});

// 8. DOUBLE ELIMINATION TEST
runTest('Double Elimination bracket with winners, losers, and grand final', () => {
  const participants = makeParticipants(8);
  const result = generateDoubleElimMatches(participants, {
    tournamentId: 't-de',
    tournamentCode: 'DE',
    enableBracketReset: true,
  });

  assert.strictEqual(result.totalRoundsUpper, 3); // 8 -> 4 -> 2 -> 1
  assert.strictEqual(result.totalRoundsLower, 4); // (3 - 1) * 2 = 4

  // Upper has 4 + 2 + 1 = 7 matches
  assert.strictEqual(result.upperMatches.length, 7);

  // Grand final has at least match 1 and reset match 2
  assert.strictEqual(result.grandFinalMatches.length, 2);
});

// 9. SWISS SYSTEM TEST
runTest('Swiss pairing avoids repeat matchups and groups by points', () => {
  const participants = makeParticipants(4);
  // Round 1
  const r1 = generateNextSwissRound(participants, [], 1, {
    tournamentId: 't-sw',
    tournamentCode: 'SW',
  });
  assert.strictEqual(r1.length, 2);

  // Complete round 1: p-1 beats p-2, p-3 beats p-4
  const completedR1 = [
    { ...r1[0], home_score: 2, away_score: 0, winner_id: r1[0].home_participant_id, status: 'COMPLETED' },
    { ...r1[1], home_score: 1, away_score: 0, winner_id: r1[1].home_participant_id, status: 'COMPLETED' },
  ];

  // Round 2 should pair the two 1-0 winners together!
  const r2 = generateNextSwissRound(participants, completedR1, 2, {
    tournamentId: 't-sw',
    tournamentCode: 'SW',
  });
  assert.strictEqual(r2.length, 2);

  const winnerMatch = r2.find(
    (m) =>
      (m.home_participant_id === r1[0].home_participant_id && m.away_participant_id === r1[1].home_participant_id) ||
      (m.home_participant_id === r1[1].home_participant_id && m.away_participant_id === r1[0].home_participant_id)
  );
  assert.ok(winnerMatch, 'Round 1 winners must play each other in Round 2');
});

console.log(`\n🎉 All ${passedTests} Tournament Engine tests passed with 100% success!\n`);

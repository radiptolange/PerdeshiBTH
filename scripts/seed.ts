import { getDb, execute, transaction } from '../src/lib/db';
import { generateKnockoutMatches, advanceWinnerInKnockout } from '../src/engine/knockout';
import { generateRoundRobinMatches } from '../src/engine/round-robin';
import { distributeParticipantsIntoGroups, generateGroupStageMatches } from '../src/engine/group-stage';
import { generateDoubleElimMatches } from '../src/engine/double-elim';
import { computeStandings } from '../src/engine/standings';

console.log('🌱 Seeding BTH Esports Database with authentic tournament ecosystem...');

const now = new Date().toISOString();

transaction(() => {
  const db = getDb();

  // Clear existing records to ensure fresh idempotent seed
  db.exec('DELETE FROM notifications;');
  db.exec('DELETE FROM audit_logs;');
  db.exec('DELETE FROM match_disputes;');
  db.exec('DELETE FROM match_evidence;');
  db.exec('DELETE FROM match_substitutions;');
  db.exec('DELETE FROM matches;');
  db.exec('DELETE FROM tournament_standings;');
  db.exec('DELETE FROM tournament_participants;');
  db.exec('DELETE FROM tournament_groups;');
  db.exec('DELETE FROM tournaments;');
  db.exec('DELETE FROM clan_rosters;');
  db.exec('DELETE FROM clans;');
  db.exec('DELETE FROM users;');
  db.exec('DELETE FROM organizations;');

  // 1. Organization
  execute(
    `INSERT INTO organizations (id, name, slug, logo_url, banner_url, primary_color, social_links, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'org-bth',
      'BTH Esports Nepal',
      'bth-esports',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
      '#7C3AED',
      JSON.stringify({ facebook: 'https://facebook.com/bthesports', discord: 'https://discord.gg/bth' }),
      now,
    ]
  );

  // 2. Users
  const users = [
    { id: 'u-admin', username: 'admin', email: 'admin@bth.gg', display_name: 'BTH SuperAdmin', role: 'SUPER_ADMIN', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150' },
    { id: 'u-org', username: 'organizer', email: 'organizer@bth.gg', display_name: 'Perdeshi Admin', role: 'TOURNAMENT_ADMIN', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
    { id: 'u-ref', username: 'referee_karma', email: 'referee@bth.gg', display_name: 'Referee Karma', role: 'MATCH_REFEREE', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' },
    { id: 'u-ayush', username: 'ayush_efootball', email: 'ayush@bth.gg', display_name: 'Ayush Shrestha', role: 'TEAM_CAPTAIN', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 'u-samir', username: 'samir_striker', email: 'samir@bth.gg', display_name: 'Samir Thapa', role: 'REGISTERED_PLAYER', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { id: 'u-rohan', username: 'rohan_ghost', email: 'rohan@bth.gg', display_name: 'Rohan Gurung', role: 'TEAM_CAPTAIN', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150' },
    { id: 'u-pradeep', username: 'pradeep_ace', email: 'pradeep@bth.gg', display_name: 'Pradeep KC', role: 'REGISTERED_PLAYER', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150' },
    { id: 'u-bikash', username: 'bikash_blade', email: 'bikash@bth.gg', display_name: 'Bikash Tamang', role: 'TEAM_CAPTAIN', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150' },
    { id: 'u-manoj', username: 'manoj_sniper', email: 'manoj@bth.gg', display_name: 'Manoj Magar', role: 'REGISTERED_PLAYER', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150' },
    { id: 'u-sudeep', username: 'sudeep_ninja', email: 'sudeep@bth.gg', display_name: 'Sudeep Rai', role: 'REGISTERED_PLAYER', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
    { id: 'u-anup', username: 'anup_phantom', email: 'anup@bth.gg', display_name: 'Anup Bista', role: 'REGISTERED_PLAYER', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
  ];

  for (const u of users) {
    execute(
      `INSERT INTO users (id, username, email, password_hash, display_name, avatar_url, role, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.username, u.email, 'hashed_password_bth2026', u.display_name, u.avatar, u.role, 'ACTIVE', now]
    );
  }

  // 3. Clans
  const clans = [
    { id: 'c-bth', name: 'BTH Titans', tag: 'BTH', leader: 'u-ayush', desc: 'Premier BTH competitive esports division.' },
    { id: 'c-kk', name: 'Kathmandu Knights', tag: 'KK', leader: 'u-samir', desc: 'Valley champions.' },
    { id: 'c-pp', name: 'Pokhara Panthers', tag: 'PP', leader: 'u-rohan', desc: 'Lakeside predator gaming.' },
    { id: 'c-eg', name: 'Everest Gladiators', tag: 'EG', leader: 'u-pradeep', desc: 'High altitude champions.' },
    { id: 'c-ll', name: 'Lalitpur Legends', tag: 'LL', leader: 'u-bikash', desc: 'Precision and glory.' },
    { id: 'c-hw', name: 'Himalayan Wolves', tag: 'HW', leader: 'u-manoj', desc: 'Pack tactics esports.' },
    { id: 'c-gw', name: 'Gorkha Warriors', tag: 'GW', leader: 'u-sudeep', desc: 'Fearless warriors.' },
    { id: 'c-bb', name: 'Biratnagar Blasters', tag: 'BB', leader: 'u-anup', desc: 'Eastern powerhouse.' },
  ];

  for (const c of clans) {
    execute(
      `INSERT INTO clans (id, name, tag, leader_id, description, country, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.tag, c.leader, c.desc, 'Nepal', now]
    );
    // Link leader user
    execute(`UPDATE users SET clan_id = ? WHERE id = ?`, [c.id, c.leader]);
    // Clan roster
    execute(
      `INSERT INTO clan_rosters (id, clan_id, user_id, role_in_clan, is_main_roster, joined_at)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [`r-${c.id}-${c.leader}`, c.id, c.leader, 'LEADER', now]
    );
  }

  // 4. Tournament 1: "Nepal Champions Cup 2026 - eFootball" (Single Elimination / Knockout)
  const t1Id = 't-ncc-2026';
  execute(
    `INSERT INTO tournaments (
      id, org_id, title, slug, description, game, category, format, competition_type,
      team_size, status, timezone, min_participants, max_participants, current_participants,
      registration_start, registration_end, start_date, end_date, prize_pool,
      banner_url, is_public, substitutions_allowed, max_substitutions_per_match,
      requires_referee_approval, created_by, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, 1, 1, 2,
      1, ?, ?, ?
    )`,
    [
      t1Id,
      'org-bth',
      'Nepal Champions Cup 2026 - eFootball',
      'nepal-champions-cup-2026',
      'The biggest national eFootball 2026 championship organized by BTH Esports Nepal.',
      'eFootball',
      'National Major',
      'SINGLE_ELIMINATION',
      'PLAYER_1V1',
      1,
      'ONGOING',
      'Asia/Kathmandu',
      8,
      8,
      8,
      '2026-10-01T00:00:00Z',
      '2026-10-25T23:59:59Z',
      '2026-11-01T12:00:00Z',
      '2026-11-10T20:00:00Z',
      'NPR 150,000 + Championship Trophy',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
      'u-admin',
      now,
      now,
    ]
  );

  // Participants for Tournament 1
  const t1Participants = clans.map((c, idx) => ({
    id: `tp-${t1Id}-${idx + 1}`,
    tournament_id: t1Id,
    participant_type: 'CLAN' as const,
    participant_id: c.id,
    display_name: c.name,
    tag: c.tag,
    seed: idx + 1,
    status: 'CONFIRMED' as const,
    created_at: now,
  }));

  for (const tp of t1Participants) {
    execute(
      `INSERT INTO tournament_participants (id, tournament_id, participant_type, participant_id, display_name, tag, seed, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tp.id, tp.tournament_id, tp.participant_type, tp.participant_id, tp.display_name, tp.tag, tp.seed, tp.status, tp.created_at]
    );
  }

  // Generate Knockout Matches using Tournament Engine
  const { matches: t1Matches } = generateKnockoutMatches(t1Participants, {
    tournamentId: t1Id,
    tournamentCode: 'NCC',
    year: 2026,
    includeThirdPlace: true,
    seeding: 'SEEDED',
  });

  // Insert matches into DB
  for (const m of t1Matches) {
    execute(
      `INSERT INTO matches (
        id, tournament_id, bracket_type, round_number, round_name, match_number,
        home_participant_id, away_participant_id, home_score, away_score,
        winner_id, loser_id, status, next_match_id, next_match_slot,
        loser_next_match_id, loser_next_match_slot, scheduled_time, deadline,
        room_id, room_password, referee_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        m.id,
        m.tournament_id,
        m.bracket_type,
        m.round_number,
        m.round_name,
        m.match_number,
        m.home_participant_id || null,
        m.away_participant_id || null,
        m.home_score,
        m.away_score,
        m.winner_id || null,
        m.loser_id || null,
        m.status,
        m.next_match_id || null,
        m.next_match_slot || null,
        m.loser_next_match_id || null,
        m.loser_next_match_slot || null,
        '2026-11-03T18:00:00+05:45',
        '2026-11-03T21:00:00+05:45',
        'ROOM-BTH-8821',
        'efootball2026',
        'u-ref',
        m.created_at,
        m.updated_at,
      ]
    );
  }

  // Simulate Round 1 completed matches with realistic esports scores!
  // QF 1: Seed 1 (BTH Titans) vs Seed 8 (Biratnagar Blasters) -> BTH wins 3-1
  const qf1 = t1Matches.find((m) => m.round_number === 1 && m.match_number === 1)!;
  execute(
    `UPDATE matches SET home_score = 3, away_score = 1, winner_id = ?, loser_id = ?, status = 'COMPLETED' WHERE id = ?`,
    [t1Participants[0].id, t1Participants[7].id, qf1.id]
  );
  // Advance winner to Semi-Final 1 Home
  execute(`UPDATE matches SET home_participant_id = ? WHERE id = ?`, [t1Participants[0].id, qf1.next_match_id]);

  // QF 2: Seed 4 (Everest Gladiators) vs Seed 5 (Lalitpur Legends) -> Lalitpur wins 1-2
  const qf2 = t1Matches.find((m) => m.round_number === 1 && m.match_number === 2)!;
  execute(
    `UPDATE matches SET home_score = 1, away_score = 2, winner_id = ?, loser_id = ?, status = 'COMPLETED' WHERE id = ?`,
    [t1Participants[4].id, t1Participants[3].id, qf2.id]
  );
  execute(`UPDATE matches SET away_participant_id = ? WHERE id = ?`, [t1Participants[4].id, qf2.next_match_id]);

  // QF 3: Seed 2 (Kathmandu Knights) vs Seed 7 (Gorkha Warriors) -> Kathmandu wins 4-0
  const qf3 = t1Matches.find((m) => m.round_number === 1 && m.match_number === 3)!;
  execute(
    `UPDATE matches SET home_score = 4, away_score = 0, winner_id = ?, loser_id = ?, status = 'COMPLETED' WHERE id = ?`,
    [t1Participants[1].id, t1Participants[6].id, qf3.id]
  );
  execute(`UPDATE matches SET home_participant_id = ? WHERE id = ?`, [t1Participants[1].id, qf3.next_match_id]);

  // QF 4: Seed 3 (Pokhara Panthers) vs Seed 6 (Himalayan Wolves) -> Pokhara wins 2-1
  const qf4 = t1Matches.find((m) => m.round_number === 1 && m.match_number === 4)!;
  execute(
    `UPDATE matches SET home_score = 2, away_score = 1, winner_id = ?, loser_id = ?, status = 'COMPLETED' WHERE id = ?`,
    [t1Participants[2].id, t1Participants[5].id, qf4.id]
  );
  execute(`UPDATE matches SET away_participant_id = ? WHERE id = ?`, [t1Participants[2].id, qf4.next_match_id]);

  // Set Semi-Final 1 to LIVE!
  const sf1 = t1Matches.find((m) => m.round_number === 2 && m.match_number === 1)!;
  execute(`UPDATE matches SET status = 'LIVE', home_score = 1, away_score = 1 WHERE id = ?`, [sf1.id]);

  // Add evidence screenshot for QF 1
  execute(
    `INSERT INTO match_evidence (id, match_id, submitted_by, file_url, evidence_type, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'ev-qf1',
      qf1.id,
      'u-ayush',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      'SCREENSHOT',
      'Official full-time screenshot: BTH Titans 3 - 1 Biratnagar Blasters',
      now,
    ]
  );

  // 5. Tournament 2: "BTH Pro Division League Season 4" (Round Robin)
  const t2Id = 't-bth-pdl-s4';
  execute(
    `INSERT INTO tournaments (
      id, org_id, title, slug, description, game, category, format, competition_type,
      team_size, status, timezone, min_participants, max_participants, current_participants,
      start_date, end_date, prize_pool, banner_url, is_public, created_by, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, 1, ?, ?, ?
    )`,
    [
      t2Id,
      'org-bth',
      'BTH Pro Division League Season 4',
      'bth-pro-division-league-s4',
      'South Asia tier-1 league featuring the top 6 clans playing home & away round robin fixtures.',
      'eFootball',
      'Premier League',
      'ROUND_ROBIN',
      'CLAN_1V1',
      1,
      'ONGOING',
      'Asia/Kathmandu',
      6,
      6,
      6,
      '2026-11-01T00:00:00Z',
      '2026-11-30T23:59:59Z',
      'NPR 250,000 Season Pool',
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop&q=80',
      'u-admin',
      now,
      now,
    ]
  );

  const t2Participants = clans.slice(0, 6).map((c, idx) => ({
    id: `tp-${t2Id}-${idx + 1}`,
    tournament_id: t2Id,
    participant_type: 'CLAN' as const,
    participant_id: c.id,
    display_name: c.name,
    tag: c.tag,
    seed: idx + 1,
    status: 'CONFIRMED' as const,
    created_at: now,
  }));

  for (const tp of t2Participants) {
    execute(
      `INSERT INTO tournament_participants (id, tournament_id, participant_type, participant_id, display_name, tag, seed, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tp.id, tp.tournament_id, tp.participant_type, tp.participant_id, tp.display_name, tp.tag, tp.seed, tp.status, tp.created_at]
    );
  }

  const { matches: t2Matches } = generateRoundRobinMatches(t2Participants, {
    tournamentId: t2Id,
    tournamentCode: 'PDL4',
    year: 2026,
    legs: 1,
  });

  for (const m of t2Matches) {
    execute(
      `INSERT INTO matches (
        id, tournament_id, bracket_type, round_number, round_name, match_number,
        home_participant_id, away_participant_id, home_score, away_score,
        winner_id, status, scheduled_time, deadline, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        m.id,
        m.tournament_id,
        m.bracket_type,
        m.round_number,
        m.round_name,
        m.match_number,
        m.home_participant_id,
        m.away_participant_id,
        0,
        0,
        null,
        'SCHEDULED',
        '2026-11-04T19:00:00+05:45',
        '2026-11-04T22:00:00+05:45',
        m.created_at,
        m.updated_at,
      ]
    );
  }

  // Simulate completed matches for Round 1
  const r1MatchesT2 = t2Matches.filter((m) => m.round_number === 1);
  const scoresT2 = [
    { hScore: 2, aScore: 0 },
    { hScore: 1, aScore: 1 },
    { hScore: 3, aScore: 2 },
  ];

  r1MatchesT2.forEach((m, idx) => {
    const sc = scoresT2[idx] || { hScore: 1, aScore: 0 };
    const winner = sc.hScore > sc.aScore ? m.home_participant_id : sc.hScore < sc.aScore ? m.away_participant_id : null;
    execute(
      `UPDATE matches SET home_score = ?, away_score = ?, winner_id = ?, status = 'COMPLETED' WHERE id = ?`,
      [sc.hScore, sc.aScore, winner, m.id]
    );
    m.home_score = sc.hScore;
    m.away_score = sc.aScore;
    m.winner_id = winner || undefined;
    m.status = 'COMPLETED';
  });

  // Calculate and store standings
  const t2Standings = computeStandings(t2Participants, t2Matches);
  for (const row of t2Standings) {
    execute(
      `INSERT INTO tournament_standings (
        id, tournament_id, participant_id, played, won, drawn, lost,
        goals_for, goals_against, goal_difference, points, rank, form
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `std-${t2Id}-${row.participant_id}`,
        t2Id,
        row.participant_id,
        row.played,
        row.won,
        row.drawn,
        row.lost,
        row.goals_for,
        row.goals_against,
        row.goal_difference,
        row.points,
        row.rank,
        JSON.stringify(row.form),
      ]
    );
  }

  // 6. Tournament 3: "South Asian Invitational 2026" (Group Stage + Knockout)
  const t3Id = 't-sai-2026';
  execute(
    `INSERT INTO tournaments (
      id, org_id, title, slug, description, game, category, format, competition_type,
      team_size, status, timezone, min_participants, max_participants, current_participants,
      registration_start, registration_end, start_date, prize_pool, banner_url, is_public,
      created_by, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, 1,
      ?, ?, ?
    )`,
    [
      t3Id,
      'org-bth',
      'South Asian Invitational 2026',
      'south-asian-invitational-2026',
      'Regional powerhouse tournament featuring group stages and elite cross-bracket playoffs.',
      'PUBG Mobile',
      'International Invitational',
      'GROUP_STAGE_KNOCKOUT',
      'TEAM_VS_TEAM',
      4,
      'REGISTRATION_OPEN',
      'Asia/Kathmandu',
      8,
      16,
      8,
      '2026-11-01T00:00:00Z',
      '2026-11-15T23:59:59Z',
      '2026-11-20T17:00:00Z',
      'USD $3,000 Prize Pool',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
      'u-admin',
      now,
      now,
    ]
  );

  // Group distribution for Tournament 3
  const t3Participants = clans.map((c, idx) => ({
    id: `tp-${t3Id}-${idx + 1}`,
    tournament_id: t3Id,
    participant_type: 'CLAN' as const,
    participant_id: c.id,
    display_name: c.name,
    tag: c.tag,
    seed: idx + 1,
    status: 'CONFIRMED' as const,
    created_at: now,
  }));

  const { groups: t3Groups, assignedParticipants: t3Assigned } = distributeParticipantsIntoGroups(t3Participants, 2, 'SEEDED');

  for (const g of t3Groups) {
    execute(
      `INSERT INTO tournament_groups (id, tournament_id, group_name, advancers_count)
       VALUES (?, ?, ?, ?)`,
      [g.id, t3Id, g.group_name, g.advancers_count]
    );
  }

  for (const p of t3Assigned) {
    execute(
      `INSERT INTO tournament_participants (id, tournament_id, participant_type, participant_id, display_name, tag, seed, group_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, t3Id, p.participant_type, p.participant_id, p.display_name, p.tag, p.seed, p.group_id, p.status, p.created_at]
    );
  }

  const t3Matches = generateGroupStageMatches(t3Assigned, t3Groups, {
    tournamentId: t3Id,
    tournamentCode: 'SAI26',
    year: 2026,
    groupCount: 2,
    advancersPerGroup: 2,
  });

  for (const m of t3Matches) {
    execute(
      `INSERT INTO matches (
        id, tournament_id, group_id, bracket_type, round_number, round_name, match_number,
        home_participant_id, away_participant_id, home_score, away_score, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        m.id,
        m.tournament_id,
        m.group_id,
        m.bracket_type,
        m.round_number,
        m.round_name,
        m.match_number,
        m.home_participant_id,
        m.away_participant_id,
        0,
        0,
        'SCHEDULED',
        m.created_at,
        m.updated_at,
      ]
    );
  }

  // 7. Tournament 4: "BTH Double Strike Masters" (Double Elimination)
  const t4Id = 't-dsm-2026';
  execute(
    `INSERT INTO tournaments (
      id, org_id, title, slug, description, game, category, format, competition_type,
      team_size, status, timezone, min_participants, max_participants, current_participants,
      prize_pool, banner_url, is_public, created_by, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, 1, ?, ?, ?
    )`,
    [
      t4Id,
      'org-bth',
      'BTH Double Strike Masters',
      'bth-double-strike-masters',
      'High-stakes Valorant 5v5 double elimination championship with winners and losers brackets.',
      'Valorant',
      'Masters Championship',
      'DOUBLE_ELIMINATION',
      'TEAM_VS_TEAM',
      5,
      'PUBLISHED',
      'Asia/Kathmandu',
      4,
      8,
      4,
      'NPR 100,000 + Custom Medals',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
      'u-admin',
      now,
      now,
    ]
  );

  const t4Participants = clans.slice(0, 4).map((c, idx) => ({
    id: `tp-${t4Id}-${idx + 1}`,
    tournament_id: t4Id,
    participant_type: 'CLAN' as const,
    participant_id: c.id,
    display_name: c.name,
    tag: c.tag,
    seed: idx + 1,
    status: 'CONFIRMED' as const,
    created_at: now,
  }));

  for (const tp of t4Participants) {
    execute(
      `INSERT INTO tournament_participants (id, tournament_id, participant_type, participant_id, display_name, tag, seed, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tp.id, tp.tournament_id, tp.participant_type, tp.participant_id, tp.display_name, tp.tag, tp.seed, tp.status, tp.created_at]
    );
  }

  const { matches: t4Matches } = generateDoubleElimMatches(t4Participants, {
    tournamentId: t4Id,
    tournamentCode: 'DSM26',
    year: 2026,
    enableBracketReset: true,
  });

  for (const m of t4Matches) {
    execute(
      `INSERT INTO matches (
        id, tournament_id, bracket_type, round_number, round_name, match_number,
        home_participant_id, away_participant_id, home_score, away_score, status,
        next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        m.id,
        m.tournament_id,
        m.bracket_type,
        m.round_number,
        m.round_name,
        m.match_number,
        m.home_participant_id || null,
        m.away_participant_id || null,
        0,
        0,
        m.status,
        m.next_match_id || null,
        m.next_match_slot || null,
        m.loser_next_match_id || null,
        m.loser_next_match_slot || null,
        m.created_at,
        m.updated_at,
      ]
    );
  }

  // 8. Notifications & Audit Logs
  execute(
    `INSERT INTO notifications (id, user_id, title, message, type, link_url, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      'notif-1',
      'u-admin',
      'Semi-Final Live: BTH Titans vs Lalitpur Legends',
      'The Nepal Champions Cup 2026 Semi-Final 1 is now underway.',
      'ALERT',
      '/tournaments/nepal-champions-cup-2026',
      now,
    ]
  );

  execute(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'audit-seed',
      'u-admin',
      'INITIALIZE_TOURNAMENTS',
      'system',
      'bth-2.0',
      JSON.stringify({ seededTournaments: 4, clans: 8, matchesCount: t1Matches.length + t2Matches.length + t3Matches.length + t4Matches.length }),
      now,
    ]
  );
});

console.log('✅ BTH Esports Database successfully seeded with 4 full tournaments, 8 clans, rosters, live matches & standings!');


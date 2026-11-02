import { NextResponse } from 'next/server';
import { query, queryOne, execute, transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  generateKnockoutMatches,
  generateDoubleElimMatches,
  generateRoundRobinMatches,
  distributeParticipantsIntoGroups,
  generateGroupStageMatches,
  generateNextSwissRound,
} from '@/engine';
import { TournamentParticipant } from '@/types/tournament';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tournament = queryOne<any>(`SELECT * FROM tournaments WHERE id = ? OR slug = ?`, [id, id]);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { force = false, seeding = 'SEEDED' } = body;

    // Check if matches with completed results already exist
    const completedMatches = queryOne<any>(
      `SELECT count(*) as count FROM matches WHERE tournament_id = ? AND status = 'COMPLETED'`,
      [tournament.id]
    );

    if (completedMatches && completedMatches.count > 0 && !force) {
      return NextResponse.json(
        { error: 'Tournament has existing completed matches. Set force=true to reset existing bracket with authorization.' },
        { status: 400 }
      );
    }

    // Fetch participants
    const participants = query<TournamentParticipant>(
      `SELECT id, tournament_id, participant_type, participant_id, display_name, tag, avatar_url, seed, status, created_at
       FROM tournament_participants
       WHERE tournament_id = ? AND status = 'CONFIRMED'
       ORDER BY seed ASC, created_at ASC`,
      [tournament.id]
    );

    if (participants.length < 2) {
      return NextResponse.json(
        { error: `At least 2 confirmed participants are required to generate bracket. Currently have ${participants.length}.` },
        { status: 400 }
      );
    }

    let generatedMatches: any[] = [];
    const tournamentCode = tournament.slug.slice(0, 6).toUpperCase();

    // Generate by format
    switch (tournament.format) {
      case 'SINGLE_ELIMINATION': {
        const res = generateKnockoutMatches(participants, {
          tournamentId: tournament.id,
          tournamentCode,
          year: new Date().getFullYear(),
          includeThirdPlace: true,
          seeding,
        });
        generatedMatches = res.matches;
        break;
      }
      case 'DOUBLE_ELIMINATION': {
        const res = generateDoubleElimMatches(participants, {
          tournamentId: tournament.id,
          tournamentCode,
          year: new Date().getFullYear(),
          enableBracketReset: true,
          seeding,
        });
        generatedMatches = res.matches;
        break;
      }
      case 'ROUND_ROBIN': {
        const res = generateRoundRobinMatches(participants, {
          tournamentId: tournament.id,
          tournamentCode,
          year: new Date().getFullYear(),
          legs: 1,
          seeding,
        });
        generatedMatches = res.matches;
        break;
      }
      case 'GROUP_STAGE_KNOCKOUT': {
        const groupCount = participants.length >= 8 ? 2 : 1;
        const { groups, assignedParticipants } = distributeParticipantsIntoGroups(participants, groupCount, seeding);

        // Update group IDs in DB
        transaction(() => {
          execute(`DELETE FROM tournament_groups WHERE tournament_id = ?`, [tournament.id]);
          for (const g of groups) {
            execute(
              `INSERT INTO tournament_groups (id, tournament_id, group_name, advancers_count) VALUES (?, ?, ?, ?)`,
              [g.id, tournament.id, g.group_name, g.advancers_count]
            );
          }
          for (const ap of assignedParticipants) {
            execute(`UPDATE tournament_participants SET group_id = ? WHERE id = ?`, [ap.group_id, ap.id]);
          }
        });

        generatedMatches = generateGroupStageMatches(assignedParticipants, groups, {
          tournamentId: tournament.id,
          tournamentCode,
          year: new Date().getFullYear(),
          groupCount,
          advancersPerGroup: 2,
        });
        break;
      }
      case 'SWISS': {
        generatedMatches = generateNextSwissRound(participants, [], 1, {
          tournamentId: tournament.id,
          tournamentCode,
          year: new Date().getFullYear(),
        });
        break;
      }
      default:
        return NextResponse.json({ error: `Unsupported format: ${tournament.format}` }, { status: 400 });
    }

    // Save into DB in atomic transaction
    transaction(() => {
      // Clear old matches
      execute(`DELETE FROM matches WHERE tournament_id = ?`, [tournament.id]);

      for (const m of generatedMatches) {
        execute(
          `INSERT INTO matches (
            id, tournament_id, group_id, bracket_type, round_number, round_name, match_number,
            home_participant_id, away_participant_id, home_score, away_score,
            winner_id, loser_id, status, next_match_id, next_match_slot,
            loser_next_match_id, loser_next_match_slot, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            m.id,
            m.tournament_id,
            m.group_id || null,
            m.bracket_type,
            m.round_number,
            m.round_name,
            m.match_number,
            m.home_participant_id || null,
            m.away_participant_id || null,
            m.home_score || 0,
            m.away_score || 0,
            m.winner_id || null,
            m.loser_id || null,
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

      // Update tournament status to ONGOING if was in DRAFT or REGISTRATION
      if (tournament.status === 'DRAFT' || tournament.status === 'REGISTRATION_CLOSED') {
        execute(`UPDATE tournaments SET status = 'ONGOING', updated_at = ? WHERE id = ?`, [
          new Date().toISOString(),
          tournament.id,
        ]);
      }

      execute(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, 'GENERATE_BRACKET', 'tournament', ?, ?, ?)`,
        [
          `audit-${Date.now()}`,
          user.id,
          tournament.id,
          JSON.stringify({ matchesCount: generatedMatches.length, format: tournament.format, seeding }),
          new Date().toISOString(),
        ]
      );
    });

    return NextResponse.json({
      message: 'Bracket successfully generated',
      matchesCount: generatedMatches.length,
      format: tournament.format,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


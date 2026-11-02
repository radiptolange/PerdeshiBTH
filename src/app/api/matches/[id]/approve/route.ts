import { NextResponse } from 'next/server';
import { query, queryOne, execute, transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { computeStandings } from '@/engine';
import { TournamentParticipant } from '@/types/tournament';
import { Match } from '@/types/match';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const match = queryOne<any>(`SELECT * FROM matches WHERE id = ?`, [id]);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const tournament = queryOne<any>(`SELECT * FROM tournaments WHERE id = ?`, [match.tournament_id]);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    let { winner_id, loser_id } = body;

    // Auto-determine winner if not explicitly passed
    if (!winner_id) {
      if (match.home_score > match.away_score) {
        winner_id = match.home_participant_id;
        loser_id = match.away_participant_id;
      } else if (match.away_score > match.home_score) {
        winner_id = match.away_participant_id;
        loser_id = match.home_participant_id;
      }
    }

    const now = new Date().toISOString();

    transaction(() => {
      // 1. Mark match completed
      execute(
        `UPDATE matches
         SET status = 'COMPLETED', winner_id = ?, loser_id = ?, updated_at = ?
         WHERE id = ?`,
        [winner_id || null, loser_id || null, now, id]
      );

      // 2. Advance winner to next match if present
      if (match.next_match_id && winner_id) {
        if (match.next_match_slot === 'HOME') {
          execute(
            `UPDATE matches SET home_participant_id = ?, updated_at = ? WHERE id = ?`,
            [winner_id, now, match.next_match_id]
          );
        } else if (match.next_match_slot === 'AWAY') {
          execute(
            `UPDATE matches SET away_participant_id = ?, updated_at = ? WHERE id = ?`,
            [winner_id, now, match.next_match_id]
          );
        }
      }

      // 3. Advance loser to loser_next_match_id (e.g. 3rd place match or Double Elim lower bracket)
      if (match.loser_next_match_id && loser_id) {
        if (match.loser_next_match_slot === 'HOME') {
          execute(
            `UPDATE matches SET home_participant_id = ?, updated_at = ? WHERE id = ?`,
            [loser_id, now, match.loser_next_match_id]
          );
        } else if (match.loser_next_match_slot === 'AWAY') {
          execute(
            `UPDATE matches SET away_participant_id = ?, updated_at = ? WHERE id = ?`,
            [loser_id, now, match.loser_next_match_id]
          );
        }
      }

      // 4. Recompute standings if Round Robin or Group Stage
      if (tournament.format === 'ROUND_ROBIN' || tournament.format === 'GROUP_STAGE_KNOCKOUT') {
        const allParticipants = query<TournamentParticipant>(
          `SELECT id, tournament_id, participant_type, participant_id, display_name, tag, avatar_url, group_id, status, created_at
           FROM tournament_participants
           WHERE tournament_id = ?`,
          [tournament.id]
        );

        const allMatches = query<Match>(
          `SELECT * FROM matches WHERE tournament_id = ?`,
          [tournament.id]
        );

        const newStandings = computeStandings(allParticipants, allMatches);

        for (const row of newStandings) {
          execute(
            `INSERT INTO tournament_standings (
              id, tournament_id, group_id, participant_id, played, won, drawn, lost,
              goals_for, goals_against, goal_difference, points, rank, form
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(tournament_id, participant_id) DO UPDATE SET
              played = excluded.played,
              won = excluded.won,
              drawn = excluded.drawn,
              lost = excluded.lost,
              goals_for = excluded.goals_for,
              goals_against = excluded.goals_against,
              goal_difference = excluded.goal_difference,
              points = excluded.points,
              rank = excluded.rank,
              form = excluded.form`,
            [
              `std-${tournament.id}-${row.participant_id}`,
              tournament.id,
              row.group_id || null,
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
      }

      // 5. Audit Log
      execute(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, 'APPROVE_MATCH_RESULT', 'match', ?, ?, ?)`,
        [
          `audit-${Date.now()}`,
          user.id,
          id,
          JSON.stringify({ winner_id, loser_id, home_score: match.home_score, away_score: match.away_score }),
          now,
        ]
      );
    });

    const updatedMatch = queryOne(`SELECT * FROM matches WHERE id = ?`, [id]);
    return NextResponse.json({
      message: 'Match approved and tournament progression updated',
      match: updatedMatch,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


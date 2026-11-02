import { NextResponse } from 'next/server';
import { query, queryOne, execute, transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const match = queryOne<any>(
      `SELECT m.*,
              hp.display_name as home_name, hp.tag as home_tag, hp.avatar_url as home_avatar, hp.seed as home_seed,
              ap.display_name as away_name, ap.tag as away_tag, ap.avatar_url as away_avatar, ap.seed as away_seed,
              u_ref.display_name as referee_name,
              t.title as tournament_title, t.format as tournament_format, t.game as tournament_game,
              t.substitutions_allowed, t.max_substitutions_per_match, t.requires_referee_approval
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       LEFT JOIN tournament_participants hp ON hp.id = m.home_participant_id
       LEFT JOIN tournament_participants ap ON ap.id = m.away_participant_id
       LEFT JOIN users u_ref ON u_ref.id = m.referee_id
       WHERE m.id = ?`,
      [id]
    );

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const evidence = query<any>(
      `SELECT e.*, u.display_name as submitter_name
       FROM match_evidence e
       LEFT JOIN users u ON u.id = e.submitted_by
       WHERE e.match_id = ?
       ORDER BY e.created_at DESC`,
      [id]
    );

    const substitutions = query<any>(
      `SELECT s.*,
              req.display_name as requester_name,
              p_out.display_name as player_out_name,
              p_in.display_name as player_in_name,
              app.display_name as approved_by_name
       FROM match_substitutions s
       LEFT JOIN users req ON req.id = s.requester_id
       LEFT JOIN users p_out ON p_out.id = s.player_out_id
       LEFT JOIN users p_in ON p_in.id = s.player_in_id
       LEFT JOIN users app ON app.id = s.approved_by
       WHERE s.match_id = ?
       ORDER BY s.created_at DESC`,
      [id]
    );

    const disputes = query<any>(
      `SELECT d.*, u.display_name as opener_name, res.display_name as resolver_name
       FROM match_disputes d
       LEFT JOIN users u ON u.id = d.opened_by
       LEFT JOIN users res ON res.id = d.resolved_by
       WHERE d.match_id = ?
       ORDER BY d.created_at DESC`,
      [id]
    );

    return NextResponse.json({
      match: {
        ...match,
        substitutions_allowed: Boolean(match.substitutions_allowed),
        requires_referee_approval: Boolean(match.requires_referee_approval),
        home_participant: match.home_participant_id
          ? {
              id: match.home_participant_id,
              display_name: match.home_name,
              tag: match.home_tag,
              avatar_url: match.home_avatar,
              seed: match.home_seed,
            }
          : undefined,
        away_participant: match.away_participant_id
          ? {
              id: match.away_participant_id,
              display_name: match.away_name,
              tag: match.away_tag,
              avatar_url: match.away_avatar,
              seed: match.away_seed,
            }
          : undefined,
      },
      evidence,
      substitutions,
      disputes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const match = queryOne<any>(`SELECT * FROM matches WHERE id = ?`, [id]);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const allowedFields = ['status', 'scheduled_time', 'deadline', 'room_id', 'room_password', 'referee_id', 'notes'];
    const updates: string[] = [];
    const values: any[] = [];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(body[key]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No valid fields provided' });
    }

    updates.push(`updated_at = ?`);
    values.push(new Date().toISOString());
    values.push(id);

    transaction(() => {
      execute(`UPDATE matches SET ${updates.join(', ')} WHERE id = ?`, values);
      execute(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, 'UPDATE_MATCH_SCHEDULE', 'match', ?, ?, ?)`,
        [`audit-${Date.now()}`, user.id, id, JSON.stringify(body), new Date().toISOString()]
      );
    });

    const updated = queryOne(`SELECT * FROM matches WHERE id = ?`, [id]);
    return NextResponse.json({ match: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


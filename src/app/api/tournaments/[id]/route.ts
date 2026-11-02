import { NextResponse } from 'next/server';
import { query, queryOne, execute, transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Search by ID or slug
    const tournament = queryOne<any>(
      `SELECT t.*, u.display_name as creator_name
       FROM tournaments t
       LEFT JOIN users u ON u.id = t.created_by
       WHERE t.id = ? OR t.slug = ?`,
      [id, id]
    );

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const participants = query<any>(
      `SELECT tp.*, c.name as clan_name, c.tag as clan_tag
       FROM tournament_participants tp
       LEFT JOIN clans c ON c.id = tp.participant_id
       WHERE tp.tournament_id = ?
       ORDER BY tp.seed ASC, tp.created_at ASC`,
      [tournament.id]
    );

    const groups = query<any>(
      `SELECT * FROM tournament_groups WHERE tournament_id = ? ORDER BY group_name ASC`,
      [tournament.id]
    );

    const standings = query<any>(
      `SELECT ts.*, tp.display_name as participant_name, tp.tag as participant_tag, tp.avatar_url
       FROM tournament_standings ts
       JOIN tournament_participants tp ON tp.id = ts.participant_id
       WHERE ts.tournament_id = ?
       ORDER BY ts.rank ASC`,
      [tournament.id]
    ).map((s: any) => ({
      ...s,
      form: typeof s.form === 'string' ? JSON.parse(s.form || '[]') : s.form,
    }));

    return NextResponse.json({
      tournament: {
        ...tournament,
        is_public: Boolean(tournament.is_public),
        substitutions_allowed: Boolean(tournament.substitutions_allowed),
        requires_referee_approval: Boolean(tournament.requires_referee_approval),
      },
      participants,
      groups,
      standings,
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
    const tournament = queryOne<any>(`SELECT * FROM tournaments WHERE id = ? OR slug = ?`, [id, id]);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const allowedFields = [
      'title',
      'description',
      'status',
      'rules_markdown',
      'banner_url',
      'prize_pool',
      'start_date',
      'end_date',
      'substitutions_allowed',
      'max_substitutions_per_match',
      'requires_referee_approval',
    ];

    const updates: string[] = [];
    const values: any[] = [];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        if (typeof body[key] === 'boolean') {
          values.push(body[key] ? 1 : 0);
        } else {
          values.push(body[key]);
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No valid fields provided for update' });
    }

    updates.push(`updated_at = ?`);
    values.push(new Date().toISOString());
    values.push(tournament.id);

    transaction(() => {
      execute(`UPDATE tournaments SET ${updates.join(', ')} WHERE id = ?`, values);
      execute(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, 'UPDATE_TOURNAMENT', 'tournament', ?, ?, ?)`,
        [`audit-${Date.now()}`, user.id, tournament.id, JSON.stringify(body), new Date().toISOString()]
      );
    });

    const updated = queryOne(`SELECT * FROM tournaments WHERE id = ?`, [tournament.id]);
    return NextResponse.json({ tournament: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

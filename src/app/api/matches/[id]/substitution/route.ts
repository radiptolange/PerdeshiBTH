import { NextResponse } from 'next/server';
import { queryOne, execute, transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const match = queryOne<any>(
      `SELECT m.*, t.substitutions_allowed, t.max_substitutions_per_match, t.requires_referee_approval
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       WHERE m.id = ?`,
      [id]
    );

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (!match.substitutions_allowed) {
      return NextResponse.json({ error: 'Substitutions are not permitted in this tournament.' }, { status: 400 });
    }

    const body = await request.json();
    const { action = 'REQUEST', substitution_id, player_out_id, player_in_id, reason } = body;

    const now = new Date().toISOString();

    if (action === 'APPROVE' && substitution_id) {
      transaction(() => {
        execute(
          `UPDATE match_substitutions SET status = 'APPROVED', approved_by = ? WHERE id = ? AND match_id = ?`,
          [user.id, substitution_id, id]
        );
        execute(
          `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
           VALUES (?, ?, 'APPROVE_SUBSTITUTION', 'match', ?, ?, ?)`,
          [`audit-${Date.now()}`, user.id, id, JSON.stringify({ substitution_id }), now]
        );
      });
      return NextResponse.json({ message: 'Player substitution approved' });
    }

    if (action === 'REJECT' && substitution_id) {
      transaction(() => {
        execute(
          `UPDATE match_substitutions SET status = 'REJECTED', approved_by = ? WHERE id = ? AND match_id = ?`,
          [user.id, substitution_id, id]
        );
      });
      return NextResponse.json({ message: 'Player substitution rejected' });
    }

    // Default: REQUEST new substitution
    if (!player_out_id || !player_in_id) {
      return NextResponse.json({ error: 'player_out_id and player_in_id are required' }, { status: 400 });
    }

    // Check count of already approved substitutions
    const currentSubsCount = queryOne<any>(
      `SELECT count(*) as count FROM match_substitutions WHERE match_id = ? AND status = 'APPROVED'`,
      [id]
    );

    if (currentSubsCount && currentSubsCount.count >= match.max_substitutions_per_match) {
      return NextResponse.json(
        { error: `Maximum substitutions limit (${match.max_substitutions_per_match}) reached for this match.` },
        { status: 400 }
      );
    }

    const subId = `sub-${Date.now()}`;
    const initialStatus = match.requires_referee_approval ? 'PENDING' : 'APPROVED';

    transaction(() => {
      execute(
        `INSERT INTO match_substitutions (id, match_id, requester_id, player_out_id, player_in_id, reason, status, approved_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [subId, id, user.id, player_out_id, player_in_id, reason || 'Tactical change', initialStatus, match.requires_referee_approval ? null : user.id, now]
      );

      execute(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, 'REQUEST_SUBSTITUTION', 'match', ?, ?, ?)`,
        [`audit-${Date.now()}`, user.id, id, JSON.stringify({ player_out_id, player_in_id, reason }), now]
      );
    });

    return NextResponse.json({
      message: initialStatus === 'APPROVED' ? 'Substitution applied automatically' : 'Substitution request sent to referee',
      substitution_id: subId,
      status: initialStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


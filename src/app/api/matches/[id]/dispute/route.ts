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

    const match = queryOne<any>(`SELECT * FROM matches WHERE id = ?`, [id]);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action = 'OPEN', dispute_id, reason, resolution_notes } = body;
    const now = new Date().toISOString();

    if (action === 'RESOLVE' && dispute_id) {
      transaction(() => {
        execute(
          `UPDATE match_disputes
           SET status = 'RESOLVED', resolution_notes = ?, resolved_by = ?, resolved_at = ?
           WHERE id = ? AND match_id = ?`,
          [resolution_notes || 'Resolved by official administrator', user.id, now, dispute_id, id]
        );

        // Reset match status to UNDER_REVIEW or AWAITING_RESULT so it can be re-scored/approved
        execute(`UPDATE matches SET status = 'UNDER_REVIEW', updated_at = ? WHERE id = ?`, [now, id]);

        execute(
          `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
           VALUES (?, ?, 'RESOLVE_DISPUTE', 'match', ?, ?, ?)`,
          [`audit-${Date.now()}`, user.id, id, JSON.stringify({ dispute_id, resolution_notes }), now]
        );
      });
      return NextResponse.json({ message: 'Dispute resolved' });
    }

    // Default: OPEN new dispute
    if (!reason) {
      return NextResponse.json({ error: 'Dispute reason is required' }, { status: 400 });
    }

    const dispId = `disp-${Date.now()}`;

    transaction(() => {
      execute(
        `INSERT INTO match_disputes (id, match_id, opened_by, reason, status, created_at)
         VALUES (?, ?, ?, ?, 'OPEN', ?)`,
        [dispId, id, user.id, reason, now]
      );

      // Lock match status to DISPUTED to prevent bracket progression
      execute(`UPDATE matches SET status = 'DISPUTED', updated_at = ? WHERE id = ?`, [now, id]);

      execute(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, 'OPEN_DISPUTE', 'match', ?, ?, ?)`,
        [`audit-${Date.now()}`, user.id, id, JSON.stringify({ reason }), now]
      );
    });

    return NextResponse.json({
      message: 'Dispute formally opened. Match progression is paused until referee review.',
      dispute_id: dispId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


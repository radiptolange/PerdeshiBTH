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

    if (match.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cannot swap slots in a completed match' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { action = 'SWAP_INTERNAL', target_match_id, slot_a = 'HOME', slot_b = 'AWAY' } = body;
    const now = new Date().toISOString();

    if (action === 'SWAP_INTERNAL') {
      // Swaps Home and Away within this match
      transaction(() => {
        execute(
          `UPDATE matches
           SET home_participant_id = ?, away_participant_id = ?, updated_at = ?
           WHERE id = ?`,
          [match.away_participant_id, match.home_participant_id, now, id]
        );
        execute(
          `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
           VALUES (?, ?, 'SWAP_MATCH_SLOTS', 'match', ?, ?, ?)`,
          [`audit-${Date.now()}`, user.id, id, JSON.stringify({ type: 'INTERNAL_SWAP' }), now]
        );
      });
      return NextResponse.json({ message: 'Home and away participants swapped successfully' });
    }

    return NextResponse.json({ error: 'Unsupported swap action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


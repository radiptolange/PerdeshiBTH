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

    const body = await request.json();
    const { home_score, away_score, status = 'UNDER_REVIEW' } = body;

    if (home_score === undefined || away_score === undefined) {
      return NextResponse.json({ error: 'home_score and away_score are required' }, { status: 400 });
    }

    const match = queryOne<any>(`SELECT * FROM matches WHERE id = ?`, [id]);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    transaction(() => {
      execute(
        `UPDATE matches
         SET home_score = ?, away_score = ?, status = ?, updated_at = ?
         WHERE id = ?`,
        [Number(home_score), Number(away_score), status, now, id]
      );

      execute(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, 'SUBMIT_SCORE', 'match', ?, ?, ?)`,
        [`audit-${Date.now()}`, user.id, id, JSON.stringify({ home_score, away_score, status }), now]
      );
    });

    const updated = queryOne(`SELECT * FROM matches WHERE id = ?`, [id]);
    return NextResponse.json({ match: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

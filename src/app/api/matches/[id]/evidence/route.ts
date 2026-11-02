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
    const { file_url, evidence_type = 'SCREENSHOT', note } = body;

    if (!file_url) {
      return NextResponse.json({ error: 'file_url is required' }, { status: 400 });
    }

    const match = queryOne<any>(`SELECT id FROM matches WHERE id = ?`, [id]);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const evId = `ev-${Date.now()}`;
    const now = new Date().toISOString();

    transaction(() => {
      execute(
        `INSERT INTO match_evidence (id, match_id, submitted_by, file_url, evidence_type, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [evId, id, user.id, file_url, evidence_type, note || null, now]
      );

      execute(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, 'UPLOAD_EVIDENCE', 'match', ?, ?, ?)`,
        [`audit-${Date.now()}`, user.id, id, JSON.stringify({ file_url, evidence_type }), now]
      );
    });

    return NextResponse.json({ message: 'Evidence recorded successfully', id: evId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const tournament = queryOne<any>(`SELECT id FROM tournaments WHERE id = ? OR slug = ?`, [id, id]);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const matches = query<any>(
      `SELECT m.*,
              hp.display_name as home_name, hp.tag as home_tag, hp.avatar_url as home_avatar, hp.seed as home_seed,
              ap.display_name as away_name, ap.tag as away_tag, ap.avatar_url as away_avatar, ap.seed as away_seed,
              u_ref.display_name as referee_name
       FROM matches m
       LEFT JOIN tournament_participants hp ON hp.id = m.home_participant_id
       LEFT JOIN tournament_participants ap ON ap.id = m.away_participant_id
       LEFT JOIN users u_ref ON u_ref.id = m.referee_id
       WHERE m.tournament_id = ?
       ORDER BY m.round_number ASC, m.match_number ASC`,
      [tournament.id]
    ).map((m: any) => ({
      ...m,
      home_participant: m.home_participant_id
        ? {
            id: m.home_participant_id,
            display_name: m.home_name,
            tag: m.home_tag,
            avatar_url: m.home_avatar,
            seed: m.home_seed,
          }
        : undefined,
      away_participant: m.away_participant_id
        ? {
            id: m.away_participant_id,
            display_name: m.away_name,
            tag: m.away_tag,
            avatar_url: m.away_avatar,
            seed: m.away_seed,
          }
        : undefined,
    }));

    return NextResponse.json({ matches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

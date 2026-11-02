import { NextResponse } from 'next/server';
import { query, queryOne, execute, transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const game = searchParams.get('game');
    const format = searchParams.get('format');
    const search = searchParams.get('search');

    let sql = `
      SELECT t.*,
             count(DISTINCT p.id) as confirmed_participants_count,
             count(DISTINCT m.id) as total_matches_count
      FROM tournaments t
      LEFT JOIN tournament_participants p ON p.tournament_id = t.id AND p.status = 'CONFIRMED'
      LEFT JOIN matches m ON m.tournament_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ` AND t.status = ?`;
      params.push(status);
    }
    if (game) {
      sql += ` AND t.game = ?`;
      params.push(game);
    }
    if (format) {
      sql += ` AND t.format = ?`;
      params.push(format);
    }
    if (search) {
      sql += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY t.id ORDER BY t.created_at DESC`;

    const tournaments = query(sql, params).map((t: any) => ({
      ...t,
      is_public: Boolean(t.is_public),
      substitutions_allowed: Boolean(t.substitutions_allowed),
      requires_referee_approval: Boolean(t.requires_referee_approval),
      current_participants: t.confirmed_participants_count ?? t.current_participants ?? 0,
    }));

    return NextResponse.json({ tournaments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      game,
      category = 'Championship',
      format,
      competition_type = 'PLAYER_1V1',
      team_size = 1,
      min_participants = 4,
      max_participants = 16,
      timezone = 'Asia/Kathmandu',
      registration_start,
      registration_end,
      start_date,
      end_date,
      match_deadline_hours = 24,
      prize_pool,
      rules_markdown,
      banner_url,
      logo_url,
      is_public = true,
      substitutions_allowed = true,
      max_substitutions_per_match = 2,
      requires_referee_approval = true,
    } = body;

    if (!title || !game || !format) {
      return NextResponse.json({ error: 'Title, game, and tournament format are required.' }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
    const id = `t-${slug}`;
    const now = new Date().toISOString();

    transaction(() => {
      execute(
        `INSERT INTO tournaments (
          id, org_id, title, slug, description, game, category, format, competition_type,
          team_size, status, timezone, min_participants, max_participants, current_participants,
          registration_start, registration_end, start_date, end_date, match_deadline_hours,
          prize_pool, rules_markdown, banner_url, logo_url, is_public,
          substitutions_allowed, max_substitutions_per_match, requires_referee_approval,
          created_by, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, 'DRAFT', ?, ?, ?, 0,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?
        )`,
        [
          id,
          user.clan_id || 'org-bth',
          title,
          slug,
          description || '',
          game,
          category,
          format,
          competition_type,
          team_size,
          timezone,
          min_participants,
          max_participants,
          registration_start || null,
          registration_end || null,
          start_date || null,
          end_date || null,
          match_deadline_hours,
          prize_pool || '',
          rules_markdown || '',
          banner_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200',
          logo_url || null,
          is_public ? 1 : 0,
          substitutions_allowed ? 1 : 0,
          max_substitutions_per_match,
          requires_referee_approval ? 1 : 0,
          user.id,
          now,
          now,
        ]
      );

      // Audit log
      execute(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, 'CREATE_TOURNAMENT', 'tournament', ?, ?, ?)`,
        [`audit-${id}`, user.id, id, JSON.stringify({ title, game, format }), now]
      );
    });

    const created = queryOne(`SELECT * FROM tournaments WHERE id = ?`, [id]);
    return NextResponse.json({ tournament: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


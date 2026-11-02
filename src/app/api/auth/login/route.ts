import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username or email is required' }, { status: 400 });
    }

    const user = queryOne<any>(
      `SELECT id, username, email, display_name, avatar_url, role, clan_id, game_ids, status, created_at
       FROM users WHERE username = ? OR email = ?`,
      [username, username]
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        ...user,
        game_ids: typeof user.game_ids === 'string' ? JSON.parse(user.game_ids || '{}') : user.game_ids,
      },
      token: user.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


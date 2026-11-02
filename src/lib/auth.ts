import { query, queryOne, execute } from './db';
import { User, UserRole, hasPermission } from '../types/auth';

export function getUserById(userId: string): User | null {
  const row = queryOne<any>(
    `SELECT id, username, email, display_name, avatar_url, role, clan_id, game_ids, status, created_at
     FROM users WHERE id = ?`,
    [userId]
  );
  if (!row) return null;
  return {
    ...row,
    game_ids: typeof row.game_ids === 'string' ? JSON.parse(row.game_ids || '{}') : row.game_ids || {},
  };
}

export function getUserByUsername(username: string): User | null {
  const row = queryOne<any>(
    `SELECT id, username, email, display_name, avatar_url, role, clan_id, game_ids, status, created_at
     FROM users WHERE username = ? OR email = ?`,
    [username, username]
  );
  if (!row) return null;
  return {
    ...row,
    game_ids: typeof row.game_ids === 'string' ? JSON.parse(row.game_ids || '{}') : row.game_ids || {},
  };
}

export function getCurrentUser(tokenOrHeader?: string): User | null {
  // Mock session resolver or test user (default to SuperAdmin for dev/admin routes if no header)
  if (!tokenOrHeader || tokenOrHeader === 'admin') {
    return getUserById('u-admin');
  }
  return getUserById(tokenOrHeader);
}

export function checkRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return hasPermission(userRole, requiredRole);
}


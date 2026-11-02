export type UserRole =
  | 'SUPER_ADMIN'
  | 'ORGANIZATION_OWNER'
  | 'TOURNAMENT_ADMIN'
  | 'TOURNAMENT_MANAGER'
  | 'MATCH_REFEREE'
  | 'CLAN_MANAGER'
  | 'TEAM_CAPTAIN'
  | 'REGISTERED_PLAYER'
  | 'SPECTATOR';

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: UserRole;
  clan_id?: string;
  game_ids: Record<string, string>; // e.g. { "efootball": "12345678", "pubg": "987654" }
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  created_at: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expires_at: string;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  ORGANIZATION_OWNER: 90,
  TOURNAMENT_ADMIN: 80,
  TOURNAMENT_MANAGER: 70,
  MATCH_REFEREE: 50,
  CLAN_MANAGER: 40,
  TEAM_CAPTAIN: 30,
  REGISTERED_PLAYER: 20,
  SPECTATOR: 10,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

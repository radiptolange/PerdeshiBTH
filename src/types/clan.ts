export type ClanRole = 'LEADER' | 'CO_LEADER' | 'ELDER' | 'MEMBER';

export interface Clan {
  id: string;
  name: string;
  tag: string;
  leader_id: string;
  leader_name?: string;
  logo_url?: string;
  banner_url?: string;
  description?: string;
  country: string;
  member_count?: number;
  created_at: string;
}

export interface ClanRosterMember {
  id: string;
  clan_id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  role_in_clan: ClanRole;
  is_main_roster: boolean;
  game_ids: Record<string, string>;
  joined_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  banner_url?: string;
  primary_color: string;
  social_links: Record<string, string>;
  created_at: string;
}

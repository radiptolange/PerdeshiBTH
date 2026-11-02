import { Match } from '../types/match';
import { TournamentParticipant, StandingRow } from '../types/tournament';

export interface StandingsConfig {
  winPoints?: number; // Default 3
  drawPoints?: number; // Default 1
  lossPoints?: number; // Default 0
}

/**
 * Calculates standings table for a tournament or group from verified/completed matches.
 */
export function computeStandings(
  participants: TournamentParticipant[],
  matches: Match[],
  config: StandingsConfig = {}
): StandingRow[] {
  const winPts = config.winPoints ?? 3;
  const drawPts = config.drawPoints ?? 1;
  const lossPts = config.lossPoints ?? 0;

  // Initialize participant records
  const statsMap = new Map<string, {
    participant: TournamentParticipant;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    gd: number;
    points: number;
    form: ('W' | 'D' | 'L')[];
    headToHeadPoints: Map<string, number>;
  }>();

  for (const p of participants) {
    statsMap.set(p.id, {
      participant: p,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      form: [],
      headToHeadPoints: new Map<string, number>(),
    });
  }

  // Filter completed matches
  const completedMatches = matches.filter((m) => m.status === 'COMPLETED');

  // Sort matches chronologically to calculate form correctly
  completedMatches.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

  for (const match of completedMatches) {
    const homeId = match.home_participant_id;
    const awayId = match.away_participant_id;

    if (!homeId || !awayId) continue;

    const homeStats = statsMap.get(homeId);
    const awayStats = statsMap.get(awayId);

    if (!homeStats || !awayStats) continue;

    const hScore = match.home_score;
    const aScore = match.away_score;

    homeStats.played += 1;
    awayStats.played += 1;

    homeStats.gf += hScore;
    homeStats.ga += aScore;
    homeStats.gd = homeStats.gf - homeStats.ga;

    awayStats.gf += aScore;
    awayStats.ga += hScore;
    awayStats.gd = awayStats.gf - awayStats.ga;

    if (hScore > aScore) {
      homeStats.won += 1;
      homeStats.points += winPts;
      homeStats.form.push('W');

      awayStats.lost += 1;
      awayStats.points += lossPts;
      awayStats.form.push('L');

      const prevH2H = homeStats.headToHeadPoints.get(awayId) ?? 0;
      homeStats.headToHeadPoints.set(awayId, prevH2H + winPts);
    } else if (hScore < aScore) {
      awayStats.won += 1;
      awayStats.points += winPts;
      awayStats.form.push('W');

      homeStats.lost += 1;
      homeStats.points += lossPts;
      homeStats.form.push('L');

      const prevH2H = awayStats.headToHeadPoints.get(homeId) ?? 0;
      awayStats.headToHeadPoints.set(homeId, prevH2H + winPts);
    } else {
      homeStats.drawn += 1;
      homeStats.points += drawPts;
      homeStats.form.push('D');

      awayStats.drawn += 1;
      awayStats.points += drawPts;
      awayStats.form.push('D');

      const prevH2H_H = homeStats.headToHeadPoints.get(awayId) ?? 0;
      homeStats.headToHeadPoints.set(awayId, prevH2H_H + drawPts);

      const prevH2H_A = awayStats.headToHeadPoints.get(homeId) ?? 0;
      awayStats.headToHeadPoints.set(homeId, prevH2H_A + drawPts);
    }
  }

  // Convert to array and sort by tiebreakers
  const list = Array.from(statsMap.values());

  list.sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // 2. Goal Difference
    if (b.gd !== a.gd) {
      return b.gd - a.gd;
    }
    // 3. Goals For
    if (b.gf !== a.gf) {
      return b.gf - a.gf;
    }
    // 4. Head-to-Head points between the two
    const aH2H = a.headToHeadPoints.get(b.participant.id) ?? 0;
    const bH2H = b.headToHeadPoints.get(a.participant.id) ?? 0;
    if (bH2H !== aH2H) {
      return bH2H - aH2H;
    }
    // 5. Total Wins
    if (b.won !== a.won) {
      return b.won - a.won;
    }
    // 6. Alphabetical
    return a.participant.display_name.localeCompare(b.participant.display_name);
  });

  return list.map((item, index) => {
    // Last 5 matches for form
    const recentForm = item.form.slice(-5);
    return {
      id: `std-${item.participant.id}`,
      tournament_id: item.participant.tournament_id,
      group_id: item.participant.group_id,
      participant_id: item.participant.id,
      participant_name: item.participant.display_name,
      participant_avatar: item.participant.avatar_url,
      participant_tag: item.participant.tag,
      played: item.played,
      won: item.won,
      drawn: item.drawn,
      lost: item.lost,
      goals_for: item.gf,
      goals_against: item.ga,
      goal_difference: item.gd,
      points: item.points,
      rank: index + 1,
      form: recentForm,
    };
  });
}

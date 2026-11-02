/**
 * Deterministic permanent Match ID generator.
 * Example format: BTH-NCC-2026-R01-M001
 * Matches are immutable once assigned.
 */

export interface MatchIdParams {
  prefix?: string; // Default: 'BTH'
  tournamentCode: string; // e.g. 'NCC', 'EFT', 'WINTER26'
  year?: number; // Default: current year (2026)
  stageCode?: string; // e.g. 'GA' for Group A, 'UB' for Upper Bracket
  roundNumber: number;
  matchNumber: number;
}

export function formatMatchCode(num: number, digits: number = 3): string {
  return String(num).padStart(digits, '0');
}

export function formatRoundCode(num: number): string {
  return `R${String(num).padStart(2, '0')}`;
}

export function generateMatchId(params: MatchIdParams): string {
  const prefix = (params.prefix || 'BTH').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const code = (params.tournamentCode || 'TOURN').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const year = params.year || new Date().getFullYear();
  const round = formatRoundCode(params.roundNumber);
  const match = `M${formatMatchCode(params.matchNumber, 3)}`;

  if (params.stageCode) {
    const stage = params.stageCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `${prefix}-${code}-${year}-${stage}-${round}-${match}`;
  }

  return `${prefix}-${code}-${year}-${round}-${match}`;
}

export function parseMatchId(matchId: string): {
  prefix: string;
  tournamentCode: string;
  year: number;
  stageCode?: string;
  roundNumber: number;
  matchNumber: number;
} | null {
  const parts = matchId.split('-');
  if (parts.length < 5) return null;

  try {
    if (parts.length === 5) {
      const [prefix, tournamentCode, yearStr, roundStr, matchStr] = parts;
      return {
        prefix,
        tournamentCode,
        year: parseInt(yearStr, 10),
        roundNumber: parseInt(roundStr.replace('R', ''), 10),
        matchNumber: parseInt(matchStr.replace('M', ''), 10),
      };
    } else {
      const [prefix, tournamentCode, yearStr, stageCode, roundStr, matchStr] = parts;
      return {
        prefix,
        tournamentCode,
        year: parseInt(yearStr, 10),
        stageCode,
        roundNumber: parseInt(roundStr.replace('R', ''), 10),
        matchNumber: parseInt(matchStr.replace('M', ''), 10),
      };
    }
  } catch {
    return null;
  }
}


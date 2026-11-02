import 'server-only';

export type CricketInningsScore = {
  inning: string;
  runs: number;
  wickets: number;
  overs: number;
};

export type CricketMatch = {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  teams: string[];
  score: CricketInningsScore[];
};

export type CricketScoresResult = {
  configured: boolean;
  matches: CricketMatch[];
  error: string | null;
};

type ProviderMatch = {
  id?: unknown;
  name?: unknown;
  matchType?: unknown;
  status?: unknown;
  venue?: unknown;
  date?: unknown;
  teams?: unknown;
  score?: unknown;
  matchStarted?: unknown;
  matchEnded?: unknown;
};

const asString = (value: unknown) => typeof value === 'string' ? value : '';

function mapMatch(value: unknown): CricketMatch | null {
  if (!value || typeof value !== 'object') return null;
  const match = value as ProviderMatch;
  if (typeof match.id !== 'string' || typeof match.name !== 'string') return null;

  const scores = Array.isArray(match.score) ? match.score.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const inning = asString((item as Record<string, unknown>).inning);
    const runs = (item as Record<string, unknown>).r;
    const wickets = (item as Record<string, unknown>).w;
    const overs = (item as Record<string, unknown>).o;
    if (!inning || typeof runs !== 'number' || typeof wickets !== 'number' || typeof overs !== 'number') return [];
    return [{ inning, runs, wickets, overs }];
  }) : [];

  return {
    id: match.id,
    name: match.name,
    matchType: asString(match.matchType),
    status: asString(match.status) || 'मैच जारी है',
    venue: asString(match.venue),
    date: asString(match.date),
    teams: Array.isArray(match.teams) ? match.teams.filter((team): team is string => typeof team === 'string') : [],
    score: scores,
  };
}

export async function getLiveCricketScores(): Promise<CricketScoresResult> {
  const apiKey = process.env.CRICKET_DATA_API_KEY;
  if (!apiKey) return { configured: false, matches: [], error: null };

  const url = new URL('https://api.cricapi.com/v1/currentMatches');
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('offset', '0');

  try {
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) {
      console.error(`CricketData API request failed with status ${response.status}`);
      return { configured: true, matches: [], error: 'लाइव स्कोर अभी उपलब्ध नहीं हैं। कृपया थोड़ी देर बाद फिर कोशिश करें।' };
    }

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') {
      console.error('CricketData API returned an invalid response.');
      return { configured: true, matches: [], error: 'स्कोर सेवा से सही डेटा नहीं मिला।' };
    }

    const result = payload as { status?: unknown; reason?: unknown; data?: unknown };
    if (result.status !== 'success') {
      const reason = asString(result.reason);
      console.error(`CricketData API error: ${reason || 'unknown provider response'}`);
      return { configured: true, matches: [], error: 'लाइव स्कोर अभी उपलब्ध नहीं हैं। कृपया थोड़ी देर बाद फिर कोशिश करें।' };
    }

    const matches = Array.isArray(result.data) ? result.data.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const source = item as ProviderMatch;
      const match = mapMatch(item);
      return source.matchStarted === true && source.matchEnded !== true && match ? [match] : [];
    }) : [];
    return { configured: true, matches, error: null };
  } catch (error) {
    console.error('Could not fetch live cricket scores:', error);
    return { configured: true, matches: [], error: 'लाइव स्कोर सेवा से संपर्क नहीं हो सका। कृपया थोड़ी देर बाद फिर कोशिश करें।' };
  }
}

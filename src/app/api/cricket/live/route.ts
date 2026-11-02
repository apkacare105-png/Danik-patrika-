import { getLiveCricketScores } from '@/lib/cricket-scores';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getLiveCricketScores();
  return Response.json(result);
}

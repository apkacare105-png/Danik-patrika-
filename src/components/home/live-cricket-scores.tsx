'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import type { CricketScoresResult } from '@/lib/cricket-scores';

export function LiveCricketScores({ initial }: { initial: CricketScoresResult }) {
  const [result, setResult] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    setUpdatedAt(new Date());
    if (!initial.configured) return;

    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/cricket/live');
        const next: CricketScoresResult = await response.json();
        if (active) {
          setResult(next);
          setUpdatedAt(new Date());
        }
      } catch {
        if (active) setResult((current) => ({
          ...current,
          error: 'लाइव स्कोर रीफ़्रेश नहीं हो सके।',
        }));
      }
    };
    const timer = window.setInterval(refresh, 300_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [initial.configured]);

  return (
    <section className="mb-5 rounded-xl border bg-white p-4 shadow-sm" aria-label="क्रिकेट लाइव स्कोर">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-brand" />
          <h2 className="text-xl font-bold">क्रिकेट लाइव स्कोर</h2>
        </div>
        {result.matches.length > 0 && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-brand">LIVE</span>}
      </div>

      {!result.configured ? (
        <p className="text-sm text-neutral-600">लाइव स्कोर चालू करने के लिए सर्वर पर CricketData API key सेट करें।</p>
      ) : result.error ? (
        <p className="text-sm text-amber-700" role="status">{result.error}</p>
      ) : result.matches.length === 0 ? (
        <p className="text-sm text-neutral-600">अभी कोई लाइव क्रिकेट मैच नहीं चल रहा है।</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {result.matches.map((match) => (
            <article key={match.id} className="rounded-lg border bg-neutral-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{match.name}</p>
                {match.matchType && <span className="rounded bg-white px-2 py-0.5 text-xs uppercase text-neutral-500">{match.matchType}</span>}
              </div>
              {match.score.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {match.score.map((innings) => (
                    <p key={innings.inning} className="text-sm">
                      <span className="font-semibold">{innings.inning}:</span> {innings.runs}/{innings.wickets} <span className="text-neutral-500">({innings.overs} ओवर)</span>
                    </p>
                  ))}
                </div>
              ) : <p className="mt-2 text-sm text-neutral-500">स्कोर अपडेट की प्रतीक्षा है।</p>}
              <p className="mt-2 text-xs text-neutral-600">{match.status}</p>
              {match.venue && <p className="mt-1 text-xs text-neutral-500">{match.venue}</p>}
            </article>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-neutral-400">
        CricketData.org से · डेटा में कुछ मिनट की देरी हो सकती है
        {updatedAt && ` · पेज अपडेट ${updatedAt.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}`}
      </p>
    </section>
  );
}

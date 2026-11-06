'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { FEEDBACK_CATEGORY_LABEL, FEEDBACK_STATUS_LABEL, type Feedback, type FeedbackStatus } from '@/lib/types';
import { setFeedbackStatus } from '@/actions/feedback';
import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<FeedbackStatus, 'warning' | 'info' | 'success'> = { new: 'warning', reviewed: 'info', resolved: 'success' };
const dateFmt = new Intl.DateTimeFormat('hi-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

export function FeedbackTable({ initial }: { initial: Feedback[] }) {
  const [list, setList] = useState(initial);
  const [filter, setFilter] = useState<'all' | FeedbackStatus>('all');
  const shown = list.filter((f) => filter === 'all' || f.status === filter);

  const change = async (id: string, status: FeedbackStatus) => {
    const prev = list;
    setList(list.map((f) => (f.id === id ? { ...f, status } : f)));
    const res = await setFeedbackStatus(id, status);
    if (!res.ok) { setList(prev); toast.error(res.message); }
  };

  const rated = list.filter((f) => f.rating);
  const avg = rated.length ? (rated.reduce((s, f) => s + (f.rating ?? 0), 0) / rated.length).toFixed(1) : '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
        {(['all', 'new', 'reviewed', 'resolved'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${filter === k ? 'bg-brand text-white' : 'bg-neutral-100 hover:bg-neutral-200'}`}
          >
            {k === 'all' ? `सभी (${list.length})` : `${FEEDBACK_STATUS_LABEL[k]} (${list.filter((f) => f.status === k).length})`}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1 text-sm text-neutral-600"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> औसत रेटिंग: <b>{avg}</b></span>
      </div>

      {!shown.length ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-neutral-500 shadow-sm">कोई फ़ीडबैक नहीं मिला।</div>
      ) : (
        <ul className="space-y-3">
          {shown.map((f) => (
            <li key={f.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{f.user_name}</span>
                {f.user_email && <span className="text-xs text-neutral-500">{f.user_email}</span>}
                <Badge variant="secondary">{FEEDBACK_CATEGORY_LABEL[f.category]}</Badge>
                <Badge variant={STATUS_VARIANT[f.status]}>{FEEDBACK_STATUS_LABEL[f.status]}</Badge>
                {f.rating && <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{f.rating}/5</span>}
                <span className="ml-auto text-xs text-neutral-400">{dateFmt.format(new Date(f.created_at))}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-neutral-700">{f.message}</p>
              <div className="mt-3 flex items-center gap-2">
                <label htmlFor={`st-${f.id}`} className="text-xs text-neutral-500">स्थिति:</label>
                <select
                  id={`st-${f.id}`}
                  value={f.status}
                  onChange={(e) => change(f.id, e.target.value as FeedbackStatus)}
                  className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs"
                >
                  {(Object.keys(FEEDBACK_STATUS_LABEL) as FeedbackStatus[]).map((s) => <option key={s} value={s}>{FEEDBACK_STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

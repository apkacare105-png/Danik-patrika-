'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Send, Star } from 'lucide-react';
import { FEEDBACK_CATEGORY_LABEL, FEEDBACK_STATUS_LABEL, type Feedback, type FeedbackCategory, type FeedbackStatus } from '@/lib/types';
import { submitFeedback } from '@/actions/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_VARIANT: Record<FeedbackStatus, 'warning' | 'info' | 'success'> = { new: 'warning', reviewed: 'info', resolved: 'success' };
const dateFmt = new Intl.DateTimeFormat('hi-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });

export function FeedbackTab({ initial }: { initial: Feedback[] }) {
  const [list, setList] = useState(initial);
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await submitFeedback({ category, rating, message });
    setBusy(false);
    if (!res.ok) return toast.error(res.message);
    toast.success(res.message);
    setList([{ id: `new-${Date.now()}`, user_id: '', category, rating, message: message.trim(), status: 'new', created_at: new Date().toISOString() }, ...list]);
    setMessage('');
    setRating(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold">हमें अपना फ़ीडबैक भेजें</h2>
          <p className="text-sm text-neutral-500">वेबसाइट, ख़बरों या किसी समस्या के बारे में हमें बताएँ। हम हर संदेश पढ़ते हैं।</p>
        </div>
        <div>
          <label htmlFor="fb-cat" className="mb-1 block text-sm font-semibold">विषय</label>
          <select
            id="fb-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            disabled={busy}
            className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-brand focus:outline-none"
          >
            {(Object.keys(FEEDBACK_CATEGORY_LABEL) as FeedbackCategory[]).map((k) => <option key={k} value={k}>{FEEDBACK_CATEGORY_LABEL[k]}</option>)}
          </select>
        </div>
        <div>
          <span className="mb-1 block text-sm font-semibold">आपका अनुभव (वैकल्पिक)</span>
          <div className="flex gap-1" role="radiogroup" aria-label="रेटिंग">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} स्टार`}
                onClick={() => setRating(rating === n ? null : n)}
                className="rounded p-1 hover:bg-neutral-100"
              >
                <Star className={`h-6 w-6 ${rating !== null && n <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="fb-msg" className="mb-1 block text-sm font-semibold">आपका संदेश</label>
          <textarea
            id="fb-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minLength={5}
            maxLength={2000}
            rows={5}
            required
            disabled={busy}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            placeholder="यहाँ लिखें…"
          />
          <p className="text-right text-xs text-neutral-400">{message.length}/2000</p>
        </div>
        <Button type="submit" disabled={busy}><Send className="h-4 w-4" /> {busy ? 'भेजा जा रहा है…' : 'फ़ीडबैक भेजें'}</Button>
      </form>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">आपके भेजे फ़ीडबैक</h2>
        {!list.length ? (
          <p className="py-8 text-center text-sm text-neutral-500">आपने अभी तक कोई फ़ीडबैक नहीं भेजा है।</p>
        ) : (
          <ul className="space-y-3">
            {list.map((f) => (
              <li key={f.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{FEEDBACK_CATEGORY_LABEL[f.category]}</Badge>
                  <Badge variant={STATUS_VARIANT[f.status]}>{FEEDBACK_STATUS_LABEL[f.status]}</Badge>
                  {f.rating && <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{f.rating}/5</span>}
                  <span className="ml-auto text-xs text-neutral-400">{dateFmt.format(new Date(f.created_at))}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-neutral-700">{f.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

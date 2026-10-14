'use client';

import { useState, useTransition } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '@/lib/types';
import { saveCategoryOrder } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

function Row({ c, onToggle }: { c: Category; onToggle: (v: boolean) => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={c} dragListener={false} dragControls={controls} className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm" whileDrag={{ scale: 1.02, boxShadow: '0 10px 25px rgba(0,0,0,.15)' }}>
      <button onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none rounded p-1 text-neutral-400 hover:bg-neutral-100 active:cursor-grabbing" aria-label={`${c.name_hi} को खींचकर क्रम बदलें`}>
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <p className={`font-semibold ${c.is_active ? '' : 'text-neutral-400 line-through'}`}>{c.name_hi}</p>
        <p className="text-xs text-neutral-500">/{c.slug} · {c.sub_categories.length} उप-श्रेणियाँ</p>
      </div>
      <Switch checked={c.is_active} onCheckedChange={onToggle} aria-label={`${c.name_hi} सक्रिय करें`} />
    </Reorder.Item>
  );
}

export function CategoryManager({ initial }: { initial: Category[] }) {
  const [items, setItems] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();

  const save = () => start(async () => {
    const r = await saveCategoryOrder(items.map((c, i) => ({ id: c.id, order_index: i + 1, is_active: c.is_active })));
    if (r.ok) { toast.success(r.message); setDirty(false); } else toast.error(r.message);
  });

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">श्रेणी प्रबंधक</h2>
            <p className="text-sm text-neutral-500">क्रम बदलने के लिए हैंडल को खींचें।</p>
          </div>
          <Button onClick={save} disabled={!dirty || pending}><Save className="h-4 w-4" /> {pending ? 'सहेजा जा रहा है…' : 'क्रम सहेजें'}</Button>
        </div>
        <Reorder.Group axis="y" values={items} onReorder={(v) => { setItems(v); setDirty(true); }} className="space-y-2">
          {items.map((c) => (
            <Row key={c.id} c={c} onToggle={(v) => { setItems((p) => p.map((x) => (x.id === c.id ? { ...x, is_active: v } : x))); setDirty(true); }} />
          ))}
        </Reorder.Group>
      </div>

      {/* हेडर मेन्यू का लाइव प्रीव्यू */}
      <div className="rounded-xl bg-white p-4 shadow-sm xl:sticky xl:top-4 xl:self-start">
        <h3 className="mb-1 text-lg font-bold">हेडर मेन्यू का लाइव प्रीव्यू</h3>
        <p className="mb-3 text-sm text-neutral-500">निष्क्रिय श्रेणियाँ वेबसाइट पर नहीं दिखेंगी।</p>
        <div className="overflow-x-auto rounded-lg bg-neutral-900 text-white scrollbar-hide">
          <div className="flex w-max items-center">
            <span className="px-3 py-3 text-sm font-bold">होम</span>
            {items.filter((c) => c.is_active).map((c, i) => (
              <span key={c.id} className={`whitespace-nowrap px-3 py-3 text-sm font-bold ${i === 0 ? 'bg-brand' : ''}`}>{c.name_hi}</span>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {items.filter((c) => c.sub_categories.length > 0 && c.is_active).slice(0, 4).map((c) => (
            <div key={c.id} className="rounded-lg bg-neutral-50 p-2">
              <p className="font-semibold">{c.name_hi}</p>
              <p className="text-xs text-neutral-500">{c.sub_categories.map((s) => s.name_hi).join(' · ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

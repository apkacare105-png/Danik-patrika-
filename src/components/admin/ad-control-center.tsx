'use client';

import { useState, useTransition } from 'react';
import { Eye, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AD_SLOT_LABEL, type AdSlot } from '@/lib/types';
import { saveAdSlot } from '@/actions/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const PUB_RE = /^ca-pub-\d{16}$/;

function SlotCard({ slot, readOnly, onSaved }: { slot: AdSlot; readOnly: boolean; onSaved: (s: AdSlot) => void }) {
  const [s, setS] = useState(slot);
  const [showPreview, setShowPreview] = useState(false);
  const [pending, start] = useTransition();
  const pubOk = !s.publisher_id || PUB_RE.test(s.publisher_id);
  const changed = JSON.stringify(s) !== JSON.stringify(slot);

  const save = () => start(async () => {
    const r = await saveAdSlot({ id: s.id, ad_code: s.ad_code, is_enabled: s.is_enabled, publisher_id: s.publisher_id });
    if (r.ok) { toast.success(`${AD_SLOT_LABEL[s.slot_type]}: ${r.message}`); onSaved(s); } else toast.error(r.message);
  });

  // सुरक्षित प्रीव्यू: sandbox वाले iframe में कोड कभी स्क्रिप्ट नहीं चलाता
  const srcDoc = `<body style="margin:0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100px;background:#fafafa;color:#888">${
    s.ad_code.trim() ? s.ad_code.replace(/<script[\s\S]*?<\/script>/gi, '') : 'विज्ञापन कोड खाली है — प्लेसहोल्डर'
  }</body>`;

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm transition ${s.is_enabled ? '' : 'opacity-80'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{AD_SLOT_LABEL[s.slot_type]}</h3>
            <Badge variant={s.is_enabled ? 'success' : 'secondary'}>{s.is_enabled ? 'चालू' : 'बंद'}</Badge>
          </div>
          <p className="text-xs text-neutral-500">स्लॉट: {s.slot_key}</p>
        </div>
        <Switch checked={s.is_enabled} disabled={readOnly} onCheckedChange={(v) => setS({ ...s, is_enabled: v })} aria-label={`${AD_SLOT_LABEL[s.slot_type]} चालू/बंद`} />
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <Label htmlFor={`pub-${s.id}`}>Google AdSense पब्लिशर ID</Label>
          <Input id={`pub-${s.id}`} value={s.publisher_id ?? ''} disabled={readOnly} placeholder="ca-pub-XXXXXXXXXXXXXXXX" onChange={(e) => setS({ ...s, publisher_id: e.target.value.trim() })} aria-invalid={!pubOk} className={pubOk ? '' : 'border-red-500'} />
          {!pubOk && <p className="mt-1 text-xs text-red-600">फ़ॉर्मैट: ca-pub- के बाद 16 अंक।</p>}
        </div>
        <div>
          <Label htmlFor={`code-${s.id}`}>विज्ञापन कोड</Label>
          <Textarea id={`code-${s.id}`} rows={4} value={s.ad_code} disabled={readOnly} onChange={(e) => setS({ ...s, ad_code: e.target.value })} placeholder={'<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-…" data-ad-slot="…"></ins>'} className="font-mono text-xs" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}><Eye className="h-4 w-4" /> {showPreview ? 'प्रीव्यू छिपाएँ' : 'कोड प्रीव्यू'}</Button>
        {!readOnly && <Button size="sm" onClick={save} disabled={!changed || !pubOk || pending}><Save className="h-4 w-4" /> {pending ? 'सहेजा जा रहा है…' : 'सहेजें'}</Button>}
      </div>
      {showPreview && (
        <iframe title={`${s.slot_key} प्रीव्यू`} sandbox="" srcDoc={srcDoc} className="mt-3 h-28 w-full rounded-lg border" />
      )}
    </div>
  );
}

export function AdControlCenter({ initial, readOnly }: { initial: AdSlot[]; readOnly: boolean }) {
  const [slots, setSlots] = useState(initial);
  const enabled = slots.filter((s) => s.is_enabled).length;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">AdSense और मोनेटाइज़ेशन केंद्र</h2>
          <p className="text-sm text-neutral-500">{enabled} / {slots.length} स्लॉट चालू हैं।</p>
        </div>
        {readOnly && <Badge variant="warning"><Lock className="mr-1 h-3 w-3" /> एडमिन के लिए सिर्फ़ देखने की अनुमति</Badge>}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {slots.map((s) => <SlotCard key={s.id} slot={s} readOnly={readOnly} onSaved={(n) => setSlots((p) => p.map((x) => (x.id === n.id ? n : x)))} />)}
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PortfolioProject } from '@/lib/types';
import { deletePortfolioProject, savePortfolioProject } from '@/actions/admin';
import { ProjectModal } from '@/components/portfolio-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input, Label, Textarea } from '@/components/ui/input';

const blank = (): PortfolioProject => ({
  id: `new-${Date.now()}`, client_name: '', project_type: '', thumbnail_url: '', live_url: '', description_hi: '', case_study_markdown: '',
});

export function PortfolioManager({ initial }: { initial: PortfolioProject[] }) {
  const [items, setItems] = useState(initial);
  const [edit, setEdit] = useState<PortfolioProject | null>(null);
  const [preview, setPreview] = useState<PortfolioProject | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    if (!edit) return;
    if (!edit.client_name.trim() || !edit.project_type.trim()) {
      toast.error('क्लाइंट का नाम और प्रोजेक्ट का प्रकार भरना ज़रूरी है।');
      return;
    }
    start(async () => {
      const r = await savePortfolioProject(edit);
      if (!r.ok) { toast.error(r.message); return; }
      setItems((p) => (p.some((x) => x.id === edit.id) ? p.map((x) => (x.id === edit.id ? edit : x)) : [...p, edit]));
      toast.success(r.message);
      setEdit(null);
    });
  };

  const remove = (p: PortfolioProject) => {
    if (!confirm(`“${p.client_name}” को हटाएँ?`)) return;
    start(async () => {
      const r = await deletePortfolioProject(p.id);
      if (r.ok) { setItems((x) => x.filter((i) => i.id !== p.id)); toast.success(r.message); } else toast.error(r.message);
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">हमारे कार्य (पोर्टफ़ोलियो)</h2>
          <p className="text-sm text-neutral-500">क्लाइंट प्रोजेक्ट जोड़ें और प्रकाशित करने से पहले मोडल में देखें।</p>
        </div>
        <Button onClick={() => setEdit(blank())}><Plus className="h-4 w-4" /> नया प्रोजेक्ट</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="aspect-[16/9] bg-neutral-200">{p.thumbnail_url && <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />}</div>
            <div className="p-3">
              <Badge variant="secondary">{p.project_type}</Badge>
              <p className="mt-1 font-bold">{p.client_name}</p>
              <p className="line-clamp-2 text-sm text-neutral-600">{p.description_hi}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPreview(p)}><Eye className="h-4 w-4" /> प्रीव्यू</Button>
                <Button size="sm" variant="secondary" onClick={() => setEdit(p)}><Pencil className="h-4 w-4" /> संपादित करें</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p)} aria-label="हटाएँ"><Trash2 className="h-4 w-4 text-red-600" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogTitle>{edit && items.some((i) => i.id === edit.id) ? 'प्रोजेक्ट संपादित करें' : 'नया प्रोजेक्ट'}</DialogTitle>
          <DialogDescription>सभी जानकारी हिंदी में भरें।</DialogDescription>
          {edit && (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label htmlFor="cn">क्लाइंट का नाम</Label><Input id="cn" value={edit.client_name} onChange={(e) => setEdit({ ...edit, client_name: e.target.value })} /></div>
                <div><Label htmlFor="pt">प्रोजेक्ट का प्रकार</Label><Input id="pt" value={edit.project_type} onChange={(e) => setEdit({ ...edit, project_type: e.target.value })} /></div>
              </div>
              <div><Label htmlFor="th">थंबनेल URL</Label><Input id="th" value={edit.thumbnail_url ?? ''} onChange={(e) => setEdit({ ...edit, thumbnail_url: e.target.value })} /></div>
              <div><Label htmlFor="lu">लाइव URL</Label><Input id="lu" value={edit.live_url ?? ''} placeholder="https://" onChange={(e) => setEdit({ ...edit, live_url: e.target.value })} /></div>
              <div><Label htmlFor="ds">संक्षिप्त विवरण</Label><Textarea id="ds" rows={2} value={edit.description_hi} onChange={(e) => setEdit({ ...edit, description_hi: e.target.value })} /></div>
              <div><Label htmlFor="cs">केस स्टडी (मार्कडाउन)</Label><Textarea id="cs" rows={6} value={edit.case_study_markdown} onChange={(e) => setEdit({ ...edit, case_study_markdown: e.target.value })} className="font-mono text-xs" /></div>
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setPreview(edit)}><Eye className="h-4 w-4" /> लाइव प्रीव्यू</Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setEdit(null)}>रद्द करें</Button>
                  <Button onClick={save} disabled={pending}>{pending ? 'सहेजा जा रहा है…' : 'सहेजें'}</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProjectModal project={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

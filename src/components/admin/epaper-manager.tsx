'use client';

import { useState, useTransition } from 'react';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteEpaperEdition, saveEpaperEdition } from '@/actions/epaper';
import { createClient, hasSupabaseClient } from '@/lib/supabase/client';
import type { EpaperEdition } from '@/lib/types';
import { formatDateHi } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';

type EpaperForm = Omit<EpaperEdition, 'id' | 'created_at'> & { id?: string; file?: File };
type ListedEdition = EpaperEdition & { pdf_url: string };

const blank = (): EpaperForm => ({
  title: '',
  issue_number: '',
  published_on: new Date().toISOString().slice(0, 10),
  pdf_path: '',
});

export function EpaperManager({ initial, configured }: { initial: ListedEdition[]; configured: boolean }) {
  const [editions, setEditions] = useState(initial);
  const [edit, setEdit] = useState<EpaperForm | null>(null);
  const [pending, start] = useTransition();
  const isEditing = Boolean(edit?.id);

  const save = () => {
    if (!edit) return;
    if (!edit.title.trim() || !edit.issue_number.trim() || !edit.published_on) {
      toast.error('शीर्षक, अंक संख्या और प्रकाशन तारीख़ भरें।');
      return;
    }
    if (!edit.pdf_path && !edit.file) {
      toast.error('ई-पेपर की PDF फ़ाइल चुनें।');
      return;
    }
    if (!configured || !hasSupabaseClient()) {
      toast.error('ई-पेपर प्रबंधन के लिए Supabase कॉन्फ़िगर करना ज़रूरी है।');
      return;
    }

    start(async () => {
      const previousPath = edit.pdf_path;
      let uploadedPath = previousPath;
      if (edit.file) {
        const path = `${crypto.randomUUID()}.pdf`;
        const { error: uploadError } = await createClient().storage.from('epapers').upload(path, edit.file, {
          cacheControl: '3600',
          contentType: 'application/pdf',
        });
        if (uploadError) {
          toast.error(`PDF अपलोड नहीं हो सकी: ${uploadError.message}`);
          return;
        }
        uploadedPath = path;
      }

      const result = await saveEpaperEdition({
        id: edit.id,
        title: edit.title,
        issue_number: edit.issue_number,
        published_on: edit.published_on,
        pdf_path: uploadedPath,
      });
      if (!result.ok || !result.id) {
        if (edit.file) {
          const { error: cleanupError } = await createClient().storage.from('epapers').remove([uploadedPath]);
          if (cleanupError) toast.error(`ई-पेपर सहेजना विफल रहा और नई PDF साफ़ नहीं हो सकी: ${cleanupError.message}`);
        }
        toast.error(result.message);
        return;
      }

      const saved: EpaperEdition = {
        id: result.id,
        title: edit.title.trim(),
        issue_number: edit.issue_number.trim(),
        published_on: edit.published_on,
        pdf_path: uploadedPath,
        created_at: editions.find((edition) => edition.id === result.id)?.created_at ?? new Date().toISOString(),
      };
      const savedWithUrl: ListedEdition = {
        ...saved,
        pdf_url: createClient().storage.from('epapers').getPublicUrl(uploadedPath).data.publicUrl,
      };
      setEditions((current) => current.some((edition) => edition.id === savedWithUrl.id)
        ? current.map((edition) => edition.id === savedWithUrl.id ? savedWithUrl : edition)
        : [savedWithUrl, ...current].sort((a, b) => b.published_on.localeCompare(a.published_on)));
      setEdit(null);
      toast.success(result.message);

      if (edit.file && previousPath && previousPath !== uploadedPath) {
        const { error: removeError } = await createClient().storage.from('epapers').remove([previousPath]);
        if (removeError) toast.error(`ई-पेपर अपडेट हो गया, लेकिन पुरानी PDF हटाई नहीं जा सकी: ${removeError.message}`);
      }
    });
  };

  const remove = (edition: EpaperEdition) => {
    if (!confirm(`“${edition.title}” (अंक ${edition.issue_number}) हटाएँ?`)) return;
    start(async () => {
      const result = await deleteEpaperEdition(edition.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setEditions((current) => current.filter((item) => item.id !== edition.id));
      toast.success(result.message);
      if (result.pdf_path && hasSupabaseClient()) {
        const { error } = await createClient().storage.from('epapers').remove([result.pdf_path]);
        if (error) toast.error(`एंट्री हट गई, लेकिन PDF फ़ाइल हटाई नहीं जा सकी: ${error.message}`);
      }
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">ई-पेपर प्रबंधन</h2>
          <p className="text-sm text-neutral-500">PDF अंक जोड़ें, जानकारी बदलें या हटाएँ।</p>
        </div>
        <Button onClick={() => setEdit(blank())} disabled={!configured}><Plus className="h-4 w-4" /> नया ई-पेपर</Button>
      </div>

      {!configured && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">ई-पेपर प्रबंधन शुरू करने से पहले Supabase कॉन्फ़िगर करें और migration चलाएँ।</p>}
      {editions.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">अभी कोई ई-पेपर अंक नहीं जोड़ा गया है।</div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-neutral-500">
              <tr><th className="p-3">शीर्षक</th><th>अंक</th><th>प्रकाशन तारीख़</th><th className="text-right">कार्रवाई</th></tr>
            </thead>
            <tbody className="divide-y">
              {editions.map((edition) => (
                <tr key={edition.id}>
                  <td className="p-3 font-semibold">{edition.title}</td>
                  <td>{edition.issue_number}</td>
                  <td>{formatDateHi(new Date(`${edition.published_on}T00:00:00`))}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1 pr-2">
                      <a href={edition.pdf_url} target="_blank" rel="noreferrer" aria-label="PDF देखें" className="inline-flex h-9 items-center rounded-md px-2 text-neutral-700 hover:bg-neutral-100"><Download className="h-4 w-4" /></a>
                      <Button size="sm" variant="outline" onClick={() => setEdit({ ...edition })}><Pencil className="h-4 w-4" /> संपादित करें</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(edition)} disabled={pending} aria-label="हटाएँ"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={Boolean(edit)} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogTitle>{isEditing ? 'ई-पेपर संपादित करें' : 'नया ई-पेपर अंक'}</DialogTitle>
          <DialogDescription>शीर्षक, अंक संख्या, तारीख़ और PDF फ़ाइल दर्ज करें। PDF अधिकतम 50 MB की हो सकती है।</DialogDescription>
          {edit && (
            <div className="mt-4 space-y-3">
              <div><Label htmlFor="epaper-title">शीर्षक</Label><Input id="epaper-title" value={edit.title} onChange={(event) => setEdit({ ...edit, title: event.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label htmlFor="epaper-issue">अंक संख्या</Label><Input id="epaper-issue" value={edit.issue_number} onChange={(event) => setEdit({ ...edit, issue_number: event.target.value })} /></div>
                <div><Label htmlFor="epaper-date">प्रकाशन तारीख़</Label><Input id="epaper-date" type="date" value={edit.published_on} onChange={(event) => setEdit({ ...edit, published_on: event.target.value })} /></div>
              </div>
              <div>
                <Label htmlFor="epaper-file">PDF फ़ाइल {isEditing && '(वैकल्पिक: नई फ़ाइल चुनकर बदलें)'}</Label>
                <Input
                  id="epaper-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
                      toast.error('कृपया PDF फ़ाइल चुनें।');
                      event.target.value = '';
                      return;
                    }
                    if (file.size > 50 * 1024 * 1024) {
                      toast.error('PDF फ़ाइल 50 MB से छोटी होनी चाहिए।');
                      event.target.value = '';
                      return;
                    }
                    setEdit((current) => current ? { ...current, file } : current);
                  }}
                />
                <p className="mt-1 text-xs text-neutral-500">{edit.file?.name ?? (edit.pdf_path ? 'मौजूदा PDF सुरक्षित है।' : 'एक PDF चुनें।')}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEdit(null)}>रद्द करें</Button>
                <Button onClick={save} disabled={pending}>{pending ? 'सहेजा जा रहा है…' : 'सहेजें'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

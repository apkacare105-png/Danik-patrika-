'use client';

import { useState } from 'react';
import { FilePlus2, MessageSquareWarning, PenLine } from 'lucide-react';
import type { Article, ArticleStatus, Category, Role } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';
import { blocksToMarkdown } from '@/lib/content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArticleEditor, type EditorState } from './article-editor';

const STATUS_VARIANT: Record<ArticleStatus, 'secondary' | 'warning' | 'success' | 'danger'> = {
  draft: 'secondary', pending: 'warning', published: 'success', rejected: 'danger',
};

const blank = (categories: Category[]): EditorState => ({
  id: undefined, title_hi: '', excerpt_hi: '', content_md: '', featured_image: null,
  category_id: categories[0]?.id ?? '', sub_category_id: null, status: 'draft', rejection_note: null, is_blog: false,
});

const fromArticle = (a: Article): EditorState => ({
  id: a.id, title_hi: a.title_hi, excerpt_hi: a.excerpt_hi,
  content_md: a.content_hi.md ?? blocksToMarkdown(a.content_hi.blocks),
  featured_image: a.featured_image, category_id: a.category_id ?? '', sub_category_id: a.sub_category_id,
  status: a.status, rejection_note: a.rejection_note, is_blog: Boolean(a.is_blog),
});

export function AuthorDashboard({ articles, categories, role }: { articles: Article[]; categories: Category[]; role: Role }) {
  const [list, setList] = useState(articles);
  const [current, setCurrent] = useState<EditorState>(() => blank(categories));
  const [editorKey, setEditorKey] = useState(0);
  const canWriteNews = role !== 'public_visitor';

  const open = (s: EditorState) => { setCurrent(s); setEditorKey((k) => k + 1); };

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-xl bg-white p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
        <div className="grid gap-2">{canWriteNews && <Button className="w-full" onClick={() => open({ ...blank(categories), is_blog: false })}><FilePlus2 className="h-4 w-4" /> नई ख़बर लिखें</Button>}<Button variant={canWriteNews ? 'outline' : 'default'} className="w-full" onClick={() => open({ ...blank(categories), is_blog: true })}><PenLine className="h-4 w-4" /> अपना ब्लॉग लिखें</Button></div>
        <h2 className="mb-2 mt-4 px-1 text-xs font-bold uppercase tracking-wide text-neutral-400">मेरी पोस्ट और ब्लॉग</h2>
        <ul className="space-y-1">
          {list.length === 0 && <li className="p-3 text-sm text-neutral-500">अभी कोई लेख नहीं है।</li>}
          {list.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => open(fromArticle(a))}
                className={`w-full rounded-lg border p-2.5 text-left transition hover:border-brand ${current.id === a.id ? 'border-brand bg-red-50' : 'border-transparent bg-neutral-50'}`}
              >
                <div className="flex items-start gap-2"><p className="line-clamp-2 text-sm font-semibold">{a.title_hi || 'बिना शीर्षक'}</p>{a.is_blog && <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">BLOG</span>}</div>
                <div className="mt-1.5 flex items-center justify-between">
                  <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  {a.status === 'rejected' && <MessageSquareWarning className="h-4 w-4 text-red-600" aria-label="फ़ीडबैक उपलब्ध" />}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <ArticleEditor
        key={editorKey}
        initial={current}
        categories={categories}
        onSaved={(id, s) => {
          setList((prev) => {
            const row = { ...(prev.find((p) => p.id === id) ?? ({} as Article)), id, title_hi: s.title_hi, status: s.status } as Article;
            return prev.some((p) => p.id === id) ? prev.map((p) => (p.id === id ? { ...p, ...row } : p)) : [row, ...prev];
          });
        }}
      />
    </div>
  );
}

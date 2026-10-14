'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { PortfolioProject } from '@/lib/types';
import { markdownToBlocks } from '@/lib/content';
import { ContentRenderer } from '@/components/article/content-renderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

/** प्रोजेक्ट कार्ड + मोडल प्रीव्यू (पब्लिक पेज और एडमिन दोनों में इस्तेमाल) */
export function PortfolioGrid({ projects }: { projects: PortfolioProject[] }) {
  const [sel, setSel] = useState<PortfolioProject | null>(null);
  if (!projects.length) return <p className="py-16 text-center text-neutral-500">अभी कोई प्रोजेक्ट नहीं जोड़ा गया है।</p>;
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <button key={p.id} onClick={() => setSel(p)} className="group overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg">
            <div className="aspect-[16/10] overflow-hidden bg-neutral-200">
              {p.thumbnail_url && <img src={p.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
            </div>
            <div className="p-4">
              <Badge variant="secondary">{p.project_type}</Badge>
              <h3 className="mt-2 text-lg font-bold">{p.client_name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{p.description_hi}</p>
            </div>
          </button>
        ))}
      </div>
      <ProjectModal project={sel} onClose={() => setSel(null)} />
    </>
  );
}

export function ProjectModal({ project, onClose }: { project: PortfolioProject | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(project)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {project && (
          <>
            {project.thumbnail_url && <img src={project.thumbnail_url} alt="" className="-mx-6 -mt-6 mb-4 w-[calc(100%+3rem)] max-w-none rounded-t-xl object-cover" style={{ maxHeight: 260 }} />}
            <Badge variant="secondary">{project.project_type}</Badge>
            <DialogTitle className="mt-2 text-2xl">{project.client_name}</DialogTitle>
            <DialogDescription>{project.description_hi}</DialogDescription>
            <div className="mt-4 text-[15px]">
              <ContentRenderer blocks={markdownToBlocks(project.case_study_markdown)} />
            </div>
            {project.live_url && (
              <Button asChild className="mt-2">
                <a href={project.live_url} target="_blank" rel="noopener noreferrer">लाइव साइट देखें <ExternalLink className="h-4 w-4" /></a>
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

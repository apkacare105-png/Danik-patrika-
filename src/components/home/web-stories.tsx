'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Story } from '@/lib/types';

const SLIDE_MS = 5000;

export function WebStories({ stories }: { stories: Story[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const raf = useRef<number>();

  const close = useCallback(() => { setOpenIdx(null); setSlide(0); setProgress(0); }, []);

  const next = useCallback(() => {
    if (openIdx === null) return;
    const s = stories[openIdx];
    if (slide < s.slides.length - 1) { setSlide(slide + 1); setProgress(0); }
    else if (openIdx < stories.length - 1) { setOpenIdx(openIdx + 1); setSlide(0); setProgress(0); }
    else close();
  }, [openIdx, slide, stories, close]);

  const prev = useCallback(() => {
    if (openIdx === null) return;
    if (slide > 0) { setSlide(slide - 1); setProgress(0); }
    else if (openIdx > 0) { setOpenIdx(openIdx - 1); setSlide(0); setProgress(0); }
  }, [openIdx, slide]);

  // ऑटो-प्रोग्रेस
  useEffect(() => {
    if (openIdx === null || paused) return;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last; last = t;
      setProgress((p) => {
        const np = p + dt / SLIDE_MS;
        return np >= 1 ? 1 : np;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [openIdx, slide, paused]);

  useEffect(() => { if (progress >= 1) next(); }, [progress, next]);

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [openIdx, next, prev, close]);

  const story = openIdx !== null ? stories[openIdx] : null;

  return (
    <section aria-label="वेब स्टोरीज़">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-6 w-1.5 rounded bg-brand" />
        <h2 className="text-xl font-bold">विज़ुअल स्टोरीज़</h2>
      </div>
      <div className="-mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-2 scrollbar-hide">
        {stories.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setOpenIdx(i); setSlide(0); setProgress(0); }}
            className="group relative h-52 w-32 shrink-0 snap-start overflow-hidden rounded-xl ring-2 ring-brand ring-offset-2 transition hover:-translate-y-1 sm:h-60 sm:w-36"
            aria-label={`स्टोरी देखें: ${s.title}`}
          >
            <img src={s.cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-2 text-left text-sm font-bold text-white">{s.title}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {story && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
            role="dialog" aria-modal="true" aria-label={story.title}
            onClick={close}
          >
            <div
              className="relative h-[100dvh] w-full max-w-[440px] overflow-hidden bg-black sm:h-[90vh] sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
              onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${story.id}-${slide}`}
                  src={story.slides[slide].image} alt=""
                  initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

              <div className="absolute inset-x-0 top-0 flex gap-1 p-3">
                {story.slides.map((_, i) => (
                  <div key={i} className="h-1 flex-1 overflow-hidden rounded bg-white/30">
                    <div className="h-full bg-white" style={{ width: i < slide ? '100%' : i === slide ? `${progress * 100}%` : '0%' }} />
                  </div>
                ))}
              </div>
              <div className="absolute inset-x-0 top-6 flex items-center justify-between px-4 text-white">
                <p className="font-bold drop-shadow">{story.title}</p>
                <button onClick={close} className="rounded-full bg-black/40 p-1.5" aria-label="स्टोरी बंद करें"><X className="h-5 w-5" /></button>
              </div>

              <button className="absolute inset-y-0 left-0 w-1/3" onClick={prev} aria-label="पिछली स्लाइड" />
              <button className="absolute inset-y-0 right-0 w-2/3" onClick={next} aria-label="अगली स्लाइड" />
              <ChevronLeft className="pointer-events-none absolute left-2 top-1/2 hidden h-8 w-8 text-white/60 sm:block" />
              <ChevronRight className="pointer-events-none absolute right-2 top-1/2 hidden h-8 w-8 text-white/60 sm:block" />

              <p className="pointer-events-none absolute inset-x-0 bottom-0 p-6 pb-10 font-display text-2xl leading-snug text-white drop-shadow-lg">
                {story.slides[slide].text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

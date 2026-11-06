'use client';
import { useEffect } from 'react';
import Script from 'next/script';

/** AdSense इकाई रेंडर करता है; कोड खाली हो तो प्लेसहोल्डर दिखाता है */
export function AdFrame({ html, publisherId, clickUrl, className = '' }: { html: string; publisherId: string | null; clickUrl: string | null; className?: string }) {
  const live = Boolean(html && html.includes('adsbygoogle'));
  useEffect(() => {
    if (!live) return;
    try {
      const w = window as any;
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      /* विज्ञापन लोड नहीं हुआ तो चुपचाप छोड़ दें */
    }
  }, [live, html]);

  const content = live ? (
    <>
      {publisherId && (
        <Script async strategy="afterInteractive" crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`} />
      )}
      <div className="w-full" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  ) : (
    <img src="/advertisement.png" alt="विज्ञापन" className="block h-auto w-full" />
  );

  return (
    <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50 ${className}`} aria-label="विज्ञापन">
      <span className="pointer-events-none absolute right-1 top-1 z-10 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-600 shadow-sm">विज्ञापन</span>
      {clickUrl && !live ? (
        <a href={clickUrl} target="_blank" rel="noopener noreferrer" aria-label="विज्ञापन खोलें (नई टैब)" className="flex w-full items-center justify-center">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

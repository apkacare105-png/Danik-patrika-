'use client';
import { useEffect } from 'react';
import Script from 'next/script';

/** AdSense इकाई रेंडर करता है; कोड खाली हो तो प्लेसहोल्डर दिखाता है */
export function AdFrame({ html, publisherId, className = '' }: { html: string; publisherId: string | null; className?: string }) {
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

  return (
    <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50 ${className}`} aria-label="विज्ञापन">
      <span className="absolute left-2 top-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">विज्ञापन</span>
      {live ? (
        <>
          {publisherId && (
            <Script async strategy="afterInteractive" crossOrigin="anonymous"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`} />
          )}
          <div className="w-full" dangerouslySetInnerHTML={{ __html: html }} />
        </>
      ) : (
        <span className="text-sm text-neutral-400">विज्ञापन स्थान</span>
      )}
    </div>
  );
}

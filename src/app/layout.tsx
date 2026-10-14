import type { Metadata } from 'next';
import { Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from 'next/font/google';
import { Toaster } from 'sonner';
import { getSiteSettings } from '@/lib/data';
import { hexToRgb } from '@/lib/utils';
import './globals.css';

const body = Noto_Sans_Devanagari({ subsets: ['devanagari', 'latin'], variable: '--font-body', display: 'swap' });
const display = Tiro_Devanagari_Hindi({ subsets: ['devanagari', 'latin'], weight: '400', variable: '--font-display', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: s.seo.title || s.site_name, template: `%s | ${s.site_name}` },
    description: s.seo.description,
    keywords: s.seo.keywords,
    icons: s.favicon_url ? { icon: s.favicon_url } : undefined,
    openGraph: { type: 'website', locale: 'hi_IN', siteName: s.site_name, images: s.seo.og_image ? [s.seo.og_image] : undefined },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings();
  const vars = `:root{--brand-rgb:${hexToRgb(s.theme.accent)};--ink-rgb:${hexToRgb(s.theme.ink, '17 24 39')}}`;
  return (
    <html lang="hi" className={`${body.variable} ${display.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: vars }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}

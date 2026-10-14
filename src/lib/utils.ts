import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const MONTHS_SHORT = ['जन॰', 'फ़र॰', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुला॰', 'अग॰', 'सित॰', 'अक्टू॰', 'नव॰', 'दिस॰'];
const istParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
});

/**
 * IST में हिंदी तारीख़। महीनों के नाम अपनी तालिका से लिए जाते हैं, क्योंकि Node और
 * ब्राउज़र का ICU अलग वर्तनी देता है ("अक्टूबर"/"अक्तूबर") जिससे hydration मिसमैच होता है।
 */
export function formatDateHi(d: string | Date, opts: { short?: boolean; time?: boolean } = {}) {
  const get: Record<string, string> = {};
  for (const p of istParts.formatToParts(new Date(d))) get[p.type] = p.value;
  const m = (opts.short ? MONTHS_SHORT : MONTHS)[Number(get.month) - 1];
  const date = opts.short ? `${get.day} ${m}` : `${get.day} ${m} ${get.year}`;
  return opts.time ? `${date}, ${get.hour.padStart(2, '0')}:${get.minute.padStart(2, '0')}` : date;
}

export function timeAgoHi(d: string | Date) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'अभी अभी';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} मिनट पहले`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} घंटे पहले`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} दिन पहले`;
  return formatDateHi(d);
}

export const HI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
export const toHiDigits = (n: number | string) => String(n).replace(/\d/g, (d) => HI_DIGITS[+d]);

export function hexToRgb(hex: string, fallback = '226 35 26') {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export const compactViews = (n: number) =>
  n >= 100000 ? `${(n / 100000).toFixed(1)} लाख` : n >= 1000 ? `${(n / 1000).toFixed(1)} हज़ार` : String(n);

import type { Block } from './types';

/** सरल मार्कडाउन -> Rich JSON ब्लॉक्स (## शीर्षक, > उद्धरण, - सूची, **बोल्ड**) */
export function markdownToBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of md.split(/\n{2,}/)) {
    const t = chunk.trim();
    if (!t) continue;
    if (t.startsWith('## ')) blocks.push({ type: 'h2', text: t.slice(3).trim() });
    else if (t.startsWith('> ')) blocks.push({ type: 'quote', text: t.replace(/^>\s?/gm, '').trim() });
    else if (/^[-*] /.test(t)) blocks.push({ type: 'ul', items: t.split('\n').map((l) => l.replace(/^[-*]\s+/, '').trim()).filter(Boolean) });
    else blocks.push({ type: 'p', text: t.replace(/\n/g, ' ') });
  }
  return blocks;
}

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'h2') return `## ${b.text}`;
      if (b.type === 'quote') return `> ${b.text}`;
      if (b.type === 'ul') return (b.items ?? []).map((i) => `- ${i}`).join('\n');
      return b.text ?? '';
    })
    .join('\n\n');
}

export const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
export const readingMinutes = (words: number) => Math.max(1, Math.round(words / 180));

export function plainText(blocks: Block[]) {
  return blocks.map((b) => (b.type === 'ul' ? (b.items ?? []).join('। ') : b.text ?? '').replace(/\*\*/g, '')).join('। ');
}

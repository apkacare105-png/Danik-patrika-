import { getAdSlot } from '@/lib/data';
import type { AdSlotType } from '@/lib/types';
import { AdFrame } from './ad-frame';

const SIZE: Record<AdSlotType, string> = {
  header: 'min-h-[90px]',
  sidebar_sticky: 'min-h-[250px]',
  in_article: 'min-h-[120px]',
  footer: 'min-h-[90px]',
};

/** <AdSlot placement="in_article" /> — Admin में सक्षम होने पर ही दिखता है */
export async function AdSlot({ placement, className = '' }: { placement: AdSlotType; className?: string }) {
  const slot = await getAdSlot(placement);
  if (!slot) return null;
  return (
    <AdFrame
      html={slot.ad_code}
      publisherId={slot.publisher_id}
      className={`${SIZE[placement]} ${className}`}
    />
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'मौसम' };

export default function WeatherPage() {
  return (
    <div className="rounded-xl border bg-white px-6 py-16 text-center shadow-sm">
      <h1 className="font-display text-4xl">मौसम</h1>
      <p className="mt-3 text-neutral-600">मौसम की जानकारी जल्द उपलब्ध होगी।</p>
    </div>
  );
}

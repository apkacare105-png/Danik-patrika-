import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-display text-8xl text-brand">४०४</p>
      <h1 className="text-2xl font-bold">यह पेज नहीं मिला</h1>
      <p className="text-neutral-600">शायद लिंक बदल गया है या ख़बर हटा दी गई है।</p>
      <Link href="/" className="rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:brightness-90">होम पर लौटें</Link>
    </div>
  );
}

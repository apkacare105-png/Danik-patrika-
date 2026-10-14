'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribeNewsletter } from '@/actions/public';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await subscribeNewsletter(email);
      if (r.ok) { setDone(true); toast.success(r.message); } else toast.error(r.message);
    });
  };

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-brand to-neutral-900 p-5 text-white shadow-lg">
      <div className="mb-3 flex items-center gap-2">
        <Mail className="h-5 w-5" />
        <h2 className="text-lg font-bold">सब्सक्राइब करें</h2>
      </div>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 py-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-300" />
            <p className="text-sm font-semibold">धन्यवाद! हर सुबह की बड़ी ख़बरें अब सीधे आपके इनबॉक्स में।</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-sm text-white/85">हर सुबह की 5 सबसे बड़ी ख़बरें सीधे अपने ईमेल पर पाएँ।</p>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="आपका ईमेल पता" className="border-0 text-neutral-900" aria-label="ईमेल पता" />
            <Button type="submit" variant="dark" className="w-full" disabled={pending}>{pending ? 'भेजा जा रहा है…' : 'सब्सक्राइब करें'}</Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

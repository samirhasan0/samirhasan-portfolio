'use client';

import { AnimatePresence, animate, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { lenisInstance } from './SmoothScroll';
import { EASE } from './ui';

type Props = { onEnter: (withAudio: boolean) => void };

export default function IntroLoader({ onEnter }: Props) {
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(false);
  const [pct, setPct] = useState(0);
  const ready = pct >= 100;

  useEffect(() => {
    setMounted(true);
    // Hold the page until the visitor chooses how to enter
    document.documentElement.dataset.locked = '1';
    document.documentElement.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    const ctrl = animate(0, 100, {
      delay: 0.5,
      duration: 2.2,
      ease: [0.45, 0, 0.2, 1],
      onUpdate: (v) => setPct(Math.round(v)),
    });
    return () => ctrl.stop();
  }, []);

  const enter = (withAudio: boolean) => {
    onEnter(withAudio);
    setDone(true);
    delete document.documentElement.dataset.locked;
    document.documentElement.style.overflow = '';
    lenisInstance?.start();
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-bg"
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 1.4, ease: EASE }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(20,70,160,0.35),transparent_70%)]" />

          {/* Slow-turning outline rings */}
          <motion.div
            className="pointer-events-none absolute h-[120vmin] w-[120vmin] rounded-full border border-line"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            transition={{ opacity: { duration: 2 }, scale: { duration: 2.4, ease: EASE }, rotate: { duration: 120, repeat: Infinity, ease: 'linear' } }}
          />
          <motion.div
            className="pointer-events-none absolute h-[78vmin] w-[78vmin] rounded-full border border-line-2"
            style={{ borderStyle: 'dashed' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.7, scale: 1, rotate: -360 }}
            transition={{ opacity: { duration: 2 }, scale: { duration: 2.4, ease: EASE }, rotate: { duration: 160, repeat: Infinity, ease: 'linear' } }}
          />

          <div className="relative flex flex-col items-center text-center">
            <div className="overflow-hidden">
              <motion.h1
                className="display glow-text text-[clamp(40px,7vw,92px)] tracking-[0.04em]"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
              >
                Samir Hasan
              </motion.h1>
            </div>
            <motion.p
              className="label mt-4 text-ink-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              Founder & CEO · Luminar Technology
            </motion.p>

            <div className="mt-12 h-[132px] sm:h-[92px]">
              <AnimatePresence mode="wait">
                {!ready ? (
                  <motion.div key="load" className="flex w-[220px] flex-col items-center gap-3" exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4 }}>
                    <div className="flex w-full justify-between">
                      <span className="label">Loading</span>
                      <span className="label tabular-nums text-ink">{String(pct).padStart(3, '0')}</span>
                    </div>
                    <div className="h-px w-full bg-line-2">
                      <div className="h-full bg-accent shadow-[0_0_12px_rgba(140,203,255,0.8)]" style={{ width: `${pct}%` }} />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="enter"
                    className="flex flex-col items-center gap-4 sm:flex-row"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE }}
                  >
                    <button onClick={() => enter(true)} className="enter-btn enter-btn-primary" autoFocus>
                      <span className="eq eq-live" aria-hidden><i /><i /><i /><i /></span>
                      Enter with sound
                    </button>
                    <button onClick={() => enter(false)} className="enter-btn enter-btn-ghost">
                      <span className="eq eq-mute" aria-hidden><i /><i /><i /><i /></span>
                      Enter without sound
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.p
            className="label absolute bottom-8 px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            Best experienced with sound · Dhaka, Bangladesh
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

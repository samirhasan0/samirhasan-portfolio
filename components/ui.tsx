'use client';

import { motion, useMotionValueEvent, useScroll, type MotionValue } from 'framer-motion';
import { useEffect, useState, type ReactNode, type RefObject } from 'react';

export const EASE = [0.16, 1, 0.3, 1] as const;

/** Masked line reveal — each line slides up from behind a clip. */
export function Lines({
  lines,
  className,
  delay = 0,
  stagger = 0.08,
  inView = true,
}: {
  lines: ReactNode[];
  className?: string;
  delay?: number;
  stagger?: number;
  inView?: boolean;
}) {
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
          <motion.span
            className="block"
            initial={{ y: '105%' }}
            {...(inView
              ? { whileInView: { y: '0%' }, viewport: { once: true, margin: '-10% 0px' } }
              : { animate: { y: '0%' } })}
            transition={{ duration: 1.1, ease: EASE, delay: delay + i * stagger }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** "/03 Principles" chapter marker. */
export function ChapterLabel({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="label text-accent">/{String(n).padStart(2, '0')}</span>
      <span className="h-px w-8 bg-line-3" />
      <span className="label text-ink-2">{children}</span>
    </div>
  );
}

/** 0→1 progress through a tall chapter while its sticky stage is pinned. */
export function useChapterProgress(ref: RefObject<HTMLElement>) {
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  return scrollYProgress;
}

/** Which of `n` beats the chapter is on. */
export function useBeat(progress: MotionValue<number>, n: number) {
  const [beat, setBeat] = useState(0);
  useMotionValueEvent(progress, 'change', (v) => {
    const b = Math.min(n - 1, Math.max(0, Math.floor(v * n)));
    setBeat((prev) => (prev === b ? prev : b));
  });
  return beat;
}

/** Row of ticks showing the active beat. */
export function BeatTicks({ n, active }: { n: number; active: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className={`h-px transition-all duration-700 ease-expo ${i === active ? 'w-10 bg-accent shadow-[0_0_8px_rgba(140,203,255,0.9)]' : 'w-5 bg-line-3'}`}
        />
      ))}
    </div>
  );
}

export function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M1.5 7h11M8 2.5L12.5 7 8 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowUpRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 11L11 3M11 3H4.5M11 3v6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Live clock for Dhaka. Renders a stable placeholder on the server. */
export function DhakaTime({ className }: { className?: string }) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, []);
  return <span className={className}>{time ?? '--:--'} GMT+6</span>;
}

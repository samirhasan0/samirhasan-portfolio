'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { BeatTicks, ChapterLabel, EASE, useBeat, useChapterProgress } from './ui';

const horizons = [
  {
    window: '2026 – 2028',
    title: 'The Operating Layer',
    body: 'Luminar/OS ships to a thousand teams. Aether becomes the default inference substrate for frontier workloads. The portfolio companies compound.',
  },
  {
    window: '2028 – 2032',
    title: 'Ambient Intelligence',
    body: 'Compute dissolves into context. The Luminar stack becomes connective tissue between human intent and machine execution — invisible, reliable, fast.',
  },
  {
    window: '2032 – ∞',
    title: 'New Civic Infrastructure',
    body: 'Education, governance, and capital evolve around the assumption of universal machine intelligence. The builders who built the rails will shape what runs on them.',
  },
];

const BEATS = horizons.length + 2; // intro, three horizons, closing quote

export default function Vision() {
  const ref = useRef<HTMLElement>(null);
  const p = useChapterProgress(ref);
  const beat = useBeat(p, BEATS);

  let content: React.ReactNode;
  if (beat === 0) {
    content = (
      <h2 className="display glow-text text-[clamp(28px,9.4vw,40px)] md:text-[clamp(40px,5.2vw,96px)] short:text-[28px]">
        Building the
        <br />
        <span className="hl">infrastructure</span>
        <br />
        of what comes next.
      </h2>
    );
  } else if (beat <= horizons.length) {
    const h = horizons[beat - 1];
    content = (
      <div>
        <div className="flex items-end gap-5">
          <span className="display text-[clamp(60px,6.6vw,100px)] leading-[0.8] text-accent glow-text short:text-[44px]">H{beat}</span>
          <span className="flex flex-col gap-1 pb-1">
            <span className="label">H {String(beat).padStart(2, '0')}</span>
            <span className="label text-ink">{h.window}</span>
          </span>
        </div>
        <h2 className="display glow-text mt-6 text-[clamp(25px,8.4vw,36px)] md:text-[clamp(36px,4.4vw,80px)] short:mt-4 short:text-[24px]">{h.title}</h2>
        <p className="mt-6 max-w-[540px] text-[16px] font-light leading-[1.65] text-ink md:text-[17px] short:mt-3 short:text-[14px] short:leading-[1.55]">{h.body}</p>
      </div>
    );
  } else {
    content = (
      <figure className="max-w-[min(580px,40vw)] max-md:max-w-none">
        <p className="label mb-6 text-accent short:mb-3">Founder letter · 2025</p>
        <blockquote className="text-[clamp(18px,5.4vw,21px)] font-normal leading-[1.42] md:text-[clamp(21px,2vw,30px)] short:text-[16px] text-ink [text-shadow:0_1px_2px_rgba(0,3,11,0.9),0_0_22px_rgba(0,3,11,0.85)]">
          “The next great companies won’t be built by those chasing the present. They’ll be built by those
          who quietly assemble the <span className="hl">instruments of the future</span> —
          decades before the rest of the world realizes they were the prize.”
        </blockquote>
        <figcaption className="mt-7 flex items-center gap-3 short:mt-4">
          <span className="h-px w-8 bg-line-3" /> <span className="display text-[16px] tracking-[0.14em] text-ink">Samir Hasan</span>
        </figcaption>
      </figure>
    );
  }

  return (
    <section id="vision" ref={ref} className="relative h-[480vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end px-[var(--gutter)] pb-16 pt-28 md:justify-center md:pb-0 short:pb-8 short:pt-20">
        <div className="max-w-[820px] md:max-w-[min(820px,48vw)]">
          <div className="flex flex-wrap items-center gap-6">
            <ChapterLabel n={5}>Vision</ChapterLabel>
            <BeatTicks n={BEATS} active={beat} />
          </div>
          <div className="relative mt-8 min-h-[340px] short:mt-5 short:min-h-[250px] squat:min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={beat}
                initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

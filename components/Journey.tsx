'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { ChapterLabel, EASE, useBeat, useChapterProgress } from './ui';

/* From samirhasan.com — told in order, so the company logos build up in the 3D scene. */
const chapters = [
  { from: '2021', to: '2025', period: 'Aug 2021 — Mar 2025', company: 'Levant IT Solution', role: 'Co-Founder & Managing Director', type: 'Full time' },
  { from: '2023', to: 'Now', period: 'Nov 2023 — Present', company: 'Autoworx Tech Solution', role: 'COO · The world’s first agentic AI-based platform', type: 'Full time' },
  { from: '2025', to: 'Now', period: 'Mar 2025 — Present', company: 'Luminar Technology', role: 'CEO', type: 'Full time' },
];

export default function Journey() {
  const ref = useRef<HTMLElement>(null);
  const p = useChapterProgress(ref);
  const beat = useBeat(p, chapters.length);
  const c = chapters[beat];

  return (
    <section id="journey" ref={ref} className="relative h-[330vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end px-[var(--gutter)] pb-16 pt-28 md:justify-center md:pb-0 short:pb-8 short:pt-20">
        <div className="max-w-[760px] md:max-w-[min(760px,54vw)]">
          <ChapterLabel n={4}>Journey</ChapterLabel>
          <h2 className="display glow-text mt-5 text-[clamp(28px,3.3vw,50px)] font-semibold short:mt-3 short:text-[22px] squat:hidden">
            Five years.
            <br />
            <span className="hl">Three chapters.</span>
          </h2>

          <div className="relative mt-7 min-h-[214px] md:mt-9 md:min-h-[270px] short:mt-5 short:min-h-[176px] squat:min-h-[150px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={beat}
                initial={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 40, filter: 'blur(10px)' }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <div className="display flex items-baseline gap-4 text-[clamp(56px,8vw,128px)] font-semibold leading-[0.85] short:text-[44px]">
                  <span className="hl">{c.from}</span>
                  <span className="text-[0.32em] font-medium text-ink-3">→ {c.to}</span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 short:mt-3">
                  <span className="label text-ink-2">{c.period}</span>
                  <span className="label border border-accent/40 px-2 py-0.5 text-accent">{c.type}</span>
                </div>
                <h3 className="display mt-4 text-[clamp(22px,7vw,26px)] font-semibold md:text-[clamp(26px,3.2vw,48px)] short:mt-3 short:text-[22px]">
                  {c.company.startsWith('Auto') ? (
                    <>
                      <span className="text-accent [text-shadow:0_0_28px_rgba(140,203,255,0.75)]">Auto</span>
                      {c.company.slice(4)}
                    </>
                  ) : (
                    c.company
                  )}
                </h3>
                <p className="mt-2 text-[15px] text-ink-2">{c.role}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Timeline */}
          <div className="relative mt-10 max-w-[520px] short:mt-5">
            <div className="absolute left-0 right-0 top-[5px] h-px bg-line-2" />
            <motion.div className="absolute left-0 right-0 top-[5px] h-px origin-left bg-accent" style={{ scaleX: p }} />
            <div className="relative flex justify-between">
              {chapters.map((ch, i) => (
                <div key={ch.company} className="flex flex-col items-start gap-3">
                  <span
                    className={`h-[11px] w-[11px] rotate-45 border transition-all duration-500 ${
                      i <= beat ? 'border-accent bg-accent shadow-[0_0_12px_rgba(140,203,255,0.9)]' : 'border-line-3 bg-bg'
                    }`}
                  />
                  <span className={`label transition-colors ${i === beat ? 'text-ink' : ''}`}>{ch.period.split(' — ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

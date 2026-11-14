'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { BeatTicks, ChapterLabel, EASE, useBeat, useChapterProgress } from './ui';

const principles = [
  {
    n: '01',
    tag: 'Craft',
    head: 'Taste is a technology.',
    body: 'How a product feels is not a layer you add at the end. It is a constraint you design to from day one — and the teams that internalize this ship better products, faster.',
  },
  {
    n: '02',
    tag: 'Discipline',
    head: 'Restraint compounds.',
    body: 'Every feature you don’t ship is a decision you didn’t reverse later. The best products I admire are distinguished not by what they do, but by what they refuse to do.',
  },
  {
    n: '03',
    tag: 'Velocity',
    head: 'Speed is a moral act.',
    body: 'Moving fast on the right things is a form of respect — for your team’s time, your users’ lives, and the window of relevance that opens only briefly for any idea.',
  },
  {
    n: '04',
    tag: 'Vision',
    head: 'Intelligence is infrastructure.',
    body: 'We are in the process of rebuilding every layer of software on top of thinking machines. The founders who treat intelligence as infrastructure — not a feature — will architect what survives.',
  },
];

export default function Principles() {
  const ref = useRef<HTMLElement>(null);
  const p = useChapterProgress(ref);
  const beat = useBeat(p, principles.length);
  const cur = principles[beat];

  return (
    <section id="principles" ref={ref} className="relative h-[420vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end px-[var(--gutter)] pb-14 pt-28 md:justify-center md:pb-0 short:pb-6 short:pt-20">
        <div className="max-w-[720px] md:max-w-[min(720px,54vw)]">
          <div className="flex flex-wrap items-center gap-6">
            <ChapterLabel n={3}>Conviction</ChapterLabel>
            <BeatTicks n={principles.length} active={beat} />
          </div>
          <h2 className="display glow-text mt-5 text-[clamp(28px,3.3vw,50px)] short:mt-3 short:text-[22px] squat:hidden">
            What I believe
            <br />
            <span className="hl">about building.</span>
          </h2>
          <p className="mt-4 max-w-[520px] text-[14px] font-light leading-[1.65] text-ink-2 md:text-[15px] short:hidden">
            These aren’t brand values. They’re working principles that have been tested against real decisions —
            hiring, shipping, killing, and rebuilding.
          </p>

          <div className="relative mt-7 min-h-[300px] md:mt-9 md:min-h-[330px] short:mt-5 short:min-h-[236px] squat:min-h-[190px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={beat}
                initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <div className="flex items-end gap-5">
                  <span
                    className="display glow-text text-[clamp(64px,7.4vw,112px)] leading-[0.8] text-accent short:text-[44px]"
                  >
                    {cur.n}
                  </span>
                  <span className="label pb-1 text-accent">
                    {cur.tag}
                  </span>
                </div>
                <h3 className="display glow-text mt-5 text-[clamp(25px,8.4vw,32px)] md:text-[clamp(32px,4.2vw,64px)] short:mt-3 short:text-[24px]">{cur.head}</h3>
                <p className="mt-5 max-w-[540px] text-[16px] font-light leading-[1.65] text-ink md:text-[17px] short:mt-3 short:text-[14px] short:leading-[1.55]">{cur.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

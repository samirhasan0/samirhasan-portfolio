'use client';

import { motion } from 'framer-motion';
import { ChapterLabel, EASE } from './ui';

const principles = [
  {
    n: '01',
    tag: 'Craft',
    head: 'Taste is a technology.',
    body: 'How a product feels is designed in from day one.',
  },
  {
    n: '02',
    tag: 'Discipline',
    head: 'Restraint compounds.',
    body: 'The best products are defined by what they refuse to do.',
  },
  {
    n: '03',
    tag: 'Velocity',
    head: 'Speed is a moral act.',
    body: 'Moving fast on the right things respects everyone’s time.',
  },
  {
    n: '04',
    tag: 'Vision',
    head: 'Intelligence is infrastructure.',
    body: 'Thinking machines are the foundation, not a feature.',
  },
];

export default function Principles() {
  return (
    <section id="principles" className="relative h-[190vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end px-[var(--gutter)] pb-14 pt-28 md:justify-center md:pb-0 short:pb-6 short:pt-20">
        <div className="max-w-[760px] md:max-w-[min(760px,54vw)]">
          <ChapterLabel n={3}>Conviction</ChapterLabel>
          <h2 className="display glow-text mt-5 text-[clamp(28px,3.3vw,50px)] short:mt-3 short:text-[22px] squat:hidden">
            What I believe
            <br />
            <span className="hl">about building.</span>
          </h2>

          {/* All four principles on one screen */}
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 md:mt-10 md:gap-x-10 md:gap-y-9 short:mt-5 short:gap-y-5">
            {principles.map((pr, i) => (
              <motion.div
                key={pr.n}
                className="border-t border-line-2 pt-4 short:pt-3"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.9, ease: EASE, delay: i * 0.08 }}
              >
                <div className="flex items-baseline gap-3">
                  <span className="display text-[clamp(22px,2.2vw,32px)] leading-none text-accent">{pr.n}</span>
                  <span className="label text-accent">{pr.tag}</span>
                </div>
                <h3 className="display mt-3 text-[clamp(16px,4.6vw,20px)] leading-[1.05] md:text-[clamp(20px,1.9vw,28px)] short:mt-2 short:text-[15px]">{pr.head}</h3>
                <p className="mt-2.5 text-[13px] font-light leading-[1.5] text-ink-2 md:text-[15px] short:mt-1.5 short:text-[12px]">{pr.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

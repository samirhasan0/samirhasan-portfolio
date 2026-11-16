'use client';

import { motion } from 'framer-motion';
import { ChapterLabel, EASE } from './ui';

export default function Vision() {
  return (
    <section id="vision" className="relative h-[180vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end px-[var(--gutter)] pb-16 pt-28 md:justify-center md:pb-0 short:pb-8 short:pt-20">
        <div className="max-w-[820px] md:max-w-[min(820px,48vw)]">
          <ChapterLabel n={5}>Vision</ChapterLabel>
          <motion.figure
            className="mt-8 md:max-w-[min(620px,44vw)] short:mt-5"
            initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1, ease: EASE }}
          >
            <blockquote className="text-[clamp(19px,5.6vw,23px)] font-normal leading-[1.42] text-ink [text-shadow:0_1px_2px_rgba(0,3,11,0.9),0_0_22px_rgba(0,3,11,0.85)] md:text-[clamp(22px,2.2vw,34px)] short:text-[16px]">
              “The next great companies won’t be built by those chasing the present. They’ll be built by those
              who quietly assemble the <span className="hl">instruments of the future</span> —
              decades before the rest of the world realizes they were the prize.”
            </blockquote>
            <figcaption className="mt-7 flex items-center gap-3 short:mt-4">
              <span className="h-px w-8 bg-line-3" /> <span className="display text-[16px] tracking-[0.14em] text-ink">Samir Hasan</span>
            </figcaption>
          </motion.figure>
        </div>
      </div>
    </section>
  );
}

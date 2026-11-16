'use client';

import { motion, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight, EASE, Lines, useChapterProgress } from './ui';

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const p = useChapterProgress(ref);
  const opacity = useTransform(p, [0, 0.45], [1, 0]);
  const y = useTransform(p, [0, 0.45], ['0px', '-60px']);
  const blur = useTransform(p, [0, 0.45], ['blur(0px)', 'blur(8px)']);

  return (
    <section id="top" ref={ref} className="relative h-[190vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end px-[var(--gutter)] pb-10 md:pb-12">
        <motion.div style={{ opacity, y, filter: blur }} className="flex items-end justify-between gap-8">
          <div>
            {/* Name — the page title, set like a signature */}
            <h1 className="display text-[clamp(18px,1.9vw,28px)] tracking-[0.22em] text-ink">
              <Lines inView={false} delay={0.25} lines={['Samir Hasan']} />
            </h1>

            {/* 1st highlight */}
            <p className="display glow-text mt-4 text-[clamp(30px,4.4vw,68px)]">
              <Lines
                inView={false}
                delay={0.4}
                stagger={0.12}
                lines={['Founder & CEO —', <span key="b" className="text-accent">Luminar Technology</span>]}
              />
            </p>

            {/* 2nd highlight */}
            <motion.p
              className="display mt-5 flex items-center gap-4 text-[clamp(15px,1.55vw,22px)] tracking-[0.1em] text-accent-2"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 1, ease: EASE }}
            >
              <span className="h-px w-10 bg-accent shadow-[0_0_10px_rgba(140,203,255,0.9)]" aria-hidden />
              I build web, mobile & AI products for companies
            </motion.p>

            {/* Straight to the contact section */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.15, duration: 1, ease: EASE }}
            >
              <a href="#contact" className="enter-btn enter-btn-primary !h-[52px] !min-w-0 !px-7">
                Contact me <ArrowUpRight size={12} />
              </a>
            </motion.div>
          </div>

          <motion.a
            href="#manifesto"
            className="hidden shrink-0 items-center gap-4 md:flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1, ease: EASE }}
          >
            <span className="label text-right leading-[1.6] text-ink-2">
              Scroll to
              <br />
              begin
            </span>
            <span className="relative h-12 w-px overflow-hidden bg-line-2">
              <motion.span
                className="absolute inset-x-0 top-0 h-1/2 bg-accent"
                animate={{ y: ['-100%', '200%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

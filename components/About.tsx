'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const traits = [
  { label: 'Based in', value: 'Dhaka, BD' },
  { label: 'Currently', value: 'Luminar Technology' },
  { label: 'Founded', value: '2020' },
  { label: 'Focus', value: 'AI · Compute · Craft' },
];

const fade = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.85, ease: [0.2, 0.6, 0.2, 1] },
  }),
};

export default function About() {
  return (
    <section id="about" className="relative py-28 md:py-44 overflow-hidden">
      {/* Section ambient */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[55vh] w-[55vh] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-site px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left — identity column */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="lg:col-span-4 flex flex-col gap-8"
          >
            <motion.div variants={fade} custom={0} className="eyebrow">
              00 — About
            </motion.div>

            {/* Portrait with orbital ring */}
            <motion.div
              variants={fade}
              custom={1}
              className="relative mx-auto lg:mx-0"
              style={{ maxWidth: '280px' }}
            >
              {/* Outer orbit ring */}
              <div
                className="absolute inset-[-18px] rounded-full border border-accent/10 animate-spin-slow pointer-events-none"
                style={{ borderStyle: 'dashed' }}
              />
              {/* Inner orbit ring */}
              <div className="absolute inset-[-8px] rounded-full pointer-events-none animate-spin-reverse">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0%, transparent 75%, rgba(37,99,235,0.5) 85%, transparent 100%)',
                  }}
                />
              </div>

              {/* Portrait box */}
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-line group">
                <div className="absolute inset-0 bg-gradient-to-br from-bg-lift via-bg-alt to-bg" />

                {/* Photo */}
                <div className="absolute inset-0">
                  <Image
                    src="/samir.jpg"
                    alt="Samir Hasan"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                </div>

                {/* Frame glows */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />

                {/* Scan line on hover */}
                <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="scan-line" />
                </div>

                {/* Corner accent */}
                <div
                  className="absolute top-3 right-3 h-2 w-2 rounded-full bg-accent/60 group-hover:bg-accent transition-colors duration-300"
                  style={{ boxShadow: '0 0 8px rgba(37,99,235,0.6)' }}
                />
              </div>

              {/* Orbit dot */}
              <div
                className="absolute inset-[-18px] pointer-events-none"
                style={{ animation: 'orbit-cw 12s linear infinite' }}
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-accent"
                  style={{ boxShadow: '0 0 10px rgba(37,99,235,0.9)' }}
                />
              </div>
            </motion.div>

            {/* Quick facts */}
            <motion.div
              variants={fade}
              custom={2}
              className="glass rounded-2xl p-5 space-y-0 divide-y divide-line"
            >
              {traits.map((t, i) => (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.4 + i * 0.07,
                    duration: 0.6,
                    ease: [0.2, 0.6, 0.2, 1],
                  }}
                  className="flex items-center justify-between py-3.5 group"
                >
                  <span className="text-[11px] font-mono text-ink-3 tracking-widest uppercase group-hover:text-ink-2 transition-colors">
                    {t.label}
                  </span>
                  <span className="text-[13px] text-ink font-medium group-hover:text-white transition-colors">
                    {t.value}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — narrative */}
          <div className="lg:col-span-7 lg:col-start-6 space-y-10">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, ease: [0.2, 0.6, 0.2, 1] }}
              className="font-display leading-[1.05] tracking-ultra text-white"
              style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}
            >
              Builder first.{' '}
              <span className="italic text-gradient">Founder second.</span>
            </motion.h2>

            {/* Metrics row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12, duration: 0.8, ease: [0.2, 0.6, 0.2, 1] }}
              className="flex items-center gap-0 -mt-2"
            >
              {[
                { val: '4+', label: 'Companies', delay: 0 },
                { val: '2020', label: 'Since', delay: 0.07 },
                { val: '100+', label: 'Shipped', delay: 0.14 },
              ].map((m, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + m.delay, duration: 0.7, ease: [0.2, 0.6, 0.2, 1] }}
                  className="flex items-center"
                >
                  <span className="flex flex-col px-5 first:pl-0">
                    <span
                      className="stat-num"
                      style={{ fontSize: 'clamp(28px, 3vw, 38px)' }}
                    >
                      {m.val}
                    </span>
                    <span className="text-[10px] font-mono tracking-[0.20em] uppercase text-ink-3 mt-1">
                      {m.label}
                    </span>
                  </span>
                  {i < 2 && (
                    <span
                      className="h-7 w-px flex-shrink-0"
                      style={{ background: 'var(--border-md)' }}
                    />
                  )}
                </motion.span>
              ))}
            </motion.div>

            <div className="space-y-6">
              {[
                `I grew up believing that the best technology is invisible — it disappears into the fabric of how you think, work, and move through the world. That belief is the thread running through everything I've built.`,
                `At 19, I started my first company from a small studio in Dhaka. I was obsessed with two things: how good software could feel, and how few people were building with that as the primary constraint. Most tools were made to be functional. I wanted to make something beautiful.`,
                `Today, Luminar Technology is a growing family of ventures I founded or co-created — each one an experiment in what a technology company can be when it takes taste as seriously as throughput. We build compute infrastructure, autonomous systems, applied AI, and the design language that holds it together.`,
                `I believe we're at the beginning of the most interesting decade in technology. The teams that will matter are the ones building quietly, with conviction, at a level of craft the market hasn't yet learned to demand.`,
              ].map((para, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{
                    delay: i * 0.09,
                    duration: 0.8,
                    ease: [0.2, 0.6, 0.2, 1],
                  }}
                  className="text-[16px] sm:text-[17px] text-ink-2 leading-[1.8]"
                  style={{ fontWeight: 300 }}
                >
                  {para}
                </motion.p>
              ))}
            </div>

            {/* Quote */}
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: 0.3, duration: 0.9 }}
              className="relative border-l-2 border-accent/60 pl-6 py-2 group"
            >
              {/* Glow on border */}
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-accent/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: '0 0 12px rgba(37,99,235,0.6)' }}
              />
              <p className="font-display italic text-[22px] sm:text-[26px] text-white/85 leading-[1.4] tracking-tight">
                &ldquo;The constraint is never capability. It&apos;s always
                conviction.&rdquo;
              </p>
              <span className="mt-3 block text-[12px] font-mono tracking-wide text-ink-3">
                — Personal journal, 2023
              </span>
            </motion.blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}

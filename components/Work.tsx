'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

type Project = {
  id: string;
  year: string;
  name: string;
  role: string;
  category: string;
  one: string;
  highlights: string[];
  stage: string;
  url?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
};

const projects: Project[] = [
  {
    id: 'luminar-technology',
    year: '2025',
    name: 'Luminar Technology',
    role: 'CEO & Founder',
    category: 'Technology',
    one: 'A technology holding company building compute infrastructure, autonomous systems, and applied AI — unified by a shared design language and operating thesis.',
    highlights: ['CEO & Founder', 'Full Time · Mar 2025 – Present', 'luminartechnology.com'],
    stage: 'Running',
    url: 'https://luminartechnology.com',
  },
  {
    id: 'autoworx',
    year: '2025',
    name: 'AutoWorx',
    role: 'Project Manager',
    category: 'ERP / CRM',
    one: 'A complete ERP and CRM solution built specifically for the automobile industry — covering inventory, service management, customer relationships, invoicing, and workshop operations in one unified platform.',
    highlights: ['Project Manager', 'Full-Stack Platform', 'autoworx.tech'],
    stage: 'Live',
    url: 'https://autoworx.tech/',
  },
  {
    id: 'prenda-solution',
    year: '2024',
    name: 'Prenda Solution',
    role: 'Product Lead',
    category: 'Software',
    one: 'A software solutions company delivering innovative digital products and services to clients across industries.',
    highlights: ['Product Lead', 'Product & Engineering', 'Live'],
    stage: 'Live',
    url: 'https://prendasolution.com',
  },
  {
    id: 'banglareels',
    year: '2026',
    name: 'BanglaReels Web',
    role: 'Product Lead',
    category: 'App & Web',
    one: 'A short-video platform for Bangla-speaking audiences — available on both mobile app and web, built to celebrate local creators and culture.',
    highlights: ['Product Lead', 'App & Web Platform', 'banglareels.com'],
    stage: 'Live',
    url: 'https://banglareels.com',
  },
  {
    id: 'banglareels-app',
    year: '2026',
    name: 'BanglaReels App',
    role: 'Product Lead',
    category: 'Mobile App',
    one: 'The native mobile app for BanglaReels — a short-video and drama platform for Bangla-speaking audiences, available on both iOS and Android.',
    highlights: ['Product Lead', 'iOS & Android', 'App Store · Play Store'],
    stage: 'Live',
    appStoreUrl: 'https://apps.apple.com/pl/app/banglareels-short-drama-fun/id6755810957',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.luminar.banglareelsnative&hl=en',
  },
  {
    id: 'tc-customs',
    year: '2024',
    name: 'TC Customs',
    role: 'Lead Developer',
    category: 'Web',
    one: 'A full-service custom automotive shop based in Atlanta — built a complete web presence covering services, gallery, and customer enquiries for one of Atlanta\'s premier customization studios.',
    highlights: ['Lead Developer', 'Design & Development', 'tccustomsatl.com'],
    stage: 'Live',
    url: 'https://tccustomsatl.com/',
  },
  {
    id: 'memorica',
    year: '2024',
    name: 'Memorica',
    role: 'Product Lead',
    category: 'Events',
    one: 'A curated events platform that turns moments into memories — helping people discover and host meaningful experiences.',
    highlights: ['Product Lead', 'Product & Design', 'Live'],
    stage: 'Live',
    url: 'https://www.memorica.events',
  },
];

export default function Work() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="work" className="relative py-28 md:py-44">
      <div
        className="pointer-events-none absolute top-0 right-0 h-[70vh] w-[45vw] glow-blob glow-blob-anim"
        style={{ background: 'rgba(37,99,235,0.07)', filter: 'blur(120px)' }}
      />

      <div className="relative z-10 mx-auto max-w-site px-5 sm:px-8">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 md:mb-20">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.2, 0.6, 0.2, 1] }}
              className="eyebrow mb-7"
            >
              02 — Work
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, ease: [0.2, 0.6, 0.2, 1] }}
              className="font-display tracking-ultra text-white leading-[1.05]"
              style={{ fontSize: 'clamp(38px, 5vw, 60px)' }}
            >
              Things
              <br />
              <span className="italic text-gradient">I&apos;ve built.</span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.2, 0.6, 0.2, 1] }}
            className="self-end"
          >
            <p className="text-[16px] text-ink-2 leading-[1.75]" style={{ fontWeight: 300 }}>
              Six companies across compute, robotics, AI, and capital. Each one is
              an independent experiment — unified by a shared approach to craft.
            </p>
          </motion.div>
        </div>

        {/* Projects list */}
        <div className="space-y-2">
          {projects.map((p, i) => {
            const isActive = active === p.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.06, duration: 0.75, ease: [0.2, 0.6, 0.2, 1] }}
              >
                <button
                  className="w-full text-left"
                  onClick={() => setActive(isActive ? null : p.id)}
                  data-cursor
                >
                  <div
                    className={`relative rounded-2xl px-6 sm:px-8 py-6 transition-all duration-400 group overflow-hidden
                      ${isActive
                        ? 'glass-md border-accent/25 shadow-[0_0_40px_rgba(37,99,235,0.06),0_20px_60px_rgba(0,0,0,0.35)]'
                        : 'glass hover:glass-md hover:border-line-strong hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
                      }`}
                  >
                    {/* Active glow top line */}
                    <span
                      className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent transition-opacity duration-500 ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                      }`}
                    />

                    {/* Active left bar */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          exit={{ scaleY: 0 }}
                          transition={{ duration: 0.35, ease: [0.2, 0.6, 0.2, 1] }}
                          className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full bg-accent origin-top"
                          style={{ boxShadow: '0 0 12px rgba(37,99,235,0.7)' }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
                      {/* Left */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="shrink-0 font-mono text-[11px] text-ink-3 w-10 group-hover:text-ink-2 transition-colors">
                          {p.year}
                        </span>
                        <div className="min-w-0">
                          <h3
                            className={`font-display tracking-tight leading-tight transition-colors ${
                              isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                            }`}
                            style={{ fontSize: 'clamp(22px, 2.5vw, 32px)' }}
                          >
                            {p.name}
                          </h3>
                          <p className="text-[13px] text-ink-3 mt-0.5 font-mono">{p.role}</p>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex items-center gap-3 shrink-0 sm:ml-4">
                        <span className="chip-neutral">{p.category}</span>
                        <span className={`chip transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                          {p.stage}
                        </span>
                        {p.url && (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium text-accent border border-accent/30 bg-accent/8 hover:bg-accent/15 hover:border-accent/60 hover:text-accent transition-all duration-200"
                          >
                            Visit
                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </a>
                        )}
                        {p.appStoreUrl && (
                          <a
                            href={p.appStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium text-accent border border-accent/30 bg-accent/8 hover:bg-accent/15 hover:border-accent/60 hover:text-accent transition-all duration-200"
                          >
                            App Store
                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </a>
                        )}
                        {p.playStoreUrl && (
                          <a
                            href={p.playStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium text-accent border border-accent/30 bg-accent/8 hover:bg-accent/15 hover:border-accent/60 hover:text-accent transition-all duration-200"
                          >
                            Play Store
                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </a>
                        )}
                        <motion.div animate={{ rotate: isActive ? 180 : 0 }} transition={{ duration: 0.35, ease: [0.2, 0.6, 0.2, 1] }}>
                          <ChevronIcon />
                        </motion.div>
                      </div>
                    </div>

                    {/* Expanded content — AnimatePresence */}
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          key="expanded"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.45, ease: [0.2, 0.6, 0.2, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <motion.div
                            initial={{ y: 12 }}
                            animate={{ y: 0 }}
                            exit={{ y: 8 }}
                            transition={{ duration: 0.35, ease: [0.2, 0.6, 0.2, 1] }}
                            className="pt-6 mt-6 border-t border-line grid grid-cols-1 md:grid-cols-3 gap-6"
                          >
                            <div className="md:col-span-2">
                              <p className="text-[15px] text-ink-2 leading-[1.8]" style={{ fontWeight: 300 }}>
                                {p.one}
                              </p>
                              {p.url && (
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-mono text-accent/80 hover:text-accent transition-colors"
                                >
                                  <span>{p.url.replace('https://', '')}</span>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </a>
                              )}
                            </div>
                            <div className="space-y-3.5">
                              {p.highlights.map((h, hi) => (
                                <motion.div
                                  key={h}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: hi * 0.07, duration: 0.4 }}
                                  className="flex items-start gap-2.5"
                                >
                                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent/80" style={{ boxShadow: '0 0 6px rgba(37,99,235,0.6)' }} />
                                  <span className="text-[13px] text-ink-2">{h}</span>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-ink-3">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

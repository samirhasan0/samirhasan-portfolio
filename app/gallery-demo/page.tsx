'use client';

/*
 * TEMPORARY demo page — three ways the Work section could work as a showcase gallery.
 * Open /gallery-demo. Delete this folder once a style is chosen.
 */

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { projects, type Project } from '@/components/data';
import { ArrowUpRight, EASE } from '@/components/ui';

const host = (url?: string) => (url ? url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : '');
const num = (i: number) => String(i + 1).padStart(2, '0');

/** A screenshot in a browser window or a phone, on a dark stage. */
function Shot({ p, sizes = '50vw', fill }: { p: Project; sizes?: string; fill?: boolean }) {
  if (p.frame === 'phone')
    return (
      <div className="absolute inset-0 grid place-items-center bg-[#020a1c]">
        <div className="absolute inset-0" style={{ background: `radial-gradient(60% 60% at 50% 100%, ${p.tone}33, transparent 70%)` }} />
        <div className="relative h-[86%] rounded-[26px] border border-white/15 bg-black p-[5px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]" style={{ aspectRatio: '9 / 19.5' }}>
          <div className="relative h-full overflow-hidden rounded-[21px]">
            <Image src={p.image} alt="" fill sizes="240px" className="object-cover object-top" />
          </div>
        </div>
      </div>
    );
  if (fill)
    return (
      <div className="absolute inset-0 bg-[#020a1c]">
        <Image src={p.image} alt="" fill sizes={sizes} className="object-cover object-top" />
      </div>
    );
  return (
    <div className="absolute inset-0 bg-[#020a1c]">
      <div className="absolute inset-0" style={{ background: `radial-gradient(80% 60% at 50% 110%, ${p.tone}33, transparent 65%)` }} />
      <div className="absolute inset-x-[5%] top-[7%] overflow-hidden rounded-t-[10px] border border-b-0 border-white/10 bg-[#0b1426] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.95)]">
        <div className="flex h-6 items-center gap-1.5 border-b border-white/[0.06] px-3">
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="mx-auto font-mono text-[9px] text-ink-3">{host(p.url)}</span>
        </div>
        <div className="relative aspect-[16/10]">
          <Image src={p.image} alt="" fill sizes={sizes} className="object-cover object-top" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#020a1c] to-transparent" />
    </div>
  );
}

function Meta({ p, i }: { p: Project; i: number }) {
  return (
    <div className="label flex items-center gap-3">
      <span className="text-accent">{num(i)}</span>
      <span className="text-ink-2">{p.category}</span>
      <span className="flex items-center gap-1.5 text-accent">
        <span className="live-dot" /> {p.status}
      </span>
    </div>
  );
}

function Panel({ tag, title, note, children }: { tag: string; title: string; note: string; children: ReactNode }) {
  return (
    <section className="relative border-t border-line-2 px-[var(--gutter)] py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label text-accent">{tag}</p>
          <h2 className="display glow-text mt-3 text-[clamp(30px,3.4vw,52px)]">{title}</h2>
        </div>
        <p className="max-w-[420px] text-[14px] font-light leading-[1.6] text-ink-2">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Arrows({ prev, next }: { prev: () => void; next: () => void }) {
  return (
    <div className="flex gap-2">
      {[
        ['Previous', prev, 'M9 3L4 7l5 4'],
        ['Next', next, 'M5 3l5 4-5 4'],
      ].map(([label, fn, d]) => (
        <button
          key={label as string}
          onClick={fn as () => void}
          aria-label={label as string}
          className="grid h-11 w-11 place-items-center border border-line-3 text-ink transition-colors hover:border-accent hover:bg-accent hover:text-bg"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d={d as string} stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ─── A · Featured stage ─────────────────────────────────────────────── */

function FeaturedStage() {
  const [i, setI] = useState(0);
  const p = projects[i];
  const go = (d: number) => setI((v) => (v + d + projects.length) % projects.length);
  return (
    <Panel
      tag="Option A"
      title="Featured stage"
      note="One project at a time, big. On the real site each scroll would move to the next project; here, use the arrows or click a thumbnail."
    >
      <div className="grid gap-8 md:grid-cols-12 md:items-center">
        <div className="relative aspect-[16/10] overflow-hidden border border-line-2 md:col-span-8">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={p.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <Shot p={p} sizes="66vw" />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="md:col-span-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Meta p={p} i={i} />
              <h3 className="display mt-4 text-[clamp(32px,3.6vw,56px)]">{p.name}</h3>
              <p className="mt-2 text-[14px] text-ink-2">
                {p.role} · {p.year}
              </p>
              <p className="mt-5 text-[15px] font-light leading-[1.65] text-ink">{p.summary}</p>
              <span className="btn btn-solid mt-7 inline-flex">
                Visit <ArrowUpRight size={12} />
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between gap-6">
        <div className="flex gap-2 overflow-x-auto">
          {projects.map((q, k) => (
            <button
              key={q.id}
              onClick={() => setI(k)}
              aria-label={q.name}
              className={`relative aspect-[16/10] w-[96px] shrink-0 overflow-hidden border transition-all duration-500 ${
                k === i ? 'border-accent opacity-100 shadow-[0_0_24px_rgba(140,203,255,0.45)]' : 'border-line-2 opacity-45 hover:opacity-80'
              }`}
            >
              <Image src={q.image} alt="" fill sizes="100px" className="object-cover object-top" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <span className="label tabular-nums text-ink">
            {num(i)} / {num(projects.length - 1)}
          </span>
          <Arrows prev={() => go(-1)} next={() => go(1)} />
        </div>
      </div>
    </Panel>
  );
}

/* ─── B · Bento grid ─────────────────────────────────────────────────── */

// [project id, column span, row span] on a 12-column grid
const BENTO: [string, string][] = [
  ['luminar-technology', 'md:col-span-7 md:row-span-2'],
  ['autoworx', 'md:col-span-5'],
  ['prenda-solution', 'md:col-span-5'],
  ['banglareels-app', 'md:col-span-3 md:row-span-2'],
  ['banglareels', 'md:col-span-5'],
  ['tc-customs', 'md:col-span-4'],
  ['memorica', 'md:col-span-9'],
];

function Bento() {
  return (
    <Panel
      tag="Option B"
      title="Bento grid"
      note="Every project visible at once, Luminar largest. Normal scrolling; hover a tile to lift it, click to open its details."
    >
      <div className="grid grid-cols-1 gap-3 md:auto-rows-[230px] md:grid-cols-12 md:[grid-auto-flow:dense]">
        {BENTO.map(([id, span]) => {
          const k = projects.findIndex((q) => q.id === id);
          const p = projects[k];
          return (
            <motion.button
              key={id}
              className={`group relative min-h-[240px] overflow-hidden border border-line-2 text-left transition-[border-color,box-shadow] duration-500 hover:border-accent/60 hover:shadow-[0_0_50px_-12px_rgba(80,160,255,0.55)] ${span}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: EASE, delay: k * 0.05 }}
            >
              <div className="absolute inset-0 transition-transform duration-[900ms] ease-expo group-hover:scale-[1.04]">
                <Shot p={p} fill={p.frame !== 'phone'} sizes="60vw" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#010614] via-[#010614]/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                <div>
                  <Meta p={p} i={k} />
                  <h3 className="display mt-2 text-[clamp(20px,1.9vw,32px)]">{p.name}</h3>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center border border-line-3 transition-all duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-bg">
                  <ArrowUpRight />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </Panel>
  );
}

/* ─── C · 3D cover-flow ──────────────────────────────────────────────── */

function CoverFlow() {
  const [i, setI] = useState(3);
  const go = (d: number) => setI((v) => Math.min(projects.length - 1, Math.max(0, v + d)));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const p = projects[i];
  return (
    <Panel
      tag="Option C"
      title="3D cover-flow"
      note="Projects on a curved arc; the centre one faces you. On the real site each scroll would turn the next one to the centre; here, click a side card or use the arrows."
    >
      <div className="relative h-[clamp(300px,36vw,520px)] overflow-hidden" style={{ perspective: 1600 }}>
        {projects.map((q, k) => {
          const o = k - i;
          const a = Math.abs(o);
          return (
            <motion.button
              key={q.id}
              onClick={() => setI(k)}
              aria-label={q.name}
              className="absolute left-1/2 top-1/2 aspect-[16/10] w-[min(56vw,760px)] overflow-hidden border border-line-2"
              style={{ zIndex: 20 - a, transformStyle: 'preserve-3d' }}
              animate={{
                x: `calc(-50% + ${o * 34}%)`,
                y: '-50%',
                rotateY: o === 0 ? 0 : o < 0 ? 48 : -48,
                z: o === 0 ? 0 : -260 - a * 60,
                opacity: a > 3 ? 0 : 1 - a * 0.18,
                filter: o === 0 ? 'brightness(1)' : 'brightness(0.55)',
              }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <Shot p={q} sizes="56vw" />
              {o === 0 && <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(140,203,255,0.5)]" />}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: EASE }}>
            <Meta p={p} i={i} />
            <h3 className="display mt-3 text-[clamp(28px,3vw,48px)]">{p.name}</h3>
            <p className="mt-2 text-[14px] text-ink-2">
              {p.role} · {p.year}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center gap-5">
          <span className="label tabular-nums text-ink">
            {num(i)} / {num(projects.length - 1)}
          </span>
          <Arrows prev={() => go(-1)} next={() => go(1)} />
        </div>
      </div>
    </Panel>
  );
}

export default function GalleryDemo() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,#0A2552_0%,#041230_45%,#00030B_85%)]">
      <header className="px-[var(--gutter)] pb-6 pt-16">
        <p className="label text-accent">Work · showcase gallery demos</p>
        <h1 className="display glow-text mt-3 text-[clamp(36px,4.6vw,72px)]">
          Pick a <span className="hl">style.</span>
        </h1>
        <p className="mt-4 max-w-[560px] text-[15px] font-light leading-[1.65] text-ink-2">
          Three ways to show your seven projects, using your real screenshots. These are quick previews: the chosen one gets the
          full treatment (scroll steps, 3D scene behind it, phone layout).
        </p>
      </header>
      <FeaturedStage />
      <Bento />
      <CoverFlow />
    </main>
  );
}

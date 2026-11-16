'use client';

import Image from 'next/image';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { projects, type Project } from './data';
import { lenisInstance } from './SmoothScroll';
import { ArrowUpRight, ChapterLabel, EASE, useChapterProgress } from './ui';

const SPRING = { stiffness: 160, damping: 18, mass: 0.6 };
const host = (url?: string) => (url ? url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : '');

function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return match;
}

/* ─── Media: browser window or phone on a lit stage ─── */

function Media({ p, large }: { p: Project; large?: boolean }) {
  const phone = p.frame === 'phone';
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#020a1c]">
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(90% 70% at 50% 115%, ${p.tone}40 0%, transparent 60%), radial-gradient(70% 60% at 50% 0%, rgba(80,150,255,0.18), transparent 70%)` }}
      />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(150,190,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(150,190,255,0.07)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      {phone ? (
        <div className="absolute left-1/2 top-[9%] w-[36%] max-w-[240px] -translate-x-1/2 transition-transform duration-[900ms] ease-expo group-hover:-translate-y-2">
          <div className="rounded-[30px] border border-white/15 bg-black p-[6px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
            <div className="relative aspect-[9/19.5] overflow-hidden rounded-[25px]">
              <Image src={p.image} alt={`${p.name} app screen`} fill sizes="260px" className="object-cover object-top" />
              <div className="absolute left-1/2 top-2 h-4 w-[34%] -translate-x-1/2 rounded-full bg-black" />
            </div>
          </div>
        </div>
      ) : (
        <div className={`absolute inset-x-[7%] top-[11%] transition-transform duration-[900ms] ease-expo group-hover:-translate-y-2 ${large ? 'md:inset-x-[11%]' : ''}`}>
          <div className="overflow-hidden rounded-t-[10px] border border-b-0 border-white/10 bg-[#0b1426] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.95)]">
            <div className="flex h-6 items-center gap-1.5 border-b border-white/[0.06] px-3">
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              <span className="mx-auto font-mono text-[9px] text-ink-3">{host(p.url)}</span>
            </div>
            <div className="relative aspect-[16/10]">
              <Image src={p.image} alt={`${p.name} website`} fill sizes={large ? '(min-width: 768px) 900px, 100vw' : '(min-width: 768px) 460px, 100vw'} className="object-cover object-top" />
            </div>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#020a1c] to-transparent" />
    </div>
  );
}

/** Project name, with its accent prefix (the "Auto" in AutoWorx) lit up */
function Name({ p }: { p: Project }) {
  if (!p.accent || !p.name.startsWith(p.accent)) return <>{p.name}</>;
  return (
    <>
      <span className="text-accent [text-shadow:0_0_28px_rgba(140,203,255,0.75)]">{p.accent}</span>
      {p.name.slice(p.accent.length)}
    </>
  );
}

/* ─── Card ─── */

function Card({ p, index, hidden, tilt, slide, onOpen }: { p: Project; index: number; hidden: boolean; tilt: boolean; slide: boolean; onOpen: (p: Project, el: HTMLElement) => void }) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [9, -9]), SPRING);
  const ry = useSpring(useTransform(mx, [0, 1], [-11, 11]), SPRING);
  const gx = useTransform(mx, (v) => `${v * 100}%`);
  const gy = useTransform(my, (v) => `${v * 100}%`);
  const sheen = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(160,210,255,0.16), transparent 50%)`;
  const [hover, setHover] = useState(false);

  const move = (e: RPointerEvent<HTMLButtonElement>) => {
    if (!tilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    mx.set(0.5);
    my.set(0.5);
    setHover(false);
  };

  return (
    <motion.article
      className="w-full shrink-0 md:w-[clamp(340px,33vw,500px)]"
      style={{ perspective: 1300 }}
      // Desktop cards turn in from the right as the track slides; on phones they rise in place
      initial={slide ? { opacity: 0, rotateY: -28, x: 80, filter: 'blur(10px)' } : { opacity: 0, rotateX: 18, y: 50, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, rotateY: 0, rotateX: 0, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1.3, ease: EASE }}
    >
      <motion.button
        type="button"
        onClick={(e) => {
          reset();
          onOpen(p, e.currentTarget);
        }}
        onPointerMove={move}
        onPointerEnter={() => tilt && setHover(true)}
        onPointerLeave={reset}
        style={{ rotateX: tilt ? rx : 0, rotateY: tilt ? ry : 0, transformStyle: 'preserve-3d' }}
        className="group relative block w-full p-2.5 text-left transition-shadow duration-700 ease-expo hover:shadow-[0_0_60px_-10px_rgba(80,160,255,0.45)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-accent"
        aria-label={`Open ${p.name} — ${p.category}`}
      >
        {/* Glass lives on its own layer: backdrop-filter on the button would flatten the 3D depth */}
        <span className="glass pointer-events-none absolute inset-0 transition-colors duration-700 group-hover:border-accent/50" />
        {/* Corner ticks */}
        {['left-0 top-0 border-l border-t', 'right-0 top-0 border-r border-t', 'left-0 bottom-0 border-l border-b', 'right-0 bottom-0 border-r border-b'].map((c) => (
          <span key={c} className={`pointer-events-none absolute h-3 w-3 border-accent/70 transition-all duration-700 ease-expo group-hover:h-5 group-hover:w-5 group-hover:border-accent ${c}`} />
        ))}

        <div style={{ transform: 'translateZ(36px)', transformStyle: 'preserve-3d' }}>
          <motion.div
            layoutId={`media-${p.id}`}
            className="relative aspect-[4/3] overflow-hidden"
            style={{ opacity: hidden ? 0 : 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <Media p={p} />
          </motion.div>
        </div>

        <div className="flex items-end justify-between gap-5 px-2 pb-2 pt-5" style={{ transform: 'translateZ(56px)' }}>
          <div className="min-w-0">
            <div className="label mb-3 flex items-center gap-3">
              <span className="text-accent">{String(index + 1).padStart(2, '0')}</span>
              <span className="min-w-0 truncate text-ink-2">{p.category}</span>
              <span className="flex shrink-0 items-center gap-1.5 text-accent">
                <span className="live-dot" /> {p.status}
              </span>
            </div>
            <h3 className="display text-[clamp(24px,2.3vw,34px)]"><Name p={p} /></h3>
            {p.tagline && <p className="label mt-2.5 text-accent">{p.tagline}</p>}
            <p className="mt-2 text-[13px] text-ink-2">
              {p.role} · {p.year}
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center border border-line-3 text-ink transition-all duration-500 ease-expo group-hover:border-accent group-hover:bg-accent group-hover:text-bg">
            <span className="transition-transform duration-500 ease-expo group-hover:rotate-45">
              <ArrowUpRight />
            </span>
          </span>
        </div>

        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ background: sheen, opacity: hover ? 1 : 0, transition: 'opacity 0.5s', transform: 'translateZ(70px)' }}
        />
      </motion.button>
    </motion.article>
  );
}

/* ─── Detail view ─── */

function Detail({ p, onClose }: { p: Project; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const links = [
    p.url && { label: 'Visit website', href: p.url },
    p.appStoreUrl && { label: 'App Store', href: p.appStoreUrl },
    p.playStoreUrl && { label: 'Google Play', href: p.playStoreUrl },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby={`title-${p.id}`}>
      <motion.div
        className="absolute inset-0 bg-bg/92"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        onClick={onClose}
      />
      <div className="pointer-events-none absolute inset-0 overflow-y-auto overscroll-contain" data-lenis-prevent>
        <div className="flex min-h-full items-start justify-center px-3 py-3 md:items-center md:px-8 md:py-10">
          <motion.div
            className="glass pointer-events-auto relative w-full max-w-[1180px] p-2.5 md:p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.15 } }}
            transition={{ duration: 0.4 }}
          >
            <motion.div layoutId={`media-${p.id}`} className="relative aspect-[4/3] overflow-hidden md:aspect-[21/9]" transition={{ duration: 0.9, ease: EASE }}>
              <Media p={p} large />
            </motion.div>

            <button
              ref={closeRef}
              onClick={onClose}
              className="label absolute right-5 top-5 z-10 flex h-10 items-center gap-2 border border-line-3 bg-bg/85 px-4 text-ink transition-colors hover:bg-ink hover:text-bg md:right-7 md:top-7"
              aria-label="Close"
            >
              Close
              <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden>
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>

            <motion.div
              className="grid grid-cols-1 gap-10 px-3 pb-6 pt-8 md:grid-cols-12 md:px-6 md:pb-8 md:pt-10"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: 0.35 } }}
              exit={{ opacity: 0, y: 12, transition: { duration: 0.25 } }}
            >
              <div className="md:col-span-7">
                <span className="label text-accent">{p.category}</span>
                <h2 id={`title-${p.id}`} className="display glow-text mt-4 text-[clamp(36px,5.2vw,76px)]">
                  <Name p={p} />
                </h2>
                {p.tagline && <p className="label mt-5 text-accent">{p.tagline}</p>}
                <p className="mt-6 max-w-[560px] text-[17px] leading-[1.6] text-ink-2">{p.summary}</p>
                {links.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    {links.map((l, i) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={`btn ${i === 0 ? 'btn-solid' : 'btn-line'}`}>
                        {l.label} <ArrowUpRight size={12} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <dl className="grid grid-cols-2 content-start gap-x-6 gap-y-6 md:col-span-5 md:border-l md:border-line-2 md:pl-10">
                {[
                  ['Role', p.role],
                  ['Year', p.year],
                  ['Status', p.status],
                  ['Category', p.category],
                ].map(([k, v]) => (
                  <div key={k} className="border-t border-line-2 pt-3">
                    <dt className="label">{k}</dt>
                    <dd className="mt-1.5 text-[15px]">{v}</dd>
                  </div>
                ))}
                <div className="col-span-2 border-t border-line-2 pt-3">
                  <dt className="label">Highlights</dt>
                  <dd className="mt-3 flex flex-wrap gap-2">
                    {p.highlights.map((h) => (
                      <span key={h} className="border border-line-2 px-3 py-1.5 text-[13px] text-ink-2">
                        {h}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ─── Section ─── */

function Intro() {
  return (
    <div className="w-full shrink-0 md:w-[clamp(300px,28vw,420px)] md:pr-6">
      <ChapterLabel n={2}>Work</ChapterLabel>
      <h2 className="display glow-text mt-6 text-[clamp(40px,5vw,80px)]">
        Things
        <br />
        <span className="hl">I’ve built.</span>
      </h2>
      <p className="mt-6 max-w-[360px] text-[16px] font-light leading-[1.65] text-ink">
        Real products, live right now. Open any one to see it.
      </p>
      <p className="label mt-6 hidden md:block">Keep scrolling →</p>
    </div>
  );
}

export default function Work() {
  const [active, setActive] = useState<Project | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const desktop = useMedia('(min-width: 768px)');
  const fine = useMedia('(hover: hover) and (pointer: fine)');

  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const p = useChapterProgress(section);
  const x = useTransform(p, [0.04, 0.96], [0, -distance]);
  const [count, setCount] = useState(1);
  useMotionValueEvent(p, 'change', (v) => setCount(Math.min(projects.length, Math.max(1, Math.ceil(v * projects.length)))));

  // Section height = horizontal travel + one viewport, so vertical scroll maps 1:1 to sideways motion
  useLayoutEffect(() => {
    if (!desktop || !track.current) return;
    const measure = () => setDistance(Math.max(0, track.current!.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [desktop]);

  const open = useCallback((proj: Project, el: HTMLElement) => {
    returnFocus.current = el;
    setActive(proj);
  }, []);
  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (active) {
      lenisInstance?.stop();
      document.documentElement.style.overflow = 'hidden';
      // Fades the fixed header and labels so they don't sit over the open project
      document.documentElement.dataset.modal = '1';
    } else {
      lenisInstance?.start();
      document.documentElement.style.overflow = '';
      delete document.documentElement.dataset.modal;
      returnFocus.current?.focus({ preventScroll: true });
    }
  }, [active]);

  const cards = projects.map((proj, i) => (
    <Card key={proj.id} p={proj} index={i} hidden={active?.id === proj.id} tilt={fine} slide={desktop} onOpen={open} />
  ));

  return (
    <section
      id="work"
      ref={section}
      className="relative"
      style={desktop ? { height: `calc(${distance}px + 140vh)` } : undefined}
    >
      {desktop ? (
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
          <motion.div ref={track} style={{ x }} className="flex w-max items-center gap-6 pl-[var(--gutter)] pr-[12vw] pt-10">
            <Intro />
            {cards}
          </motion.div>
          {/* Progress */}
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4">
            <span className="label tabular-nums text-ink">{String(count).padStart(2, '0')}</span>
            <div className="relative h-px w-40 bg-line-2">
              <motion.div className="absolute inset-y-0 left-0 w-full origin-left bg-accent" style={{ scaleX: p }} />
            </div>
            <span className="label tabular-nums">{String(projects.length).padStart(2, '0')}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-[var(--gutter)] py-28">
          <Intro />
          <div className="mt-6 flex flex-col gap-5">{cards}</div>
        </div>
      )}

      <AnimatePresence>{active && <Detail key={active.id} p={active} onClose={close} />}</AnimatePresence>
    </section>
  );
}

'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { sceneState } from './journey/store';
import { ChapterLabel, useChapterProgress } from './ui';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * The real photo of Samir, resolving out of the particle portrait.
 * The 3D scene reports where the particle figure sits on screen every frame; the photo is pinned
 * exactly over it and revealed top-down by a scan line as the chapter scrolls in. It dissolves
 * back into the particles the moment they start to move on to the next chapter.
 */
function PortraitPhoto({ p }: { p: MotionValue<number> }) {
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const scan = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The reveal runs on its own clock, not the scroll position: the scroll snaps in a fraction of a
    // second, which made the photo pop in. Once the particles have formed the figure, the photo takes
    // IN seconds to condense out of them, and dissolves back in OUT seconds when you move on.
    const IN = 3.2;
    const OUT = 0.9;
    let r = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // capped so a backgrounded tab doesn't jump, loose enough that slow devices still keep time
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const el = box.current;
      const im = img.current;
      const sc = scan.current;
      if (!el || !im || !sc) return;
      const P = sceneState.portrait;
      const hold = smooth(0.92, 1, P.on);
      // Desktop: once the pinned chapter starts. Phones: as soon as the portrait above the copy is in view
      const arrived = window.innerWidth < 768 ? sceneState.aboutTop < window.innerHeight * 0.5 : p.get() > 0.02;
      const here = arrived && hold > 0.98;
      r = here ? Math.min(1, r + dt / IN) : Math.max(0, r - dt / OUT);
      const reveal = r * r * (3 - 2 * r);
      if (reveal < 0.002 || hold < 0.002 || P.w <= 0) {
        el.style.visibility = 'hidden';
        return;
      }
      el.style.visibility = 'visible';
      el.style.transform = `translate3d(${P.x}px, ${P.y}px, 0)`;
      el.style.width = `${P.w}px`;
      el.style.height = `${P.h}px`;
      el.style.opacity = String(hold * smooth(0, 0.35, reveal));
      // reveal edge, % from the top, with a wide soft band above it so the photo slowly condenses
      // out of the particles rather than wiping in
      const band = 34;
      const edge = reveal * (100 + band + 6) - 6;
      const mask = `linear-gradient(to bottom, #000 ${edge - band}%, rgba(0,0,0,0.45) ${edge - band * 0.45}%, transparent ${edge}%)`;
      im.style.maskImage = mask;
      im.style.webkitMaskImage = mask;
      const left = 1 - reveal;
      im.style.filter = `blur(${(left * 7).toFixed(2)}px) brightness(${(1 + left * 0.45).toFixed(3)}) saturate(${(1 - left * 0.6).toFixed(3)})`;
      sc.style.top = `${edge - 4}%`;
      sc.style.opacity = String(Math.sin(Math.PI * reveal) * hold * 0.9);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [p]);

  return (
    <div
      ref={box}
      className="pointer-events-none fixed left-0 top-0 [mask-image:linear-gradient(to_bottom,#000_70%,transparent_97%)]"
      style={{ visibility: 'hidden' }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src="/portrait/samir.webp" alt="" className="h-full w-full select-none object-contain" draggable={false} />
      <div
        ref={scan}
        className="absolute inset-x-[6%] h-px bg-[#BFE3FF] shadow-[0_0_14px_3px_rgba(120,190,255,0.75)]"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

/* Copy from samirhasan.com, in its order and hierarchy. */
const facts = [
  { k: 'Based in', v: 'Dhaka, BD' },
  { k: 'Currently', v: 'Luminar Technology' },
  { k: 'Founded', v: '2021' },
  { k: 'Focus', v: 'AI · Compute · Craft' },
];

const stats = [
  { v: '7+', k: 'Companies' },
  { v: '2021', k: 'Since' },
  { v: '150+', k: 'Shipped' },
];

const story =
  'I started my first company at 19, from a small studio in Dhaka. Today I run Luminar Technology and build software products for clients around the world.';

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const p = useChapterProgress(ref);
  // Everything is on one screen: it settles in as the chapter arrives and leaves before the particles move on
  const opacity = useTransform(p, [0, 0.08, 0.62, 0.72], [0, 1, 1, 0]);
  const y = useTransform(p, [0, 0.1], ['28px', '0px']);
  // That fade is timed to the pinned desktop chapter. On phones About is a normal scrolling section,
  // so the copy simply stays visible.
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <section id="manifesto" ref={ref} className="relative md:h-[200vh]">
      <div className="flex min-h-[100svh] items-start px-[var(--gutter)] pb-16 pt-[var(--about-top)] [--about-top:max(46svh,300px)] md:sticky md:top-0 md:h-[100svh] md:items-center md:pb-8 md:pt-24">
        <PortraitPhoto p={p} />
        <motion.div style={desktop ? { opacity, y } : { opacity: 1, y: '0px' }} className="relative w-full md:max-w-[min(780px,54vw)]">
          <ChapterLabel n={1}>About</ChapterLabel>
          <h2 className="display glow-text mt-5 text-[clamp(32px,3.6vw,58px)]">
            Builder first.
            <br />
            <span className="hl">Founder second.</span>
          </h2>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.k} className="border-t border-line-2 pt-2.5">
                <dt className="label">{f.k}</dt>
                <dd className="mt-1 text-[13px] font-medium text-ink">{f.v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 max-w-[560px] text-[17px] font-light leading-[1.6] text-ink md:text-[clamp(16px,1.3vw,19px)]">{story}</p>

          <div className="mt-7 grid gap-6 border-t border-line-2 pt-6 md:grid-cols-[auto_1fr] md:items-center md:gap-10">
            <div className="grid grid-cols-3 gap-6 md:gap-8">
              {stats.map((s) => (
                <div key={s.k}>
                  <div className="display hl text-[clamp(30px,2.9vw,46px)] font-semibold">{s.v}</div>
                  <div className="label mt-1.5">{s.k}</div>
                </div>
              ))}
            </div>
            <figure className="md:border-l md:border-line-2 md:pl-8">
              <blockquote className="display glow-text text-[clamp(17px,1.45vw,22px)] leading-[1.15]">
                “The constraint is never capability. It’s always conviction.”
              </blockquote>
              <figcaption className="label mt-2.5">— Personal journal, 2023</figcaption>
            </figure>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

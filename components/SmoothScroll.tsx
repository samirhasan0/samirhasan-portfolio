'use client';

import { useEffect, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import Lenis from '@studio-freight/lenis';

export let lenisInstance: Lenis | null = null;

/* ─── Step snapping ────────────────────────────────────────────────────────
   The pinned chapters tell their story in beats. When a scroll gesture ends,
   the page glides to a beat, so every gesture lands somewhere deliberate:
   - moved past a tiny nudge → the next beat in that direction (even if the gesture was short)
   - a big flick → the nearest beat to where it stopped
   - a tiny nudge → back to where you were
   Work's sideways gallery and the contact form below the portal scroll freely. */

/** [section id, number of beats] for the pinned chapters, in page order. */
const BEATS: [string, number][] = [
  ['manifesto', 1],
  ['principles', 4],
  ['journey', 3],
  ['vision', 5],
];

function docTop(el: HTMLElement) {
  return el.getBoundingClientRect().top + window.scrollY;
}

function snapMap(vh: number) {
  const points: number[] = [0];
  const free: [number, number][] = [];
  for (const [id, n] of BEATS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const top = docTop(el);
    const range = el.offsetHeight - vh;
    // Not pinned on this screen size (e.g. About on phones, where it is a normal tall section): read it freely
    const stage = el.firstElementChild as HTMLElement | null;
    const pinned = !!stage && getComputedStyle(stage).position === 'sticky';
    if (!pinned || range < vh * 0.3) {
      free.push([top - vh * 0.2, top + el.offsetHeight]);
      continue;
    }
    for (let i = 0; i < n; i++) points.push(top + ((i + 0.5) / n) * range);
  }
  const work = document.getElementById('work');
  if (work) {
    const top = docTop(work);
    const range = work.offsetHeight - vh;
    if (range > vh * 0.3) {
      points.push(top, top + range); // gallery start and end
      free.push([top + 40, top + range - 40]);
    } else free.push([top - vh * 0.2, top + work.offsetHeight]);
  }
  const contact = document.getElementById('contact');
  if (contact) {
    const top = docTop(contact);
    points.push(top);
    free.push([top + 40, Infinity]);
  }
  points.sort((a, b) => a - b);
  return { points, free };
}

function attachSnap(lenis: Lenis) {
  let timer = 0;
  let last: number | null = null; // index of the beat we last came to rest on
  let snapping = false;
  let touching = false;

  const nearest = (pts: number[], y: number) => {
    let best = 0;
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i] - y) < Math.abs(pts[best] - y)) best = i;
    return best;
  };

  const settle = () => {
    if (snapping || touching || document.documentElement.dataset.locked === '1') return;
    const vh = window.innerHeight;
    const y = window.scrollY;
    const { points, free } = snapMap(vh);
    if (free.some(([a, b]) => y > a && y < b)) {
      last = null;
      return;
    }
    const n = nearest(points, y);
    let target = n;
    if (last !== null && last < points.length) {
      const delta = y - points[last];
      if (Math.abs(delta) < Math.min(36, vh * 0.04)) target = last; // a nudge: stay
      else if (n === last) target = Math.min(points.length - 1, Math.max(0, last + Math.sign(delta))); // one gesture, one beat
    }
    const dest = points[target];
    if (Math.abs(dest - y) < 2) {
      last = target;
      return;
    }
    snapping = true;
    const dist = Math.abs(dest - y) / vh;
    lenis.scrollTo(dest, {
      duration: Math.min(1.25, 0.6 + dist * 0.45),
      easing: (t) => 1 - Math.pow(1 - t, 3),
      onComplete: () => {
        snapping = false;
        last = target;
      },
    });
    // in case the glide is interrupted before it completes
    window.setTimeout(() => (snapping = false), 1400);
  };

  const onScroll = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(settle, 170);
  };
  // the visitor taking over cancels a glide in progress
  const onInput = () => {
    snapping = false;
  };
  const onTouchStart = () => {
    touching = true;
    snapping = false;
  };
  const onTouchEnd = () => {
    touching = false;
    onScroll();
  };

  lenis.on('scroll', onScroll);
  window.addEventListener('wheel', onInput, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  return {
    /** forget the resting beat (after jumping somewhere through the menu) */
    reset: () => {
      last = null;
    },
    hold: (v: boolean) => {
      snapping = v;
    },
    destroy: () => {
      window.clearTimeout(timer);
      lenis.off('scroll', onScroll);
      window.removeEventListener('wheel', onInput);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    },
  };
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 0.8,
    });
    lenisInstance = lenis;
    const snap = attachSnap(lenis);
    // The intro screen may already be holding the page
    if (document.documentElement.dataset.locked === '1') lenis.stop();

    let rafId = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // Route in-page anchor clicks through Lenis
    const onAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      const href = anchor?.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      // A closing overlay may have paused Lenis in the same click
      if (document.documentElement.dataset.locked !== '1') lenis.start();
      snap.reset();
      snap.hold(true);
      lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 2.2, onComplete: () => snap.hold(false) });
    };
    document.addEventListener('click', onAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      snap.destroy();
      lenis.destroy();
      lenisInstance = null;
      document.removeEventListener('click', onAnchorClick);
    };
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { measureScenes, sceneState } from './store';
import { loadLogoMasks, loadPortraitMask, type LogoMask, type PortraitMask } from './shapes';
import type { Tier } from './Scene';

const Scene = dynamic(() => import('./Scene'), { ssr: false });

export default function Backdrop() {
  const [ready, setReady] = useState<{ family?: string; mobile: boolean; tier: Tier; logos: LogoMask[]; face?: PortraitMask } | null>(null);

  // Scroll → scene tracker + pointer
  useEffect(() => {
    // Measuring reads layout, so only do it on frames where the page scrolled or resized
    let raf = 0;
    let dirty = true;
    const mark = () => {
      dirty = true;
    };
    const loop = () => {
      if (dirty) {
        dirty = false;
        measureScenes();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('scroll', mark, { passive: true });
    window.addEventListener('resize', mark);
    const ro = new ResizeObserver(mark);
    ro.observe(document.body);
    const onMove = (e: PointerEvent) => {
      sceneState.px = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.py = (e.clientY / window.innerHeight) * 2 - 1;
      sceneState.pActive = true;
    };
    // A finger lifting (or the browser taking over to scroll) releases the field
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') sceneState.pActive = false;
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) sceneState.pActive = false;
    };
    const onBlur = () => {
      sceneState.pActive = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.addEventListener('pointerout', onOut);
    window.addEventListener('blur', onBlur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', mark);
      window.removeEventListener('resize', mark);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Wait for the display font (initials) and the company logos (Journey) before building shapes
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    // Few cores or little memory: start with a lighter scene
    const nav = navigator as Navigator & { deviceMemory?: number };
    const tier: Tier = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 ? 'low' : 'high';
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim() || undefined;
    let cancelled = false;
    const timeout = <T,>(p: Promise<T>, ms: number, fallback: T) =>
      Promise.race([p, new Promise<T>((res) => setTimeout(() => res(fallback), ms))]);
    Promise.all([
      timeout(document.fonts?.ready ?? Promise.resolve(), 2500, undefined),
      timeout(loadLogoMasks().catch(() => [] as LogoMask[]), 4000, [] as LogoMask[]),
      timeout(loadPortraitMask().catch(() => undefined), 4000, undefined),
    ]).then(([, logos, face]) => {
      if (!cancelled) setReady({ family, mobile, tier, logos, face });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      {/* Abyssal gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,#0A2552_0%,#041230_42%,#00030B_78%)]" />
      <div className="absolute inset-x-0 top-0 h-[45vh] bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(80,150,255,0.18),transparent_70%)]" />
      {ready && <Scene family={ready.family} mobile={ready.mobile} tier={ready.tier} logos={ready.logos} face={ready.face} />}
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,3,11,0.85)_100%)]" />
    </div>
  );
}

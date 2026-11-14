'use client';

import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { lenisInstance } from './SmoothScroll';
import { EMAIL, socials } from './data';
import { ArrowUpRight, DhakaTime, EASE } from './ui';
import { SCENES, onSceneChange } from './journey/store';

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState(0);
  const { scrollYProgress } = useScroll();
  const rail = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => onSceneChange(setScene), []);

  useEffect(() => {
    if (open) lenisInstance?.stop();
    else if (document.documentElement.dataset.locked !== '1') lenisInstance?.start();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Top bar */}
      <header className="hud fixed inset-x-0 top-0 z-50">
        {/* Soft fade so scrolling copy never collides with the logo and menu */}
        <div className="header-fade" aria-hidden />
        <div className="flex h-[82px] items-center justify-between px-[var(--gutter)] md:h-[94px]">
          <a href="#top" className="group flex items-center gap-3" aria-label="Samir Hasan — back to start">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="text-ink transition-colors duration-500 group-hover:text-accent" aria-hidden>
              <path d="M15 1.5 27.5 8.75v12.5L15 28.5 2.5 21.25V8.75L15 1.5Z" stroke="currentColor" strokeWidth="1.2" />
              <path d="M15 8 21 11.5v7L15 22l-6-3.5v-7L15 8Z" fill="currentColor" opacity=".9" />
            </svg>
            <span className="display text-[12px] leading-[1.05] tracking-[0.08em]">
              Samir
              <br />
              Hasan
            </span>
          </a>

          <button
            onClick={() => setOpen((v) => !v)}
            className="group relative z-[70] -mr-2 flex h-11 items-center gap-3 px-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className="hidden sm:inline">{open ? 'Close' : 'Menu'}</span>
            <span className="relative block h-[9px] w-6">
              <span className={`absolute right-0 block h-px bg-ink transition-all duration-500 ease-expo ${open ? 'top-1 w-6 rotate-45' : 'top-0 w-6'}`} />
              <span className={`absolute right-0 block h-px bg-ink transition-all duration-500 ease-expo ${open ? 'top-1 w-6 -rotate-45' : 'top-2 w-4 group-hover:w-6'}`} />
            </span>
          </button>
        </div>
      </header>

      {/* Right-edge progress rail */}
      <div className="hud pointer-events-none fixed right-[calc(var(--gutter)-6px)] top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex short:!hidden">
        <span className="label tabular-nums text-ink-2">{String(scene).padStart(2, '0')}</span>
        <div className="relative h-[120px] w-px bg-line-2">
          <motion.div className="absolute inset-x-0 top-0 h-full origin-top bg-accent shadow-[0_0_8px_rgba(140,203,255,0.9)]" style={{ scaleY: rail }} />
        </div>
        <span className="label tabular-nums">{String(SCENES.length - 1).padStart(2, '0')}</span>
      </div>

      {/* Current chapter, bottom-left */}
      <div className="hud pointer-events-none fixed bottom-6 left-[var(--gutter)] z-40 hidden h-10 overflow-hidden md:block short:!hidden">
        <AnimatePresence mode="wait">
          {scene > 0 && scene < SCENES.length - 1 && (
            <motion.div
              key={scene}
              className="flex flex-col"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <span className="label text-accent">/{String(scene).padStart(2, '0')}</span>
              <span className="display text-[13px] tracking-[0.1em]">{SCENES[scene].label}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Menu — compact glass panel under the Menu button */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="menu-scrim"
              className="fixed inset-0 z-[45] bg-bg/60 backdrop-blur-[6px]"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              aria-hidden
            />
            <motion.div
              key="menu-panel"
              className="menu-panel fixed right-[var(--gutter)] top-[78px] z-[55] max-h-[calc(100svh-90px)] w-[min(360px,calc(100vw-2*var(--gutter)))] origin-top-right overflow-y-auto overscroll-contain md:top-[88px] md:max-h-[calc(100svh-100px)]"
              data-lenis-prevent
              initial={{ opacity: 0, y: -10, scale: 0.97, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, scale: 0.98, filter: 'blur(4px)', transition: { duration: 0.3, ease: EASE } }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <div className="flex items-center justify-between px-5 pb-3 pt-4">
                <span className="label">Navigate</span>
                <span className="label tabular-nums">
                  <span className="text-ink-2">{String(scene).padStart(2, '0')}</span> / {String(SCENES.length - 1).padStart(2, '0')}
                </span>
              </div>

              <nav className="px-2">
                {SCENES.slice(1).map((s, i) => {
                  const active = scene === i + 1;
                  return (
                    <motion.a
                      key={s.id}
                      href={`#${s.id}`}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'true' : undefined}
                      className={`menu-row group ${active ? 'is-active' : ''}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, ease: EASE, delay: 0.08 + i * 0.04 }}
                    >
                      <span className={`label w-7 tabular-nums transition-colors duration-500 ${active ? 'text-accent' : 'group-hover:text-accent'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`display flex-1 text-[15px] tracking-[0.14em] transition-[color,transform] duration-500 ease-expo group-hover:translate-x-1 ${
                          active ? 'text-accent-2' : 'text-ink-2 group-hover:text-ink'
                        }`}
                      >
                        {s.label}
                      </span>
                      {active ? (
                        <span className="live-dot" aria-hidden />
                      ) : (
                        <span className="-translate-x-2 text-accent opacity-0 transition-all duration-500 ease-expo group-hover:translate-x-0 group-hover:opacity-100">
                          <ArrowUpRight size={11} />
                        </span>
                      )}
                    </motion.a>
                  );
                })}
              </nav>

              <motion.div
                className="mt-2 border-t border-line px-5 pb-4 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.35, duration: 0.6 } }}
              >
                <a href={`mailto:${EMAIL}`} className="u-link w-fit text-[13px] text-ink">{EMAIL}</a>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
                  <span className="label">Dhaka · <DhakaTime /></span>
                  <div className="flex gap-4">
                    {socials.map((s) => (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="label flex items-center gap-1 text-ink-2 transition-colors duration-300 hover:text-ink">
                        {s.label} <ArrowUpRight size={9} />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

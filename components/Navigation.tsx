'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { lenisInstance } from './SmoothScroll';

const LINKS = [
  { id: 'about',      label: 'About' },
  { id: 'work',       label: 'Work' },
  { id: 'journey',    label: 'Journey' },
  { id: 'vision',     label: 'Vision' },
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function Navigation() {
  const [elevated, setElevated] = useState(false);
  const [active, setActive]     = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [blasted, setBlasted]   = useState(false);
  const [blastOrigin, setBlastOrigin] = useState<{ x: number; y: number } | null>(null);

  const handleSayHello = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Scroll via Lenis for buttery smooth result; fall back to native
    const contact = document.getElementById('contact');
    if (contact) {
      if (lenisInstance) {
        lenisInstance.scrollTo(contact, { offset: -80, duration: 1.6 });
      } else {
        contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Blast fires only on the very first click
    if (!blasted) {
      setBlasted(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setBlastOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setTimeout(() => setBlastOrigin(null), 4000);
    }
  };

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const all = ['hero', ...LINKS.map(l => l.id), 'contact'];
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { threshold: 0.25 }
    );
    all.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* ── Desktop / tablet nav ── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease }}
        className="fixed top-5 left-0 right-0 z-50 flex items-center justify-center px-4 pointer-events-none"
      >
        <nav
          className={`pointer-events-auto flex items-center h-11 rounded-full px-1.5 gap-0.5 transition-all duration-500 ${
            elevated
              ? 'glass-md shadow-[0_8px_32px_rgba(0,0,0,0.55),0_0_0_1px_rgba(96,165,250,0.08)_inset]'
              : 'glass shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
          }`}
        >
          {/* Monogram */}
          <a
            href="#hero"
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 border border-accent/20 mr-1.5 shrink-0 transition-all hover:bg-accent/20"
            aria-label="Home"
          >
            <span className="font-display text-[13px] font-bold text-accent leading-none tracking-tight">SH</span>
          </a>

          {/* Links — hidden on mobile, visible sm+ */}
          {LINKS.map(l => (
            <NavLink key={l.id} href={`#${l.id}`} active={active === l.id}>
              {l.label}
            </NavLink>
          ))}

          {/* Divider */}
          <span className="hidden sm:block h-4 w-px bg-line-strong mx-1 shrink-0" />

          {/* CTA — Premium; hidden on mobile */}
          <a
            href="#contact"
            onClick={handleSayHello}
            className="nav-cta group hidden sm:flex items-center gap-1.5 h-8 px-4 rounded-full text-white font-sans text-[12.5px] tracking-[0.005em] transition-all duration-400 active:scale-[0.97] overflow-hidden relative"
            style={{ fontWeight: 600 }}
          >
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #1E40AF 100%)',
                backgroundSize: '200% 200%',
                animation: 'btn-gradient-shift 4s ease-in-out infinite',
              }}
            />
            {/* Hover: subtle white lift instead of gold */}
            <span
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'rgba(255,255,255,0.13)' }}
            />
            <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.30) 50%, transparent 70%)',
                  transform: 'translateX(-180%)',
                  animation: 'btn-auto-shimmer 5s ease-in-out infinite',
                }}
              />
            </span>
            <span className="relative z-10">Say hello</span>
            <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-[2px]">
              <Arrow />
            </span>
          </a>

          {/* Mobile hamburger (hidden on desktop via media query in parent) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden relative h-8 w-8 rounded-full glass flex items-center justify-center ml-0.5"
            aria-label="Open menu"
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </nav>
      </motion.header>

      {/* ── Blast effect — portal so it escapes nav's transform context ── */}
      {typeof document !== 'undefined' && blastOrigin &&
        createPortal(<BlastEffect x={blastOrigin.x} y={blastOrigin.y} />, document.body)
      }

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.3, ease }}
              className="fixed top-20 left-4 right-4 z-50 glass-strong rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(96,165,250,0.1)_inset]"
            >
              <div className="p-3 space-y-0.5">
                {LINKS.map(l => (
                  <a
                    key={l.id}
                    href={`#${l.id}`}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-medium transition-all duration-200 ${
                      active === l.id
                        ? 'text-accent bg-accent/[0.08]'
                        : 'text-[var(--text-2)] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {active === l.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    )}
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="px-3 pb-3">
                <a
                  href="#contact"
                  onClick={() => setMenuOpen(false)}
                  className="relative flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-white font-sans text-[14px] font-semibold overflow-hidden transition-all duration-400"
                  style={{
                    background:
                      'linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #1E40AF 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'btn-gradient-shift 4s ease-in-out infinite',
                    boxShadow:
                      '0 8px 24px rgba(37,99,235,0.40), 0 0 30px rgba(96,165,250,0.20)',
                    border: '1px solid rgba(96,165,250,0.30)',
                  }}
                >
                  <span className="relative z-10">Say hello</span>
                  <span className="relative z-10">
                    <Arrow />
                  </span>
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`hidden sm:flex relative px-3.5 py-1.5 rounded-full text-[13px] font-medium tracking-[0.004em] transition-all duration-200 group ${
        active ? 'text-white' : 'text-[var(--text-2)] hover:text-white'
      }`}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-full bg-accent/[0.12]"
          transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
        />
      )}
      {!active && (
        <span className="absolute inset-0 rounded-full bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
      <span className="relative z-10">{children}</span>
    </a>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[5px] h-4 w-5">
      <span className={`block h-px w-full bg-white/70 transition-all duration-300 origin-center ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
      <span className={`block h-px bg-white/70 transition-all duration-300 ${open ? 'w-0 opacity-0' : 'w-full'}`} />
      <span className={`block h-px w-full bg-white/70 transition-all duration-300 origin-center ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
    </div>
  );
}

function Arrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Premium blast animation ──────────────────────────────────────────────────

function BlastEffect({ x, y }: { x: number; y: number }) {
  const orbs = useMemo(() => [
    // Primary — 8 large orbs, wide spread
    ...Array.from({ length: 8 }, (_, i) => ({
      angle: (360 / 8) * i - 90,
      distance: 140 + Math.random() * 90,
      size: 6 + Math.random() * 3,
      color: i % 2 === 0 ? '#93C5FD' : '#BFDBFE',
      delay: 0.03,
      duration: 1.5 + Math.random() * 0.3,
    })),
    // Accent — 8 small orbs at offset angles, tighter radius
    ...Array.from({ length: 8 }, (_, i) => ({
      angle: (360 / 8) * i - 90 + 22.5,
      distance: 90 + Math.random() * 50,
      size: 3 + Math.random() * 2,
      color: '#60A5FA',
      delay: 0.02 + Math.random() * 0.04,
      duration: 1.2 + Math.random() * 0.25,
    })),
  ], []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>

      {/* 1 — White flash */}
      <motion.div
        style={{
          position: 'absolute', left: x, top: y,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff 0%, rgba(191,219,254,0.85) 35%, transparent 70%)',
        }}
        initial={{ width: 0, height: 0, opacity: 1 }}
        animate={{ width: 110, height: 110, opacity: 0 }}
        transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
      />

      {/* 2 — Glowing inner ring */}
      <motion.div
        style={{
          position: 'absolute', left: x, top: y,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: '2px solid #60A5FA',
          boxShadow: '0 0 22px rgba(96,165,250,0.75), 0 0 8px rgba(96,165,250,0.4) inset',
        }}
        initial={{ width: 8, height: 8, opacity: 1 }}
        animate={{ width: 180, height: 180, opacity: 0 }}
        transition={{ duration: 1.1, ease: [0.2, 0.8, 0.3, 1] }}
      />

      {/* 3 — Wide outer ring */}
      <motion.div
        style={{
          position: 'absolute', left: x, top: y,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: '1px solid rgba(147,197,253,0.4)',
        }}
        initial={{ width: 8, height: 8, opacity: 0.8 }}
        animate={{ width: 340, height: 340, opacity: 0 }}
        transition={{ duration: 1.7, delay: 0.15, ease: [0.2, 0.8, 0.3, 1] }}
      />

      {/* 4 — Orb particles */}
      {orbs.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute', left: x, top: y,
              width: p.size, height: p.size,
              borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 7}px ${p.color}55`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 1, x: 0, y: 0, scale: 2.2 }}
            animate={{ opacity: 0, x: tx, y: ty, scale: 0.2 }}
            transition={{ duration: p.duration, delay: p.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        );
      })}

      {/* 5 — Radial streak lines */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (360 / 8) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const tx = Math.cos(rad) * 110;
        const ty = Math.sin(rad) * 110;
        return (
          <motion.div
            key={`streak-${i}`}
            style={{
              position: 'absolute', left: x, top: y,
              width: 1.5, height: 32,
              borderRadius: 2,
              background: 'linear-gradient(to bottom, rgba(191,219,254,0.95) 0%, transparent 100%)',
              transformOrigin: '50% 0%',
              transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
            }}
            initial={{ opacity: 0.9, scaleY: 1, x: 0, y: 0 }}
            animate={{ opacity: 0, scaleY: 0.1, x: tx * 0.6, y: ty * 0.6 }}
            transition={{ duration: 1.0, delay: 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        );
      })}
    </div>
  );
}

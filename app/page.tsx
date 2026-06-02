import React from 'react';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Conviction from '@/components/Conviction';
import Work from '@/components/Work';
import Journey from '@/components/Journey';
import Vision from '@/components/Vision';
import Contact from '@/components/Contact';

export default function Home() {
  return (
    <main>
      <Hero />
      <MarqueeStrip />
      <Divider />
      <About />
      <Divider />
      <Conviction />
      <Divider />
      <Work />
      <Divider />
      <Journey />
      <Divider />
      <Vision />
      <Divider />
      <Contact />
    </main>
  );
}

function Divider() {
  return (
    <div className="mx-auto max-w-site px-5 sm:px-8">
      <div className="divider-glow" />
    </div>
  );
}

type MarqueeItem = { text: string; domain?: string; faded?: boolean; icon?: React.ReactNode; localLogo?: string };

const MARQUEE_ITEMS: MarqueeItem[] = [
  { text: 'Luminar Technology', domain: 'luminartechnology.com' },
  { text: 'Applied AI', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg> },
  { text: 'Prenda Solution', domain: 'prendasolution.com' },
  { text: 'Compute Infrastructure', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg> },
  { text: 'BanglaReels', domain: 'banglareels.com' },
  { text: 'Design Systems', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { text: 'Memorica', localLogo: '/memorica-logo.png' },
  { text: 'Product Strategy', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="2" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="22" y2="12"/></svg> },
  { text: 'AutoWorx', domain: 'autoworx.tech', faded: true },
  { text: 'TypeScript · Next.js', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
  { text: 'Levant IT', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
  { text: 'Venture Building', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg> },
];

function MarqueeStrip() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      className="relative overflow-hidden border-y"
      style={{
        borderColor: 'var(--border)',
        background: 'linear-gradient(90deg, rgba(15,26,46,0.50), rgba(11,18,32,0.30))',
      }}
    >
      <div className="py-[13px] marquee-track">
        {items.map((item, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className="px-7 flex items-center gap-2 shrink-0">
              {item.localLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.localLogo}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-md"
                  style={{ objectFit: 'contain', mixBlendMode: 'screen' }}
                />
              ) : item.domain ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-md"
                  style={{
                    imageRendering: 'crisp-edges',
                    opacity: item.faded ? 0.75 : 1,
                    mixBlendMode: item.faded ? 'screen' : 'normal',
                    filter: item.faded ? 'brightness(1.8) saturate(0.6)' : 'none',
                  }}
                />
              ) : (
                <span style={{ color: 'rgba(96,165,250,0.45)' }}>{item.icon}</span>
              )}
              <span
                className="text-[10px] font-mono tracking-[0.22em] uppercase whitespace-nowrap"
                style={{ color: 'var(--text-3)' }}
              >
                {item.text}
              </span>
            </span>
            <span
              className="h-[5px] w-[5px] rounded-full shrink-0"
              style={{
                background: i % 3 === 0
                  ? 'rgba(212,176,104,0.45)'
                  : i % 3 === 1
                    ? 'rgba(96,165,250,0.40)'
                    : 'rgba(255,255,255,0.18)',
                boxShadow: i % 3 === 0
                  ? '0 0 5px rgba(212,176,104,0.35)'
                  : i % 3 === 1
                    ? '0 0 5px rgba(96,165,250,0.30)'
                    : 'none',
              }}
            />
          </span>
        ))}
      </div>
      {/* Edge fades */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-20"
        style={{ background: 'linear-gradient(90deg, var(--bg), transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-20"
        style={{ background: 'linear-gradient(270deg, var(--bg), transparent)' }}
      />
    </div>
  );
}

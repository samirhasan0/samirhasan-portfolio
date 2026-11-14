'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { EMAIL, LINKEDIN, socials, ventures } from './data';
import { ArrowRight, ArrowUpRight, ChapterLabel, DhakaTime, EASE, Lines } from './ui';

const reasons = ['Start a project', 'Partnership', 'Venture pitch', 'Just say hi'];

export default function Contact() {
  const [reason, setReason] = useState(reasons[0]);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email, message, reason }),
      });
      if (!res.ok) throw new Error('failed');
      setState('done');
      setName('');
      setCompany('');
      setEmail('');
      setMessage('');
      setTimeout(() => setState('idle'), 6000);
    } catch {
      setState('error');
    }
  };

  return (
    <section id="contact" className="relative">
      {/* Title over the portal */}
      <div className="flex min-h-[100svh] flex-col items-center justify-end px-[var(--gutter)] pb-[14vh] text-center [text-shadow:0_1px_2px_rgba(0,3,11,0.9),0_0_18px_rgba(0,3,11,0.75)]">
        <ChapterLabel n={6}>Contact</ChapterLabel>
        <h2 className="display glow-text mt-6 text-[clamp(44px,8vw,136px)]">
          <Lines lines={['Let’s talk.']} />
        </h2>
        <motion.a
          href={`mailto:${EMAIL}`}
          className="group mt-10 inline-flex items-center gap-4 text-[clamp(18px,2vw,26px)]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
        >
          <span className="u-link">{EMAIL}</span>
          <span className="grid h-10 w-10 place-items-center border border-line-3 transition-all duration-500 ease-expo group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-bg">
            <ArrowUpRight />
          </span>
        </motion.a>
      </div>

      {/* Panel */}
      <div className="px-[var(--gutter)] pb-24">
        <motion.div
          className="glass mx-auto grid max-w-[1180px] grid-cols-1 lg:grid-cols-12"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 1.2, ease: EASE }}
        >
          <div className="flex flex-col justify-between gap-10 border-b border-line-2 p-6 md:p-10 lg:col-span-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-line-3">
                <Image src="/samir.jpg" alt="Samir Hasan" fill sizes="64px" className="object-cover grayscale" />
              </div>
              <div>
                <p className="display text-[18px]">Samir Hasan</p>
                <p className="text-[13px] text-ink-2">Founder & CEO, Luminar Technology</p>
              </div>
            </div>
            <p className="max-w-[380px] text-[16px] leading-[1.65] text-ink-2">
              I read everything personally. Short messages with clear intent get the fastest responses.
              Pitches, proposals, and introductions are all welcome.
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
              {[
                { k: 'Direct', v: EMAIL, href: `mailto:${EMAIL}` },
                { k: 'LinkedIn', v: LINKEDIN.handle, href: LINKEDIN.href },
                { k: 'Ventures', v: 'luminartechnology.com', href: 'https://luminartechnology.com' },
                { k: 'Location', v: 'Dhaka, Bangladesh' },
                { k: 'Local time', v: <DhakaTime /> },
              ].map((d) => (
                <div key={d.k} className="min-w-0 border-t border-line-2 pt-3">
                  <dt className="label">{d.k}</dt>
                  <dd className="mt-1.5 truncate text-[14px] text-ink">
                    {d.href ? (
                      <a href={d.href} target={d.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="u-link">
                        {d.v}
                      </a>
                    ) : (
                      d.v
                    )}
                  </dd>
                </div>
              ))}
              <div className="col-span-2 border-t border-line-2 pt-3">
                <dt className="label">Currently</dt>
                <dd className="mt-1.5 flex items-center gap-2 text-[14px] text-ink-2">
                  <span className="live-dot" /> Building Luminar / OS · Private Beta
                </dd>
              </div>
            </dl>
          </div>

          <form onSubmit={submit} className="p-6 md:p-10 lg:col-span-7">
            <fieldset>
              <legend className="label mb-4">Reason</legend>
              <div className="flex flex-wrap gap-2">
                {reasons.map((r) => {
                  const on = r === reason;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      aria-pressed={on}
                      className={`relative isolate border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 ${
                        on ? 'border-accent text-bg' : 'border-line-2 text-ink-2 hover:border-line-3 hover:text-ink'
                      }`}
                    >
                      {on && <motion.span layoutId="reason" className="absolute inset-0 -z-10 bg-accent" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                      {r}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
              <label className="block">
                <span className="sr-only">Name</span>
                <input className="field" placeholder="Your name *" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
              <label className="block">
                <span className="sr-only">Company or role</span>
                <input className="field" placeholder="Company / role" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
              </label>
              <label className="block md:col-span-2">
                <span className="sr-only">Email</span>
                <input className="field" type="email" placeholder="Email address *" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </label>
              <label className="block md:col-span-2">
                <span className="sr-only">Message</span>
                <textarea className="field" rows={4} placeholder="Tell me what you’re building *" required value={message} onChange={(e) => setMessage(e.target.value)} />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <AnimatePresence mode="wait">
                {state === 'done' ? (
                  <motion.p key="done" className="text-[14px] text-accent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Message sent — I’ll be in touch.
                  </motion.p>
                ) : state === 'error' ? (
                  <motion.p key="err" className="text-[14px] text-[#ff8a8a]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Something went wrong. Email me directly instead.
                  </motion.p>
                ) : (
                  <motion.p key="idle" className="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Replies within 72h · Usually sooner.
                  </motion.p>
                )}
              </AnimatePresence>
              <button type="submit" disabled={state === 'sending'} className="btn btn-solid disabled:opacity-60">
                {state === 'sending' ? 'Sending…' : 'Send message'} <ArrowRight size={12} />
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Footer — as on samirhasan.com */}
      <footer className="relative border-t border-line bg-[linear-gradient(180deg,rgba(0,3,11,0.55),rgba(0,3,11,0.92))] px-[var(--gutter)] pb-8 pt-14 backdrop-blur-xl">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-10 md:grid-cols-12">
          <div className="col-span-2 md:col-span-6">
            <p className="display hl w-fit text-[clamp(26px,2.6vw,36px)] tracking-[0.04em]">Samir Hasan</p>
            <p className="label mt-3">Founder · Luminar Technology · Dhaka</p>
            <p className="label mt-5 flex items-center gap-2.5 text-ink-2">
              <span className="live-dot" /> Open to new conversations
            </p>
          </div>
          <nav className="md:col-span-2" aria-label="Connect">
            <p className="label mb-4">Connect</p>
            <ul className="flex flex-col gap-2.5">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="u-link text-[14px] text-ink-2 hover:text-ink">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="md:col-span-4" aria-label="Ventures">
            <p className="label mb-4">Ventures</p>
            <ul className="flex flex-col gap-2.5">
              {ventures.map((v) => (
                <li key={v.label}>
                  <a href={v.href} target="_blank" rel="noopener noreferrer" className="u-link text-[14px] text-ink-2 hover:text-ink">
                    {v.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mx-auto mt-14 flex max-w-[1180px] flex-col gap-3 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <span className="label">© {new Date().getFullYear()} Samir Hasan. All rights reserved.</span>
          <a href="#top" className="label text-ink-2 hover:text-ink">Back to start ↑</a>
          <span className="label">Built with purpose · Dhaka, BD</span>
        </div>
      </footer>
    </section>
  );
}

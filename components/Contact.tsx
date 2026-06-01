'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, FormEvent } from 'react';

const reasons = [
  'Work together',
  'Hire / speaking',
  'Venture pitch',
  'Just say hi',
];

export default function Contact() {
  const [reason, setReason] = useState('Work together');
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [popKey, setPopKey] = useState(0);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(false);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email, message, reason }),
      });
      if (!res.ok) throw new Error('failed');
      setDone(true);
      setTimeout(() => setDone(false), 5000);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section id="contact" className="relative py-28 md:py-44 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-alt/60 to-transparent" />
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[50vh] w-[70vw]"
          style={{
            background:
              'radial-gradient(ellipse, rgba(37,99,235,0.14) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-site px-5 sm:px-8">
          {/* Header */}
          <div className="mb-14 md:mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.2, 0.6, 0.2, 1] }}
              className="eyebrow mb-7"
            >
              05 — Contact
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, ease: [0.2, 0.6, 0.2, 1] }}
              className="font-display tracking-ultra text-white leading-[1.0]"
              style={{ fontSize: 'clamp(42px, 7vw, 96px)' }}
            >
              Let&apos;s talk.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.15,
                duration: 0.8,
                ease: [0.2, 0.6, 0.2, 1],
              }}
              className="mt-6 text-[17px] text-ink-2 max-w-prose leading-[1.7]"
              style={{ fontWeight: 300 }}
            >
              I read everything personally. Short messages with clear intent get
              the fastest responses. Pitches, proposals, and introductions are
              all welcome.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.85, ease: [0.2, 0.6, 0.2, 1] }}
              className="lg:col-span-7 glass-strong rounded-3xl p-7 sm:p-10 relative overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
              {/* Corner glow */}
              <div
                className="pointer-events-none absolute top-0 right-0 h-32 w-32 opacity-30"
                style={{
                  background:
                    'radial-gradient(circle at top right, rgba(37,99,235,0.15) 0%, transparent 70%)',
                }}
              />

              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.2, 0.6, 0.2, 1] }}
                    className="flex flex-col items-center justify-center gap-6 py-16 text-center"
                  >
                    {/* Check mark */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', bounce: 0.4 }}
                      className="h-16 w-16 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center"
                      style={{ boxShadow: '0 0 30px rgba(37,99,235,0.25)' }}
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 28 28"
                        fill="none"
                      >
                        <motion.path
                          d="M5 14l7 7L23 7"
                          stroke="#60A5FA"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        />
                      </svg>
                    </motion.div>
                    <div>
                      <p className="font-display text-[28px] text-white tracking-tight">
                        Message sent.
                      </p>
                      <p className="mt-2 text-[15px] text-ink-2 font-light">
                        I&apos;ll get back to you within 72 hours.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={submit}
                    className="space-y-8"
                  >
                    {/* Reason chips */}
                    <div>
                      <FieldLabel>Reason</FieldLabel>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {reasons.map((r) => {
                          const isSelected = reason === r;
                          return (
                            <motion.button
                              key={r}
                              type="button"
                              onClick={() => {
                                setReason(r);
                                setPopKey((k) => k + 1);
                              }}
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.94 }}
                              transition={{
                                type: 'spring',
                                stiffness: 380,
                                damping: 22,
                              }}
                              className={`px-3.5 py-2 rounded-full text-[12px] font-mono tracking-wide transition-all duration-300 backdrop-blur-sm ${
                                isSelected
                                  ? 'bg-[rgba(37,99,235,0.18)] border border-[rgba(96,165,250,0.55)] text-white shadow-[0_0_20px_rgba(37,99,235,0.30),0_0_0_1px_rgba(212,176,104,0.20)_inset]'
                                  : 'bg-[rgba(37,99,235,0.05)] border border-[rgba(96,165,250,0.15)] text-[#E2E8F0] hover:border-[rgba(96,165,250,0.40)] hover:text-white hover:bg-[rgba(37,99,235,0.10)] hover:shadow-[0_0_14px_rgba(37,99,235,0.20)]'
                              }`}
                            >
                              {r}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <AnimatedInputField
                        label="Name"
                        placeholder="Your name"
                        value={name}
                        onChange={setName}
                        required
                      />
                      <AnimatedInputField
                        label="Company / Role"
                        placeholder="Where you're from"
                        value={company}
                        onChange={setCompany}
                      />
                    </div>

                    <AnimatedInputField
                      label="Email"
                      placeholder="your@email.com"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      required
                    />

                    <div>
                      <FieldLabel>Message</FieldLabel>
                      <textarea
                        rows={5}
                        required
                        placeholder="Keep it direct. A paragraph is plenty."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-3 w-full bg-transparent border-0 border-b border-line text-white placeholder-ink-3 text-[15px] focus:outline-none focus:border-accent pb-3 transition-colors resize-none leading-relaxed"
                        style={{ fontWeight: 300 }}
                      />
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[13px] text-red-400 font-mono"
                      >
                        Something went wrong. Please try again.
                      </motion.p>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 pt-2">
                      <span className="text-[11px] font-mono text-ink-3 tracking-wide">
                        Replies within 72h · Usually sooner.
                      </span>
                      <motion.button
                        type="submit"
                        className="btn btn-primary"
                        data-cursor
                        disabled={sending}
                        whileHover={sending ? {} : { scale: 1.03 }}
                        whileTap={sending ? {} : { scale: 0.97 }}
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 22,
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {sending ? (
                            <motion.span
                              key="sending"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center gap-2"
                            >
                              <span className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
                              Sending…
                            </motion.span>
                          ) : (
                            <motion.span
                              key={error ? 'retry' : 'idle'}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center gap-2"
                            >
                              {error ? 'Resend' : 'Send message'} <Arrow />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Info column */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                delay: 0.12,
                duration: 0.85,
                ease: [0.2, 0.6, 0.2, 1],
              }}
              className="lg:col-span-5 space-y-3"
            >
              {[
                {
                  label: 'Direct',
                  value: 'hello@samirhasan.com',
                  href: 'mailto:hello@samirhasan.com',
                },
                {
                  label: 'LinkedIn',
                  value: 'samir-hasan',
                  href: 'https://www.linkedin.com/in/samir-hasan-18048524a/',
                },
                {
                  label: 'Ventures',
                  value: 'luminartechnology.com',
                  href: 'https://luminartechnology.com',
                  target: '_blank' as const,
                },
                { label: 'Location', value: 'Dhaka, Bangladesh', href: '#', target: undefined as undefined },
              ].map((c, i) => (
                <motion.a
                  key={c.label}
                  href={c.href}
                  target={c.target}
                  rel={c.target === '_blank' ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.1 + i * 0.07,
                    duration: 0.65,
                    ease: [0.2, 0.6, 0.2, 1],
                  }}
                  whileHover={{ x: 3 }}
                  className="glass rounded-2xl p-5 flex items-center justify-between group hover:border-accent/22 hover:bg-surface-strong transition-all"
                  data-cursor
                >
                  <div>
                    <div className="text-[10px] font-mono tracking-widest uppercase text-ink-3 mb-1.5">
                      {c.label}
                    </div>
                    <div className="text-[14px] text-ink group-hover:text-white transition-colors">
                      {c.value}
                    </div>
                  </div>
                  <ExternalIcon />
                </motion.a>
              ))}

              {/* Status card */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.42,
                  duration: 0.65,
                  ease: [0.2, 0.6, 0.2, 1],
                }}
                className="glass rounded-2xl p-5 relative overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                <div className="text-[10px] font-mono tracking-widest uppercase text-ink-3 mb-3">
                  Currently
                </div>
                <div className="flex items-center gap-2.5 text-[14px] text-ink-2">
                  <span className="pulse-dot-wrap">
                    <span className="dot" />
                  </span>
                  Building Luminar / OS · Private Beta
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Subtle gradient background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(15,26,46,0.40) 100%)',
          }}
        />
        {/* Top accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent" />
        {/* Gold shimmer */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 mx-auto max-w-site px-5 sm:px-8 py-14 md:py-20">
          {/* Main footer row */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-0">
            {/* Brand column */}
            <div className="flex flex-col gap-4">
              <div>
                <span className="font-display italic text-[30px] text-gradient leading-none">
                  Samir Hasan
                </span>
                <p className="mt-2 text-[11px] font-mono text-ink-3 tracking-[0.20em] uppercase">
                  Founder · Luminar Technology · Dhaka
                </p>
              </div>
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border-line text-[10px] font-mono tracking-wide text-ink-3 w-fit">
                <span className="pulse-dot-wrap scale-75">
                  <span className="dot" />
                </span>
                Open to new conversations
              </div>
            </div>

            {/* Links columns */}
            <div className="flex flex-wrap gap-10 sm:gap-16">
              <div>
                <p className="text-[9.5px] font-mono tracking-[0.22em] uppercase text-ink-3 mb-4">
                  Connect
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/samir-hasan-18048524a/', icon: <LinkedInIcon /> },
                    { label: 'Instagram', href: 'https://www.instagram.com/samir_hasann_/', icon: <InstagramIcon /> },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target={s.href !== '#' ? '_blank' : undefined}
                      rel={s.href !== '#' ? 'noopener noreferrer' : undefined}
                      className="flex items-center gap-2.5 text-[13px] text-ink-2 hover:text-white transition-colors duration-200 group"
                      data-cursor
                    >
                      <span className="text-ink-3 group-hover:text-accent transition-colors duration-200">
                        {s.icon}
                      </span>
                      <span className="relative">
                        {s.label}
                        <span className="absolute -bottom-px left-0 h-px w-0 group-hover:w-full bg-accent/50 transition-all duration-300" />
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9.5px] font-mono tracking-[0.22em] uppercase text-ink-3 mb-4">
                  Ventures
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Luminar Technology', href: 'https://luminartechnology.com' },
                    { label: 'AutoWorx', href: 'https://autoworx.tech/' },
                    { label: 'Prenda Solution', href: 'https://prendasolution.com' },
                    { label: 'BanglaReels', href: 'https://banglareels.com' },
                    { label: 'Memorica', href: 'https://www.memorica.events' },
                  ].map((v) => (
                    <a
                      key={v.label}
                      href={v.href}
                      target={v.href !== '#' ? '_blank' : undefined}
                      rel={v.href !== '#' ? 'noopener noreferrer' : undefined}
                      className="text-[13px] text-ink-2 hover:text-white transition-colors duration-200 relative group"
                      data-cursor
                    >
                      {v.label}
                      <span className="absolute -bottom-px left-0 h-px w-0 group-hover:w-full bg-gold/40 transition-all duration-300" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[11px] font-mono text-ink-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span>© 2026 Samir Hasan. All rights reserved.</span>
            <span
              style={{
                background: 'linear-gradient(90deg, var(--text-3), rgba(96,165,250,0.6))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Built with purpose · Dhaka, BD
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-mono tracking-widest uppercase text-ink-3">
      {children}
    </span>
  );
}

function AnimatedInputField({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="mt-3 w-full bg-transparent border-0 border-b text-white placeholder-ink-3 text-[15px] focus:outline-none pb-3 transition-colors"
        style={{
          fontWeight: 300,
          borderBottomColor: focused
            ? 'var(--accent)'
            : 'rgba(255,255,255,0.065)',
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-px bg-accent"
        animate={{ width: focused ? '100%' : '0%', opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0.6, 0.2, 1] }}
        style={{ boxShadow: '0 0 8px rgba(37,99,235,0.6)' }}
      />
    </div>
  );
}

function Arrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="text-ink-3 group-hover:text-white transition-colors"
    >
      <path
        d="M2 12L12 2M12 2H5M12 2V9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

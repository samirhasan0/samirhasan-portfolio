'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BPM  = 60;
const BEAT = 60 / BPM;

type Note = { freq: number; beats: number };

const MELODY: Note[] = [
  { freq: 440.00, beats: 2   },
  { freq: 349.23, beats: 2   },
  { freq: 440.00, beats: 1.5 },
  { freq: 392.00, beats: 0.5 },
  { freq: 440.00, beats: 1   },
  { freq: 392.00, beats: 1   },
  { freq: 349.23, beats: 2   },
  { freq: 329.63, beats: 1   },
  { freq: 293.66, beats: 1   },
  { freq: 349.23, beats: 3   },
  { freq: 293.66, beats: 1   },
  { freq: 392.00, beats: 2   },
  { freq: 440.00, beats: 2   },
  { freq: 466.16, beats: 2   },
  { freq: 440.00, beats: 2   },
  { freq: 392.00, beats: 2   },
  { freq: 349.23, beats: 1   },
  { freq: 392.00, beats: 1   },
  { freq: 440.00, beats: 4   },
];

const BASS: Note[] = [
  { freq:  73.42, beats: 8 },
  { freq:  58.27, beats: 8 },
  { freq:  87.31, beats: 8 },
  { freq: 110.00, beats: 8 },
];

type Chord = { freqs: number[]; beats: number };
const CHORDS: Chord[] = [
  { freqs: [146.83, 174.61, 220.00, 261.63], beats: 8 },
  { freqs: [116.54, 146.83, 174.61, 220.00], beats: 8 },
  { freqs: [174.61, 220.00, 261.63, 329.63], beats: 8 },
  { freqs: [220.00, 261.63, 329.63, 392.00], beats: 8 },
];

function makeReverb(ctx: AudioContext): ConvolverNode {
  const len     = ctx.sampleRate * 3.8;
  const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
  }
  const conv = ctx.createConvolver();
  conv.buffer = impulse;
  return conv;
}

function scheduleTone(
  ctx: AudioContext,
  dest: AudioNode,
  revSend: AudioNode,
  freq: number,
  startTime: number,
  durSec: number,
  kind: 'melody' | 'bass' | 'pad',
) {
  const noteEnd = startTime + durSec;

  const partials: Array<{ mult: number; vol: number }> =
    kind === 'melody' ? [{ mult: 1, vol: 0.09 }, { mult: 2, vol: 0.020 }, { mult: 3, vol: 0.006 }]
    : kind === 'bass' ? [{ mult: 1, vol: 0.075 }, { mult: 2, vol: 0.010 }]
    :                   [{ mult: 1, vol: 0.016 }];

  const [attack, decay, sustain, release] =
    kind === 'melody' ? [0.09,  0.50, 0.72, 2.4]
    : kind === 'bass' ? [0.20,  0.80, 0.55, 2.0]
    :                   [0.60,  1.20, 0.65, 4.0];

  partials.forEach(({ mult, vol }) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq * mult;

    if (kind === 'melody' && mult === 1) {
      const vibLfo  = ctx.createOscillator();
      const vibGain = ctx.createGain();
      vibLfo.frequency.value = 4.5;
      vibGain.gain.value     = freq * 0.005;
      vibLfo.connect(vibGain);
      vibGain.connect(osc.frequency);
      vibLfo.start(startTime + 0.40);
      vibLfo.stop(noteEnd + release + 0.1);
    }

    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(vol, startTime + attack);
    env.gain.exponentialRampToValueAtTime(vol * sustain, startTime + attack + decay);
    env.gain.exponentialRampToValueAtTime(0.0001, noteEnd + release);

    osc.connect(env);
    env.connect(dest);
    if (kind !== 'bass') env.connect(revSend);

    osc.start(startTime);
    osc.stop(noteEnd + release + 0.1);
  });
}

type Props = {
  audioChoice: boolean | null;
  audioCtxRef?: React.MutableRefObject<AudioContext | null>;
};

export default function MusicPlayer({ audioChoice, audioCtxRef }: Props) {
  const [playing, setPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);

  const ctxRef    = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cursorRef = useRef({
    melodyIdx: 0, nextMelody: 0,
    bassIdx:   0, nextBass:   0,
    chordIdx:  0, nextChord:  0,
  });

  useEffect(() => { setMounted(true); }, []);

  const stopMusic = useCallback(() => {
    if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; }
    const ctx    = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.5);
    masterRef.current = null;
  }, []);

  const startMusic = useCallback(async () => {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctxRef.current) {
      // Reuse the context created synchronously in the tap handler (needed for iOS)
      ctxRef.current = audioCtxRef?.current ?? new AudioCtx();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.82, ctx.currentTime + 5);
    master.connect(ctx.destination);
    masterRef.current = master;

    const conv    = makeReverb(ctx);
    const revGain = ctx.createGain();
    revGain.gain.value = 0.32;
    conv.connect(revGain);
    revGain.connect(master);

    const revSend = ctx.createGain();
    revSend.gain.value = 1;
    revSend.connect(conv);

    const c = cursorRef.current;
    const startAt = ctx.currentTime + 0.1;
    c.melodyIdx = 0; c.nextMelody = startAt;
    c.bassIdx   = 0; c.nextBass   = startAt;
    c.chordIdx  = 0; c.nextChord  = startAt;

    const AHEAD = 0.20;

    const tick = () => {
      const lookahead = ctx.currentTime + AHEAD;

      while (c.nextMelody < lookahead) {
        const n   = MELODY[c.melodyIdx % MELODY.length];
        const dur = n.beats * BEAT;
        scheduleTone(ctx, master, revSend, n.freq, c.nextMelody, dur, 'melody');
        c.nextMelody += dur;
        c.melodyIdx = (c.melodyIdx + 1) % MELODY.length;
      }

      while (c.nextBass < lookahead) {
        const n   = BASS[c.bassIdx % BASS.length];
        const dur = n.beats * BEAT;
        scheduleTone(ctx, master, revSend, n.freq, c.nextBass, dur, 'bass');
        c.nextBass += dur;
        c.bassIdx = (c.bassIdx + 1) % BASS.length;
      }

      while (c.nextChord < lookahead) {
        const chord = CHORDS[c.chordIdx % CHORDS.length];
        const dur   = chord.beats * BEAT;
        chord.freqs.forEach(f =>
          scheduleTone(ctx, master, revSend, f, c.nextChord, dur, 'pad'),
        );
        c.nextChord += dur;
        c.chordIdx = (c.chordIdx + 1) % CHORDS.length;
      }
    };

    tick();
    tickerRef.current = setInterval(tick, 25);
  }, []);

  // Auto-start or stay silent based on user's choice from the loader
  useEffect(() => {
    if (audioChoice === true) {
      startMusic();
      setPlaying(true);
    }
  }, [audioChoice]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    if (playing) { stopMusic(); setPlaying(false); }
    else         { startMusic(); setPlaying(true); }
  }, [playing, startMusic, stopMusic]);

  useEffect(() => () => {
    stopMusic();
    ctxRef.current?.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Only render after the loader has been dismissed
  if (!mounted || audioChoice === null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 14 }}
      animate={{ opacity: 1, scale: 1,   y: 0  }}
      transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.94 }}
            animate={{ opacity: 1, x: 0,  scale: 1    }}
            exit={{    opacity: 0, x: 10, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="absolute right-[52px] top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div
              className="glass rounded-lg px-3 py-1.5 whitespace-nowrap"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
            >
              <span className="text-[10px] font-mono tracking-[0.18em] uppercase" style={{ color: 'var(--text-3)' }}>
                {playing ? 'ambient · on' : 'ambient · off'}
              </span>
            </div>
            <span
              className="absolute right-[-5px] top-1/2 -translate-y-1/2 border-4 border-transparent"
              style={{ borderLeftColor: 'rgba(96,165,250,0.10)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button blinks when music is off */}
      <motion.button
        onClick={toggle}
        aria-label={playing ? 'Stop ambient music' : 'Play ambient music'}
        animate={!playing ? { opacity: [1, 0.38, 1] } : { opacity: 1 }}
        transition={
          !playing
            ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
        className="relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 hover:scale-110 active:scale-[0.93] focus:outline-none"
        style={{
          background: playing
            ? 'linear-gradient(135deg, rgba(37,99,235,0.22) 0%, rgba(96,165,250,0.14) 100%)'
            : 'rgba(11,18,32,0.82)',
          border: playing ? '1px solid rgba(96,165,250,0.42)' : '1px solid rgba(96,165,250,0.16)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          boxShadow: playing
            ? '0 0 0 1px rgba(96,165,250,0.12) inset, 0 0 28px rgba(96,165,250,0.28), 0 8px 28px rgba(0,0,0,0.55)'
            : '0 0 0 1px rgba(96,165,250,0.05) inset, 0 8px 24px rgba(0,0,0,0.45)',
        }}
      >
        {playing && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid rgba(96,165,250,0.35)' }}
              animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid rgba(96,165,250,0.20)' }}
              animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
            />
          </>
        )}

        <div className="relative z-10 flex items-end gap-[3.5px]" style={{ height: 18 }}>
          {([0.55, 1, 0.72] as const).map((base, i) => (
            <motion.span
              key={i}
              className="block w-[3px] rounded-full"
              style={{
                background: playing ? 'linear-gradient(to top, #2563EB, #60A5FA)' : 'var(--text-3)',
                minHeight: 3,
              }}
              animate={
                playing
                  ? { height: [base * 7, base * 18, base * 11, base * 16, base * 6, base * 18] }
                  : { height: base * 10 }
              }
              transition={
                playing
                  ? { duration: 1.8 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }
                  : { duration: 0.35 }
              }
            />
          ))}
        </div>
      </motion.button>
    </motion.div>
  );
}

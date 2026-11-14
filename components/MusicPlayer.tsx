'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

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
  }, [audioCtxRef]);

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
    <motion.button
      onClick={toggle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 1 }}
      aria-label={playing ? 'Turn ambient sound off' : 'Turn ambient sound on'}
      aria-pressed={playing}
      className="hud group fixed right-[calc(var(--gutter)+36px)] top-[19px] sm:right-[calc(var(--gutter)+96px)] z-[60] flex h-11 items-center gap-3 px-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 transition-colors hover:text-ink md:top-[29px]"
    >
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[0.5, 1, 0.7, 0.85].map((base, i) => (
          <motion.span
            key={i}
            className={`block w-[2px] ${playing ? 'bg-accent' : 'bg-ink-3'}`}
            animate={playing ? { height: [base * 4, base * 12, base * 6, base * 11, base * 4] } : { height: 2 }}
            transition={playing ? { duration: 1.4 + i * 0.25, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        ))}
      </span>
      <span className="hidden sm:inline">
        Sound <span className={playing ? 'text-ink' : 'text-ink-3'}>{playing ? 'On' : 'Off'}</span>
      </span>
    </motion.button>
  );
}

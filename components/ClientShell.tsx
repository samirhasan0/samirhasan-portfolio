'use client';

import { useState, useRef, useCallback } from 'react';
import IntroLoader from './IntroLoader';
import MusicPlayer from './MusicPlayer';

export default function ClientShell() {
  const [audioChoice, setAudioChoice] = useState<boolean | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleEnter = useCallback((withAudio: boolean) => {
    if (withAudio) {
      // Must create + resume AudioContext synchronously inside the tap handler
      // or iOS Safari will block it entirely
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        ctx.resume();
        audioCtxRef.current = ctx;
      } catch (_) {}
    }
    setAudioChoice(withAudio);
  }, []);

  return (
    <>
      <IntroLoader onEnter={handleEnter} />
      <MusicPlayer audioChoice={audioChoice} audioCtxRef={audioCtxRef} />
    </>
  );
}

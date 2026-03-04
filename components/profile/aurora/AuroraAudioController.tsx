// components/profile/aurora/AuroraAudioController.tsx
// components/profile/aurora/AuroraAudioController.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  audioUrl: string | null;
  onStart?: () => void;
  onEnd?: () => void;
  onEnergy?: (energy01: number) => void;
  onError?: (err: string) => void;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export default function AuroraAudioController({
  audioUrl,
  onStart,
  onEnd,
  onEnergy,
  onError,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);

  const startedRef = useRef(false);

  useEffect(() => {
    // stop any existing playback
    const cleanup = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = "";
        } catch {}
        audioRef.current = null;
      }
      if (ctxRef.current) {
        try {
          ctxRef.current.close();
        } catch {}
        ctxRef.current = null;
      }
      analyserRef.current = null;
      dataRef.current = null;
      startedRef.current = false;

      onEnergy?.(0);
    };

    if (!audioUrl) {
      cleanup();
      return;
    }

    let mounted = true;

    async function start() {
      cleanup();

      try {
        const audio = new Audio(audioUrl as string);
        audio.crossOrigin = "anonymous";
        audioRef.current = audio;

        const ctx = new AudioContext();
        ctxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.85;
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.fftSize);

        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audio.onplay = () => {
          if (!mounted) return;
          startedRef.current = true;
          onStart?.();
        };

        audio.onended = () => {
          if (!mounted) return;
          onEnergy?.(0);
          onEnd?.();
        };

        audio.onerror = () => {
          if (!mounted) return;
          onEnergy?.(0);
          onError?.("Audio playback error");
          onEnd?.();
        };

        await ctx.resume();

        // user gesture should exist (message send). still can fail on iOS if not gesture:
        await audio.play();

        const tick = () => {
          if (!mounted) return;
          rafRef.current = requestAnimationFrame(tick);

          const analyser = analyserRef.current;
          const data = dataRef.current;
          if (!analyser || !data) return;

          analyser.getByteTimeDomainData(data as Uint8Array<ArrayBuffer>);

          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          // scale into nicer 0..1
          const energy = clamp01(rms * 3.2);
          onEnergy?.(energy);
        };

        tick();
      } catch (e: any) {
        onEnergy?.(0);
        onError?.(e?.message || "Audio init failed");
        onEnd?.();
      }
    }

    start();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [audioUrl, onStart, onEnd, onEnergy, onError]);

  return null;
}
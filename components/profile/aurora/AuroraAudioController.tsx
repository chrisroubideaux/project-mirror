// components/profile/aurora/AuroraAudioController.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  audioUrl: string | null;
  token: string | null;
  onStart?: () => void;
  onEnd?: () => void;
  onEnergy?: (energy01: number) => void;
  onError?: (err: string) => void;
};

export default function AuroraAudioController({
  audioUrl,
  token,
  onStart,
  onEnd,
  onEnergy,
  onError,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const onEnergyRef = useRef(onEnergy);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onStartRef.current = onStart;
  }, [onStart]);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    onEnergyRef.current = onEnergy;
  }, [onEnergy]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const cleanupObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      onStartRef.current?.();
    };

    const handleEnded = () => {
      onEnergyRef.current?.(0);
      onEndRef.current?.();
    };

    const handleError = () => {
      onEnergyRef.current?.(0);
      onErrorRef.current?.("Failed to load or play Aurora audio.");
      onEndRef.current?.();
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);

      try {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      } catch {}

      cleanupObjectUrl();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;

    const run = async () => {
      try {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      } catch {}

      cleanupObjectUrl();

      if (!audioUrl) return;

      if (!token) {
        onErrorRef.current?.("Missing auth token for audio request.");
        onEndRef.current?.();
        return;
      }

      try {
        const res = await fetch(audioUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Audio HTTP ${res.status} ${txt}`.trim());
        }

        const blob = await res.blob();

        if (!blob || blob.size <= 0) {
          throw new Error("Audio blob was empty.");
        }

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;

        if (cancelled) return;

        audio.src = objectUrl;
        audio.load();
        await audio.play();
      } catch (e: any) {
        if (cancelled) return;
        onErrorRef.current?.(e?.message || "Audio playback failed.");
        onEndRef.current?.();
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [audioUrl, token]);

  return <audio ref={audioRef} style={{ display: "none" }} playsInline preload="auto" />;
}


{/*

// components/profile/aurora/AuroraAudioController.tsx

"use client";

import { useEffect, useRef } from "react";

type Props = {
  audioUrl: string | null;
  token: string | null;
  onStart?: () => void;
  onEnd?: () => void;
  onEnergy?: (energy01: number) => void;
  onError?: (err: string) => void;
};

export default function AuroraAudioController({
  audioUrl,
  token,
  onStart,
  onEnd,
  onEnergy,
  onError,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanupObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      onStart?.();
    };

    const handleEnded = () => {
      onEnergy?.(0);
      onEnd?.();
    };

    const handleError = () => {
      onEnergy?.(0);
      onError?.("Failed to load or play Aurora audio.");
      onEnd?.();
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);

      try {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      } catch {}

      cleanupObjectUrl();
    };
  }, [onEnd, onEnergy, onError, onStart]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;

    const run = async () => {
      try {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      } catch {}

      cleanupObjectUrl();

      if (!audioUrl) return;

      if (!token) {
        onError?.("Missing auth token for audio request.");
        onEnd?.();
        return;
      }

      try {
        const res = await fetch(audioUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Audio HTTP ${res.status} ${txt}`.trim());
        }

        const blob = await res.blob();

        if (!blob || blob.size <= 0) {
          throw new Error("Audio blob was empty.");
        }

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;

        if (cancelled) return;

        audio.src = objectUrl;
        audio.load();
        await audio.play();
      } catch (e: any) {
        if (cancelled) return;
        onError?.(e?.message || "Audio playback failed.");
        onEnd?.();
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [audioUrl, token, onEnd, onError]);

  return <audio ref={audioRef} style={{ display: "none" }} playsInline preload="auto" />;
}


*/}
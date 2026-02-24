// components/avatar/intro/AuroraIntro.tsx

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type IntroStage = 'idle' | 'loading' | 'playing' | 'done';

type AuroraIntroProps = {
  apiBase?: string;
};

export default function AuroraIntro({ apiBase }: AuroraIntroProps) {
  const API_BASE =
    apiBase ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:5000';

  const [stage, setStage] = useState<IntroStage>('idle');
  const [typed, setTyped] = useState('');
  const [typingDone, setTypingDone] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Controlled intro lines for typing animation
  const introLines = [
    "Hello. My name is Aurora.",
    "I’m an emotional intelligence layer designed to understand tone, context, and emotional shifts — not just words.",
    "This platform curates calming and perspective-driven videos to help you reset and refocus.",
    "Create an account to unlock memory, personalization, and a deeper companion experience."
  ];

  const [activeLineIndex, setActiveLineIndex] = useState(0);

  // Typing animation
  useEffect(() => {
    if (stage !== 'playing') return;

    const line = introLines[activeLineIndex];
    setTyped('');
    setTypingDone(false);

    let i = 0;
    const speed = 18;

    const interval = setInterval(() => {
      i++;
      setTyped(line.slice(0, i));
      if (i >= line.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [activeLineIndex, stage]);

  // Auto-advance lines
  useEffect(() => {
    if (stage !== 'playing') return;
    if (!typingDone) return;

    const delay = 900;

    const timeout = setTimeout(() => {
      if (activeLineIndex < introLines.length - 1) {
        setActiveLineIndex((prev) => prev + 1);
      } else {
        setStage('done');
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [typingDone, activeLineIndex, stage]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  async function startIntro() {
    if (stage === 'loading') return;

    setStage('loading');
    setActiveLineIndex(0);

    try {
      const res = await fetch(`${API_BASE}/api/aurora/intro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variation: 'neutral' }),
      });

      if (!res.ok) throw new Error('Intro fetch failed');

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      setStage('playing');

      audio.play().catch(() => {
        console.warn('Autoplay blocked.');
      });

      audio.onended = () => {
        setStage('done');
      };

    } catch (err) {
      console.error(err);
      setStage('done');
    }
  }

  function replay() {
    setActiveLineIndex(0);
    setStage('idle');
  }

  return (
    <div
      className="position-relative overflow-hidden d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      {/* Background shimmer */}
      <motion.div
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(0,180,255,0.40), rgba(160,70,255,0.35), rgba(0,255,200,0.25))',
          backgroundSize: '200% 200%',
          filter: 'blur(90px)',
          zIndex: 0,
        }}
      />

      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="p-4 p-md-5"
              style={{
                borderRadius: 22,
                background: 'var(--card-bg)',
                border: '1px solid var(--aurora-bento-border)',
                backdropFilter: 'blur(14px)',
                boxShadow: '0 16px 60px rgba(0,0,0,0.35)',
              }}
            >
              <h2 className="mb-3 fw-semibold">Meet Aurora</h2>

              <div
                className="p-3 p-md-4"
                style={{
                  borderRadius: 18,
                  background: 'rgba(0,0,0,0.22)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  minHeight: 140,
                }}
              >
                <AnimatePresence mode="wait">
                  {stage === 'idle' && (
                    <motion.div key="idle">
                      A cinematic introduction to Aurora.
                    </motion.div>
                  )}

                  {stage === 'loading' && (
                    <motion.div key="loading">
                      <div className="spinner-border spinner-border-sm me-2" />
                      Preparing introduction…
                    </motion.div>
                  )}

                  {stage === 'playing' && (
                    <motion.div key="playing">
                      <div className="small mb-2" style={{ opacity: 0.6 }}>
                        Aurora · speaking…
                      </div>
                      <div className="fs-5">
                        {typed}
                        <span
                          style={{
                            opacity: typingDone ? 0 : 0.75,
                            marginLeft: 4,
                          }}
                        >
                          ▍
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {stage === 'done' && (
                    <motion.div key="done">
                      <div className="fs-5 mb-2">
                        Ready to go deeper?
                      </div>
                      <div style={{ opacity: 0.75 }}>
                        Create an account to unlock Aurora’s full companion experience.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 d-flex gap-3 flex-wrap">
                {stage === 'idle' && (
                  <button
                    className="btn btn-primary px-4"
                    onClick={startIntro}
                  >
                    ▶ Start Intro
                  </button>
                )}

                {stage === 'done' && (
                  <>
                    <a href="/register" className="btn btn-primary px-4">
                      ✨ Create Account
                    </a>
                    <a href="/login" className="btn btn-outline-light px-4">
                      Log In
                    </a>
                    <button
                      className="btn btn-outline-secondary px-4"
                      onClick={replay}
                    >
                      Replay
                    </button>
                  </>
                )}
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
// components/camera/RealTimeEmotionCamera.tsx
// components/camera/RealTimeEmotionCamera.tsx

'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onEmotion?: (data: any) => void;
}

export default function RealTimeEmotionCamera({ onEmotion }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullVideoRef = useRef<HTMLVideoElement>(null);

  // setInterval -> number in the browser
  const intervalRef = useRef<number | null>(null);

  // Voice tracking
  const lastSpokenStateRef = useRef<string | null>(null);
  const lastSpokenAtRef = useRef<number>(0);
  const lastScoreRef = useRef<number | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [emotionResult, setEmotionResult] = useState<any | null>(null);

  // --------------------------------------------------
  // AUDIO UNLOCK (for browser autoplay rules)
  // --------------------------------------------------
  const unlockAudio = () => {
    const a = new Audio();
    a.play().catch(() => {
      // ignore — this is just to unlock the audio context
    });
  };

  // --------------------------------------------------
  // CAMERA CONTROL
  // --------------------------------------------------
  const startCamera = async () => {
    try {
      // Unlock audio first so future .play() calls are allowed
      unlockAudio();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) videoRef.current.srcObject = stream;
      if (fullVideoRef.current) fullVideoRef.current.srcObject = stream;

      setStreaming(true);
      startRealtimeLoop();
    } catch (err) {
      console.error('Camera error:', err);
      alert('Cannot access camera');
    }
  };

  const startRealtimeLoop = () => {
    stopRealtimeLoop();
    intervalRef.current = window.setInterval(() => {
      captureFrame();
    }, 1000); // 1 FPS – balance between responsiveness and API cost
  };

  const stopRealtimeLoop = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopRealtimeLoop();
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // --------------------------------------------------
  // BACKEND: EMOTION + AURORA VOICE
  // --------------------------------------------------
  const captureFrame = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg')
    );

    if (!blob) return;

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');

    try {
      const res = await fetch('http://localhost:5000/api/emotion/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      setEmotionResult(data);
      if (onEmotion) onEmotion(data);

      // Voice logic
      await maybeSpeakAurora(data);
    } catch (err) {
      console.error('Real-time emotion error:', err);
    }
  };

  const maybeSpeakAurora = async (data: any) => {
    if (!data) return;

    const state: string | undefined = data.state;
    const valence: number | undefined = data.valence;
    const arousal: number | undefined = data.arousal;
    const dominance: number | undefined = data.dominance;

    // Primary score (confidence)
    const score: number | null =
      typeof data.score === 'number'
        ? data.score
        : typeof data.confidence === 'number'
        ? data.confidence
        : null;

    // Need valid PAD + a meaningful state
    if (
      typeof valence !== 'number' ||
      typeof arousal !== 'number' ||
      typeof dominance !== 'number' ||
      !state ||
      state === 'uncertain'
    ) {
      return;
    }

    // Optional: ignore low-confidence signals
    if (score !== null && score < 0.5) {
      return;
    }

    const now = Date.now();
    const COOLDOWN_MS = 15000; // 15 seconds, therapist style

    // Cooldown gate
    if (now - lastSpokenAtRef.current < COOLDOWN_MS) {
      if (score !== null) {
        lastScoreRef.current = score;
      }
      return;
    }

    const prevState = lastSpokenStateRef.current;
    const prevScore = lastScoreRef.current;

    let shouldSpeak = false;

    // 1) Different emotional state
    if (prevState !== state) {
      shouldSpeak = true;
    }
    // 2) Same state but intensity jumps
    else if (
      score !== null &&
      prevScore !== null &&
      Math.abs(score - prevScore) > 0.25 // 25% jump threshold
    ) {
      shouldSpeak = true;
    }
    // 3) First time ever
    else if (score !== null && prevScore === null) {
      shouldSpeak = true;
    }

    if (score !== null) {
      lastScoreRef.current = score;
    }

    if (!shouldSpeak) return;

    // Record last spoken state & time
    lastSpokenStateRef.current = state;
    lastSpokenAtRef.current = now;

    try {
      const res = await fetch('http://localhost:5000/api/aurora/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valence, arousal, dominance }),
      });

      if (!res.ok) {
        console.error('Aurora speak error:', await res.text());
        return;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error('Error playing Aurora voice:', err);
    }
  };

  // --------------------------------------------------
  // DERIVED HUD VALUES
  // --------------------------------------------------
  const dominantLabel: string | null =
    emotionResult?.emotion ||
    emotionResult?.dominant_emotion ||
    emotionResult?.label ||
    null;

  const confidenceValue: number | null =
    typeof emotionResult?.confidence === 'number'
      ? emotionResult.confidence
      : typeof emotionResult?.score === 'number'
      ? emotionResult.score
      : null;

  let scores: Record<string, number> | null = null;
  if (emotionResult) {
    scores =
      emotionResult.scores ||
      emotionResult.probabilities ||
      emotionResult.emotions ||
      null;
  }

  const topScores: [string, number][] =
    scores && typeof scores === 'object'
      ? (Object.entries(scores) as [string, number][])
          .filter(([, v]) => typeof v === 'number')
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
      : [];

  const auroraLine: string | null = emotionResult?.aurora_response || null;
  const emotionalState: string | null = emotionResult?.state || null;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <>
      {/* MAIN CARD */}
      <div
        className="card p-4 bg-dark text-light border-0 shadow-lg mx-auto"
        style={{
          width: '100%',
          maxWidth: '720px',
          borderRadius: '22px',
          background: 'rgba(15, 15, 15, 0.65)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 0 35px rgba(0, 140, 255, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle outer aurora glow */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 0% 0%, rgba(0,180,255,0.20), transparent 55%), radial-gradient(circle at 100% 100%, rgba(140,60,255,0.22), transparent 55%)',
            mixBlendMode: 'screen',
            opacity: 0.9,
          }}
        />

        {/* Webcam container */}
        <div
          className="position-relative rounded mb-4 overflow-hidden"
          style={{
            height: '400px',
            borderRadius: '18px',
            border: streaming
              ? '2px solid rgba(0, 180, 255, 0.9)'
              : '2px solid rgba(120,120,120,0.4)',
            boxShadow: streaming
              ? '0 0 28px rgba(0, 180, 255, 0.6)'
              : '0 0 14px rgba(0,0,0,0.6)',
            transition: '.4s ease',
            backgroundColor: '#000',
          }}
        >
          {/* Aurora border glow layer */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              pointerEvents: 'none',
              background:
                'radial-gradient(circle at 10% 0%, rgba(0, 255, 190, 0.18), transparent 55%), radial-gradient(circle at 90% 100%, rgba(130, 50, 255, 0.24), transparent 55%)',
              opacity: streaming ? 1 : 0.3,
              mixBlendMode: 'screen',
              transition: 'opacity .5s ease',
              zIndex: 1,
            }}
          />

          {/* VIDEO */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-100 h-100 position-relative"
            style={{
              objectFit: 'cover',
              zIndex: 2,
            }}
          />

          {/* Scanlines overlay */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100 scanlines-overlay"
            style={{
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {/* Face box overlay */}
          {streaming && (
            <div
              className="position-absolute"
              style={{
                top: '20%',
                left: '22%',
                width: '56%',
                height: '60%',
                border: '2px solid rgba(0, 220, 255, 0.8)',
                boxShadow: '0 0 18px rgba(0, 220, 255, 0.5)',
                borderRadius: '16px',
                animation: 'faceBoxGlow 2.5s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 4,
              }}
            />
          )}

          {/* LIVE Badge */}
          {streaming && (
            <div
              className="position-absolute top-0 end-0 m-3 px-2 py-1 rounded-pill text-white"
              style={{
                background: 'rgba(255, 0, 0, 0.85)',
                fontSize: '.8rem',
                fontWeight: 700,
                letterSpacing: '1px',
                animation: 'pulseLive 1.5s infinite',
                zIndex: 5,
              }}
            >
              LIVE
            </div>
          )}

          {/* Emotion HUD bottom-left */}
          {streaming && (
            <div
              className="position-absolute start-0 bottom-0 m-3 p-3 rounded-3"
              style={{
                minWidth: '220px',
                maxWidth: '260px',
                background: 'rgba(10, 10, 20, 0.86)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.16)',
                boxShadow: '0 0 18px rgba(0, 180, 255, 0.45)',
                animation: 'hudFloat 4s ease-in-out infinite',
                zIndex: 6,
              }}
            >
              <div
                className="text-uppercase mb-1"
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  color: '#9ca3af',
                }}
              >
                Emotion Snapshot
              </div>

              <div className="d-flex align-items-baseline justify-content-between mb-1">
                <div className="fw-semibold" style={{ fontSize: '0.95rem' }}>
                  {dominantLabel || 'Detecting…'}
                </div>
                {confidenceValue !== null && (
                  <div
                    className="text-info"
                    style={{ fontSize: '0.75rem', opacity: 0.9 }}
                  >
                    {(confidenceValue * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              {/* Aurora state + line */}
              {emotionalState && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    marginBottom: '0.25rem',
                  }}
                >
                  State:{' '}
                  <span className="text-info" style={{ textTransform: 'capitalize' }}>
                    {emotionalState}
                  </span>
                </div>
              )}
              {auroraLine && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#e5e7eb',
                    fontStyle: 'italic',
                  }}
                >
                  “{auroraLine}”
                </div>
              )}

              {/* Bars */}
              {topScores.length > 0 && (
                <div style={{ fontSize: '0.7rem', marginTop: '0.35rem' }}>
                  {topScores.map(([label, value]) => (
                    <div key={label} className="mb-1">
                      <div
                        className="d-flex justify-content-between"
                        style={{ fontSize: '0.68rem', color: '#d1d5db' }}
                      >
                        <span>{label}</span>
                        <span>{(value * 100).toFixed(0)}%</span>
                      </div>
                      <div
                        className="progress"
                        style={{
                          height: '5px',
                          backgroundColor: 'rgba(55,65,81,0.85)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${Math.min(value * 100, 100)}%`,
                            background:
                              'linear-gradient(90deg, rgba(0,200,255,0.95), rgba(140,60,255,0.95))',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fullscreen Button */}
          {streaming && (
            <button
              onClick={() => setShowFullscreen(true)}
              className="btn btn-outline-light position-absolute bottom-0 end-0 m-3 px-3 py-1"
              style={{
                backdropFilter: 'blur(5px)',
                borderRadius: '10px',
                zIndex: 7,
              }}
            >
              ⤢ Full Screen
            </button>
          )}
        </div>

        {/* BUTTONS */}
        {!streaming ? (
          // AURORA START BUTTON
          <button
            className="btn w-100 py-2 fs-5 fw-semibold"
            style={{
              borderRadius: '14px',
              background:
                'linear-gradient(135deg, rgba(0,140,255,.9), rgba(130,50,255,.9), rgba(0,255,190,.75))',
              backgroundSize: '200% 200%',
              animation: 'auroraGlow 6s ease infinite',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'white',
              boxShadow: '0 0 18px rgba(0,150,255,0.35)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={startCamera}
          >
            Start Emotion Scan
          </button>
        ) : (
          // PREMIUM MATTE STOP BUTTON
          <button
            className="btn w-100 py-2 fs-5 fw-semibold"
            style={{
              borderRadius: '14px',
              background:
                'linear-gradient(135deg, rgba(40,40,40,0.85), rgba(60,60,60,0.7))',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 15px rgba(130,90,255,0.25)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={() => window.location.reload()}
          >
            Stop
          </button>
        )}
      </div>

      {/* FULLSCREEN MODAL */}
      {showFullscreen && (
        <div
          className="modal fade show"
          style={{ display: 'block', background: 'rgba(0,0,0,0.85)' }}
        >
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content bg-dark position-relative">
              <div className="position-relative w-100 h-100">
                {/* Video */}
                <video
                  ref={fullVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-100 h-100 position-absolute top-0 start-0"
                  style={{
                    objectFit: 'cover',
                    filter: 'brightness(1.1)',
                    zIndex: 1,
                  }}
                />

                {/* Scanlines & aurora in fullscreen */}
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 scanlines-overlay"
                  style={{ pointerEvents: 'none', zIndex: 2 }}
                />
                <div
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    pointerEvents: 'none',
                    background:
                      'radial-gradient(circle at 0% 0%, rgba(0,180,255,0.18), transparent 55%), radial-gradient(circle at 100% 100%, rgba(140,60,255,0.20), transparent 55%)',
                    mixBlendMode: 'screen',
                    opacity: 0.8,
                    zIndex: 2,
                  }}
                />

                {/* Minimal label in fullscreen */}
                {dominantLabel && (
                  <div
                    className="position-absolute start-0 top-0 m-4 px-3 py-2 rounded-3 text-white"
                    style={{
                      background: 'rgba(0,0,0,0.55)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(8px)',
                      fontSize: '0.9rem',
                      zIndex: 3,
                    }}
                  >
                    Emotion: <strong>{dominantLabel}</strong>
                    {confidenceValue !== null && (
                      <span className="ms-2 text-info">
                        {(confidenceValue * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                className="btn btn-light position-absolute top-0 end-0 m-4 px-4 py-2 fs-5"
                style={{ borderRadius: '12px', zIndex: 4 }}
                onClick={() => setShowFullscreen(false)}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>
        {`
        @keyframes pulseLive {
          0% { transform: scale(1); opacity: .9; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: .9; }
        }

        @keyframes auroraGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes scanLines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }

        .scanlines-overlay {
          background-image: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.045) 0px,
            rgba(255, 255, 255, 0.045) 1px,
            transparent 2px,
            transparent 4px
          );
          mix-blend-mode: soft-light;
          animation: scanLines 6s linear infinite;
        }

        @keyframes faceBoxGlow {
          0% { box-shadow: 0 0 12px rgba(0, 220, 255, 0.3); }
          50% { box-shadow: 0 0 22px rgba(0, 220, 255, 0.7); }
          100% { box-shadow: 0 0 12px rgba(0, 220, 255, 0.3); }
        }

        @keyframes hudFloat {
          0% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0); }
        }
        `}
      </style>
    </>
  );
}



{/*
'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onEmotion?: (data: any) => void;
}

export default function RealTimeEmotionCamera({ onEmotion }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullVideoRef = useRef<HTMLVideoElement>(null);

  // setInterval in the browser returns a number
  const intervalRef = useRef<number | null>(null);
  const lastSpokenStateRef = useRef<string | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [emotionResult, setEmotionResult] = useState<any | null>(null);

  // ----------------------------------------
  // CAMERA CONTROL
  // ----------------------------------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) videoRef.current.srcObject = stream;
      if (fullVideoRef.current) fullVideoRef.current.srcObject = stream;

      setStreaming(true);
      startRealtimeLoop();
    } catch (err) {
      console.error('Camera error:', err);
      alert('Cannot access camera');
    }
  };

  const startRealtimeLoop = () => {
    stopRealtimeLoop();
    intervalRef.current = window.setInterval(() => {
      captureFrame();
    }, 1000); // 1 FPS for emotion analysis
  };

  const stopRealtimeLoop = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopRealtimeLoop();
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ----------------------------------------
  // BACKEND: EMOTION + AURORA VOICE
  // ----------------------------------------
  const captureFrame = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg')
    );

    if (!blob) return;

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');

    try {
      const res = await fetch('http://localhost:5000/api/emotion/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      setEmotionResult(data);
      if (onEmotion) onEmotion(data);

      // Trigger voice (only when emotional state changes)
      await maybeSpeakAurora(data);
    } catch (err) {
      console.error('Real-time emotion error:', err);
    }
  };

  const maybeSpeakAurora = async (data: any) => {
    if (!data) return;

    const state: string | undefined = data.state;
    const valence = data.valence;
    const arousal = data.arousal;
    const dominance = data.dominance;

    // Guard: need PAD + meaningful state
    if (
      typeof valence !== 'number' ||
      typeof arousal !== 'number' ||
      typeof dominance !== 'number' ||
      !state ||
      state === 'uncertain'
    ) {
      return;
    }

    // Only speak when state changes
    if (lastSpokenStateRef.current === state) return;
    lastSpokenStateRef.current = state;

    try {
      const res = await fetch('http://localhost:5000/api/aurora/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valence, arousal, dominance }),
      });

      if (!res.ok) {
        console.error('Aurora speak error:', await res.text());
        return;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error('Error playing Aurora voice:', err);
    }
  };

  // ----------------------------------------
  // DERIVED HUD VALUES
  // ----------------------------------------
  const dominantLabel: string | null =
    emotionResult?.emotion ||
    emotionResult?.dominant_emotion ||
    emotionResult?.label ||
    null;

  const confidenceValue: number | null =
    typeof emotionResult?.confidence === 'number'
      ? emotionResult.confidence
      : typeof emotionResult?.score === 'number'
      ? emotionResult.score
      : null;

  let scores: Record<string, number> | null = null;
  if (emotionResult) {
    scores =
      emotionResult.scores ||
      emotionResult.probabilities ||
      emotionResult.emotions ||
      null;
  }

  const topScores: [string, number][] =
    scores && typeof scores === 'object'
      ? (Object.entries(scores) as [string, number][])
          .filter(([, v]) => typeof v === 'number')
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
      : [];

  const auroraLine: string | null = emotionResult?.aurora_response || null;
  const emotionalState: string | null = emotionResult?.state || null;

  // ----------------------------------------
  // UI: SAME AESTHETIC AS BEFORE
  // ----------------------------------------
  return (
    <>
     
      <div
        className="card p-4 bg-dark text-light border-0 shadow-lg mx-auto"
        style={{
          width: '100%',
          maxWidth: '720px',
          borderRadius: '22px',
          background: 'rgba(15, 15, 15, 0.65)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 0 35px rgba(0, 140, 255, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
       
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 0% 0%, rgba(0,180,255,0.20), transparent 55%), radial-gradient(circle at 100% 100%, rgba(140,60,255,0.22), transparent 55%)',
            mixBlendMode: 'screen',
            opacity: 0.9,
          }}
        />

      
        <div
          className="position-relative rounded mb-4 overflow-hidden"
          style={{
            height: '400px',
            borderRadius: '18px',
            border: streaming
              ? '2px solid rgba(0, 180, 255, 0.9)'
              : '2px solid rgba(120,120,120,0.4)',
            boxShadow: streaming
              ? '0 0 28px rgba(0, 180, 255, 0.6)'
              : '0 0 14px rgba(0,0,0,0.6)',
            transition: '.4s ease',
            backgroundColor: '#000',
          }}
        >
        
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              pointerEvents: 'none',
              background:
                'radial-gradient(circle at 10% 0%, rgba(0, 255, 190, 0.18), transparent 55%), radial-gradient(circle at 90% 100%, rgba(130, 50, 255, 0.24), transparent 55%)',
              opacity: streaming ? 1 : 0.3,
              mixBlendMode: 'screen',
              transition: 'opacity .5s ease',
              zIndex: 1,
            }}
          />

       
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-100 h-100 position-relative"
            style={{
              objectFit: 'cover',
              zIndex: 2,
            }}
          />

       
          <div
            className="position-absolute top-0 start-0 w-100 h-100 scanlines-overlay"
            style={{
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

      
          {streaming && (
            <div
              className="position-absolute"
              style={{
                top: '20%',
                left: '22%',
                width: '56%',
                height: '60%',
                border: '2px solid rgba(0, 220, 255, 0.8)',
                boxShadow: '0 0 18px rgba(0, 220, 255, 0.5)',
                borderRadius: '16px',
                animation: 'faceBoxGlow 2.5s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 4,
              }}
            />
          )}

        
          {streaming && (
            <div
              className="position-absolute top-0 end-0 m-3 px-2 py-1 rounded-pill text-white"
              style={{
                background: 'rgba(255, 0, 0, 0.85)',
                fontSize: '.8rem',
                fontWeight: 700,
                letterSpacing: '1px',
                animation: 'pulseLive 1.5s infinite',
                zIndex: 5,
              }}
            >
              LIVE
            </div>
          )}

        
          {streaming && (
            <div
              className="position-absolute start-0 bottom-0 m-3 p-3 rounded-3"
              style={{
                minWidth: '220px',
                maxWidth: '260px',
                background: 'rgba(10, 10, 20, 0.86)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.16)',
                boxShadow: '0 0 18px rgba(0, 180, 255, 0.45)',
                animation: 'hudFloat 4s ease-in-out infinite',
                zIndex: 6,
              }}
            >
              <div
                className="text-uppercase mb-1"
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  color: '#9ca3af',
                }}
              >
                Emotion Snapshot
              </div>

              <div className="d-flex align-items-baseline justify-content-between mb-1">
                <div className="fw-semibold" style={{ fontSize: '0.95rem' }}>
                  {dominantLabel || 'Detecting…'}
                </div>
                {confidenceValue !== null && (
                  <div
                    className="text-info"
                    style={{ fontSize: '0.75rem', opacity: 0.9 }}
                  >
                    {(confidenceValue * 100).toFixed(0)}%
                  </div>
                )}
              </div>

            
              {emotionalState && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    marginBottom: '0.25rem',
                  }}
                >
                  State: <span className="text-info">{emotionalState}</span>
                </div>
              )}
              {auroraLine && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#e5e7eb',
                    fontStyle: 'italic',
                  }}
                >
                  “{auroraLine}”
                </div>
              )}

            
              {topScores.length > 0 && (
                <div style={{ fontSize: '0.7rem', marginTop: '0.35rem' }}>
                  {topScores.map(([label, value]) => (
                    <div key={label} className="mb-1">
                      <div
                        className="d-flex justify-content-between"
                        style={{ fontSize: '0.68rem', color: '#d1d5db' }}
                      >
                        <span>{label}</span>
                        <span>{(value * 100).toFixed(0)}%</span>
                      </div>
                      <div
                        className="progress"
                        style={{
                          height: '5px',
                          backgroundColor: 'rgba(55,65,81,0.85)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${Math.min(value * 100, 100)}%`,
                            background:
                              'linear-gradient(90deg, rgba(0,200,255,0.95), rgba(140,60,255,0.95))',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        
          {streaming && (
            <button
              onClick={() => setShowFullscreen(true)}
              className="btn btn-outline-light position-absolute bottom-0 end-0 m-3 px-3 py-1"
              style={{
                backdropFilter: 'blur(5px)',
                borderRadius: '10px',
                zIndex: 7,
              }}
            >
              ⤢ Full Screen
            </button>
          )}
        </div>

       
        {!streaming ? (
          // AURORA START BUTTON
          <button
            className="btn w-100 py-2 fs-5 fw-semibold"
            style={{
              borderRadius: '14px',
              background:
                'linear-gradient(135deg, rgba(0,140,255,.9), rgba(130,50,255,.9), rgba(0,255,190,.75))',
              backgroundSize: '200% 200%',
              animation: 'auroraGlow 6s ease infinite',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'white',
              boxShadow: '0 0 18px rgba(0,150,255,0.35)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={startCamera}
          >
            Start Emotion Scan
          </button>
        ) : (
        
          <button
            className="btn w-100 py-2 fs-5 fw-semibold"
            style={{
              borderRadius: '14px',
              background:
                'linear-gradient(135deg, rgba(40,40,40,0.85), rgba(60,60,60,0.7))',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 15px rgba(130,90,255,0.25)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={() => window.location.reload()}
          >
            Stop
          </button>
        )}
      </div>

     
      {showFullscreen && (
        <div
          className="modal fade show"
          style={{ display: 'block', background: 'rgba(0,0,0,0.85)' }}
        >
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content bg-dark position-relative">
              <div className="position-relative w-100 h-100">
               
                <video
                  ref={fullVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-100 h-100 position-absolute top-0 start-0"
                  style={{
                    objectFit: 'cover',
                    filter: 'brightness(1.1)',
                    zIndex: 1,
                  }}
                />

             
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 scanlines-overlay"
                  style={{ pointerEvents: 'none', zIndex: 2 }}
                />
                <div
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    pointerEvents: 'none',
                    background:
                      'radial-gradient(circle at 0% 0%, rgba(0,180,255,0.18), transparent 55%), radial-gradient(circle at 100% 100%, rgba(140,60,255,0.20), transparent 55%)',
                    mixBlendMode: 'screen',
                    opacity: 0.8,
                    zIndex: 2,
                  }}
                />

               
                {dominantLabel && (
                  <div
                    className="position-absolute start-0 top-0 m-4 px-3 py-2 rounded-3 text-white"
                    style={{
                      background: 'rgba(0,0,0,0.55)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(8px)',
                      fontSize: '0.9rem',
                      zIndex: 3,
                    }}
                  >
                    Emotion: <strong>{dominantLabel}</strong>
                    {confidenceValue !== null && (
                      <span className="ms-2 text-info">
                        {(confidenceValue * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                className="btn btn-light position-absolute top-0 end-0 m-4 px-4 py-2 fs-5"
                style={{ borderRadius: '12px', zIndex: 4 }}
                onClick={() => setShowFullscreen(false)}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

    
      <style>
        {`
        @keyframes pulseLive {
          0% { transform: scale(1); opacity: .9; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: .9; }
        }

        @keyframes auroraGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes scanLines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }

        .scanlines-overlay {
          background-image: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.045) 0px,
            rgba(255, 255, 255, 0.045) 1px,
            transparent 2px,
            transparent 4px
          );
          mix-blend-mode: soft-light;
          animation: scanLines 6s linear infinite;
        }

        @keyframes faceBoxGlow {
          0% { box-shadow: 0 0 12px rgba(0, 220, 255, 0.3); }
          50% { box-shadow: 0 0 22px rgba(0, 220, 255, 0.7); }
          100% { box-shadow: 0 0 12px rgba(0, 220, 255, 0.3); }
        }

        @keyframes hudFloat {
          0% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0); }
        }
        `}
      </style>
    </>
  );
}
*/}
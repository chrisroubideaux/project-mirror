// components/camera/RealTimeEmotionCamera.tsx
// components/camera/RealTimeEmotionCamera.tsx
'use client';

import { useEffect, useRef, useState } from "react";

interface Props {
  onEmotion?: (data: any) => void;
}

export default function RealTimeEmotionCamera({ onEmotion }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullVideoRef = useRef<HTMLVideoElement>(null);

  // INTERVALS / FLAGS
  const intervalRef = useRef<number | null>(null);
  const conversationActiveRef = useRef<boolean>(false);

  // UI
  const [streaming, setStreaming] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [emotionResult, setEmotionResult] = useState<any | null>(null);

  // ------------------------------------------------------
  // AUDIO AUTOPLAY UNLOCK
  // ------------------------------------------------------
  const unlockAudio = () => {
    const a = new Audio();
    a.play().catch(() => {});
  };

  // ------------------------------------------------------
  // START CAMERA
  // ------------------------------------------------------
  const startCamera = async () => {
    try {
      unlockAudio();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) videoRef.current.srcObject = stream;
      if (fullVideoRef.current) fullVideoRef.current.srcObject = stream;

      setStreaming(true);

      startEmotionPolling();
      await playGreeting();

      // give greeting a moment, then start voice loop
      setTimeout(() => {
        startAutoConversationLoop();
      }, 1500);

    } catch (err) {
      console.error("Camera error:", err);
      alert("Camera access blocked.");
    }
  };

  // ------------------------------------------------------
  // STOP CAMERA & CLEANUP
  // ------------------------------------------------------
  const stopAll = () => {
    stopEmotionPolling();
    conversationActiveRef.current = false;

    const s1 = videoRef.current?.srcObject as MediaStream | null;
    s1?.getTracks().forEach((t) => t.stop());

    const s2 = fullVideoRef.current?.srcObject as MediaStream | null;
    s2?.getTracks().forEach((t) => t.stop());
  };

  useEffect(() => {
    return () => stopAll();
  }, []);

  // ------------------------------------------------------
  // EMOTION POLLING (OpenAI Vision)
  // ------------------------------------------------------
  const startEmotionPolling = () => {
    stopEmotionPolling();
    // Vision can handle ~1–2 calls/sec fine; 1.5s is a good middle ground
    intervalRef.current = window.setInterval(captureFrame, 1500);
  };

  const stopEmotionPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // If video is not ready yet, skip this tick
    if (!video.videoWidth || !video.videoHeight) return;

    const targetWidth = 360;
    const aspect =
      video.videoHeight && video.videoWidth
        ? video.videoHeight / video.videoWidth
        : 3 / 4;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = Math.round(targetWidth * aspect);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.7)
    );

    if (!blob) return;

    const formData = new FormData();
    formData.append("image", blob, "frame.jpg");

    try {
      const res = await fetch("http://localhost:5000/api/emotion/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Emotion analyze error:", txt);
        return;
      }

      const data = await res.json();
      setEmotionResult(data);
      onEmotion?.(data);
    } catch (err) {
      console.error("Emotion detect error:", err);
    }
  };

  // ------------------------------------------------------
  // GREETING (runs once)
  // ------------------------------------------------------
  const playGreeting = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/aurora/greet");
      if (!res.ok) return;

      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    } catch (err) {
      console.error("Greeting error:", err);
    }
  };

  // ------------------------------------------------------
  // AUTO CONVERSATION LOOP
  // ------------------------------------------------------
  const startAutoConversationLoop = () => {
    if (conversationActiveRef.current) return;
    conversationActiveRef.current = true;
    scheduleNextTurn();
  };

  const scheduleNextTurn = () => {
    if (!conversationActiveRef.current) return;
    setTimeout(recordVoiceTurn, 500); // small delay between turns
  };

  const recordVoiceTurn = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      let chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);

      rec.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      rec.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: "audio/webm" });

          // Ignore near-silent / no-speech turns
          if (blob.size > 4000) {
            await sendToAurora(blob);
          }
        } catch (err) {
          console.error("Recording error:", err);
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          if (conversationActiveRef.current) scheduleNextTurn();
        }
      };

      rec.start();
      // ~4 seconds per turn
      setTimeout(() => {
        if (rec.state !== "inactive") rec.stop();
      }, 4000);
    } catch (err) {
      console.error("Mic error:", err);
      setTimeout(
        () => conversationActiveRef.current && scheduleNextTurn(),
        2000
      );
    }
  };

  const sendToAurora = async (audioBlob: Blob) => {
    const fd = new FormData();
    fd.append("audio", audioBlob, "speech.webm");

    try {
      const res = await fetch("http://localhost:5000/api/aurora/converse", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        console.error("Aurora converse error:", await res.text());
        return;
      }

      const outBlob = await res.blob();
      const audio = new Audio(URL.createObjectURL(outBlob));
      audio.play();
    } catch (err) {
      console.error("Converse error:", err);
    }
  };

  // ------------------------------------------------------
  // UI Helpers
  // ------------------------------------------------------
  const dominant: string | null =
    emotionResult?.emotion ||
    emotionResult?.label ||
    null;

  const confidence: number | null =
    typeof emotionResult?.confidence === "number"
      ? emotionResult.confidence
      : typeof emotionResult?.score === "number"
      ? emotionResult.score
      : null;

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------
  return (
    <>
      <div
        className="card p-4 bg-dark text-light border-0 shadow-lg mx-auto"
        style={{
          width: "100%",
          maxWidth: "720px",
          borderRadius: "22px",
          background: "rgba(15,15,15,0.65)",
          backdropFilter: "blur(14px)",
        }}
      >
        {/* CAMERA CONTAINER */}
        <div
          className="position-relative rounded mb-4 overflow-hidden"
          style={{
            height: "400px",
            borderRadius: "18px",
            border: streaming
              ? "2px solid rgba(0,180,255,0.9)"
              : "2px solid rgba(120,120,120,0.4)",
            backgroundColor: "#000",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-100 h-100"
            style={{ objectFit: "cover" }}
          />

          {/* LIVE */}
          {streaming && (
            <div
              className="position-absolute top-0 end-0 m-3 px-2 py-1 rounded-pill text-white"
              style={{ background: "rgba(255,0,0,0.85)" }}
            >
              LIVE
            </div>
          )}

          {/* HUD */}
          {streaming && (
            <div
              className="position-absolute start-0 bottom-0 m-3 p-3 rounded-3"
              style={{
                background: "rgba(10,10,20,0.86)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                Emotion Snapshot
              </div>
              <div className="d-flex align-items-baseline">
                <strong style={{ fontSize: "0.95rem" }}>
                  {dominant || "Detecting…"}
                </strong>
                {confidence !== null && (
                  <span className="ms-2 text-info" style={{ fontSize: "0.8rem" }}>
                    {(confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {/* PAD preview (optional small text) */}
              {emotionResult && (
                <div style={{ fontSize: "0.7rem", marginTop: "0.2rem" }}>
                  <span className="me-2">
                    V: {((emotionResult.valence ?? 0.5) * 100).toFixed(0)}%
                  </span>
                  <span className="me-2">
                    A: {((emotionResult.arousal ?? 0.5) * 100).toFixed(0)}%
                  </span>
                  <span>
                    D: {((emotionResult.dominance ?? 0.5) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* FULLSCREEN BTN */}
          {streaming && (
            <button
              onClick={() => setShowFullscreen(true)}
              className="btn btn-outline-light position-absolute bottom-0 end-0 m-3"
            >
              Fullscreen
            </button>
          )}
        </div>

        {/* START / STOP BUTTON */}
        {!streaming ? (
          <button
            className="btn w-100 py-2 fs-5 fw-semibold"
            onClick={startCamera}
            style={{ background: "rgba(0,140,255,.8)", borderRadius: "14px" }}
          >
            Start Emotion Scan
          </button>
        ) : (
          <button
            className="btn w-100 py-2 fs-5 fw-semibold"
            onClick={() => window.location.reload()}
            style={{ background: "rgba(40,40,40,.85)", borderRadius: "14px" }}
          >
            Stop Session
          </button>
        )}
      </div>

      {/* FULLSCREEN */}
      {showFullscreen && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.85)" }}
        >
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content bg-dark position-relative">
              <video
                ref={fullVideoRef}
                autoPlay
                playsInline
                muted
                className="w-100 h-100 position-absolute top-0 start-0"
                style={{ objectFit: "cover" }}
              />
              <button
                className="btn btn-light position-absolute top-0 end-0 m-4"
                onClick={() => setShowFullscreen(false)}
              >
                × Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


{/*

// components/camera/RealTimeEmotionCamera.tsx

'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onEmotion?: (data: any) => void;
}

export default function RealTimeEmotionCamera({ onEmotion }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullVideoRef = useRef<HTMLVideoElement>(null);

  // Emotion polling interval
  const intervalRef = useRef<number | null>(null);

  // Voice tracking for auto Aurora responses
  const lastSpokenStateRef = useRef<string | null>(null);
  const lastSpokenAtRef = useRef<number>(0);
  const lastScoreRef = useRef<number | null>(null);

  // Mic recording for push-to-talk
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const [streaming, setStreaming] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [emotionResult, setEmotionResult] = useState<any | null>(null);

  // --------------------------------------------------
  // AUDIO UNLOCK (Browser autoplay requirement)
  // --------------------------------------------------
  const unlockAudio = () => {
    const a = new Audio();
    a.play().catch(() => {
      // Just to unlock; ignore errors
    });
  };

  // --------------------------------------------------
  // CAMERA CONTROL
  // --------------------------------------------------
  const startCamera = async () => {
    try {
      // Unlock audio so future .play() calls are allowed
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
    }, 1000); // 1 FPS – balance between responsiveness and cost
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

  // --------------------------------------------------
  // EMOTION + AUTO AURORA VOICE
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

      // Auto Aurora responses (therapist-style pacing)
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

    const score: number | null =
      typeof data.score === 'number'
        ? data.score
        : typeof data.confidence === 'number'
        ? data.confidence
        : null;

    // Need valid PAD + meaningful state
    if (
      typeof valence !== 'number' ||
      typeof arousal !== 'number' ||
      typeof dominance !== 'number' ||
      !state ||
      state === 'uncertain'
    ) {
      return;
    }

    // Optional: ignore low-confidence updates
    if (score !== null && score < 0.5) {
      return;
    }

    const now = Date.now();
    const COOLDOWN_MS = 15000; // 15 seconds, warm therapist pacing

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
    // 2) Same state but intensity jumps significantly
    else if (
      score !== null &&
      prevScore !== null &&
      Math.abs(score - prevScore) > 0.25
    ) {
      shouldSpeak = true;
    }
    // 3) First time we ever got a score
    else if (score !== null && prevScore === null) {
      shouldSpeak = true;
    }

    if (score !== null) {
      lastScoreRef.current = score;
    }

    if (!shouldSpeak) return;

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
  // 🎤 PUSH-TO-TALK MICROPHONE (Whisper → Aurora)
  // --------------------------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm',
          });

          const formData = new FormData();
          formData.append('audio', audioBlob, 'speech.webm');

          const res = await fetch('http://localhost:5000/api/aurora/converse', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            console.error('Aurora converse error:', await res.text());
            return;
          }

          const audioRes = await res.blob();
          const url = URL.createObjectURL(audioRes);
          const audio = new Audio(url);
          audio.play();
        } catch (err) {
          console.error('Error in converse playback:', err);
        } finally {
          // Stop audio tracks so mic is released
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
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
  // UI – CINEMATIC MIRROR VIBES
  // --------------------------------------------------
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
          <button
            className="btn w-100 py-2 fs-5 fw-semibold mb-2"
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
          <>
           
            <button
              className="btn w-100 py-2 fs-6 fw-semibold mb-2"
              style={{
                borderRadius: '14px',
                background: isRecording
                  ? 'linear-gradient(135deg, rgba(255,60,60,0.9), rgba(200,30,30,0.9))'
                  : 'linear-gradient(135deg, rgba(0,160,255,0.95), rgba(140,60,255,0.95))',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: isRecording
                  ? '0 0 18px rgba(255,80,80,0.55)'
                  : '0 0 18px rgba(0,160,255,0.55)',
              }}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? '🛑 Stop Talking' : '🎤 Talk to Aurora'}
            </button>

          
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
              Stop Session
            </button>
          </>
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
// app/emotes/page.tsx
'use client';

import { useState } from 'react';
import Nav from '@/components/nav/Nav';  
import RealTimeEmotionCamera from '@/components/camera/RealTimeEmotionCamera';
import EmpathyMeter from '@/components/emotes/EmpathyMeter';
import GlassStatMeters from '@/components/emotes/GlassStatMeters';
import { motion } from 'framer-motion';

export default function EmotionPage() {
  const [result, setResult] = useState<any>(null);

  return (
    <div className="">

      
      <Nav />

      <div className="container text-center py-5">

        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="display-4 fw-bold mb-3 text-light"
        >
          Project AURORA
        </motion.h1>

        <p className="text-secondary mb-4">
          Real-Time Emotion Recognition Engine
        </p>

        {/* CAMERA FEED */}
        <RealTimeEmotionCamera onEmotion={setResult} />

        {/* LIVE RESULTS */}
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5"
          >
            <EmpathyMeter score={result.valence} />

            <p className="mt-3 fs-5 text-light">
              <strong>Emotion:</strong> {result.emotion}<br />
              <strong>Confidence:</strong>{" "}
              {Math.round((result.score || result.confidence) * 100)}%<br />
              <strong>Valence:</strong> {result.valence}<br />
              <strong>Arousal:</strong> {result.arousal}
            </p>
          </motion.div>
        )}

        <GlassStatMeters />

      </div>
    </div>
  );
}



{/*
// app/emotes/page.tsx
'use client';

import { useState } from 'react';
import WebcamPanel from '@/components/camera/WebcamPanel';
import AudioRecorder from '@/components/audio/AudioRecorder';
import EmpathyMeter from '@/components/emotes/EmpathyMeter';
import HistoryChart from '@/components/history/HistoryChart';
import { motion } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function EmotionPage() {
  const [faceBlob, setFaceBlob] = useState<Blob | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!faceBlob) return alert("Please capture a face image first.");
    if (!audioBlob) return alert("Please record voice audio first.");

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", faceBlob, "face.jpg");
      formData.append("audio", audioBlob, "audio.wav");

      // Emotion route ONLY handles face for now
      const res = await fetch(`${API_BASE}/api/emotion/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);

    } catch (err) {
      console.error("Error analyzing emotion:", err);
      alert("Emotion analysis failed.");
    }

    setLoading(false);
  };

  return (
    <div className="container text-center py-5">

      <motion.h1
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="display-4 fw-bold mb-2 text-light"
      >
        Project AURORA
      </motion.h1>

      <p className="text-secondary mb-5">Emotion Recognition & Empathy Engine</p>

      <div className="row justify-content-center g-5">
        <div className="col-md-5">
          <WebcamPanel onCapture={setFaceBlob} />
        </div>
        <div className="col-md-5">
          <AudioRecorder onRecordComplete={setAudioBlob} />
        </div>
      </div>

      <div className="mt-5">
        <button
          className="btn btn-lg btn-primary px-5"
          disabled={loading}
          onClick={handleAnalyze}
        >
          {loading ? "Analyzing..." : "Analyze Emotion"}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5"
        >
          <EmpathyMeter score={result.valence} />

          <p className="mt-3 fs-5 text-light">
            <strong>Emotion:</strong> {result.emotion}<br />
            <strong>Confidence:</strong> {Math.round(result.score * 100)}%<br />
            <strong>Valence:</strong> {result.valence}<br />
            <strong>Arousal:</strong> {result.arousal}
          </p>
        </motion.div>
      )}

      <div className="mt-5">
        <HistoryChart />
      </div>
    </div>
  );



*/}

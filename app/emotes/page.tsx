// app/emotes/page.tsx
'use client';
import { useState } from 'react';
import WebcamPanel from '@/components/camera/WebcamPanel';
import AudioRecorder from '@/components/audio/AudioRecorder';
import EmpathyMeter from '@/components/emotes/EmpathyMeter';
import HistoryChart from '@/components/history/HistoryChart';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Home() {
  const [faceBlob, setFaceBlob] = useState<Blob | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!faceBlob || !audioBlob) return alert("Please capture face and voice first.");
    setLoading(true);

    const formData = new FormData();
    formData.append("image", faceBlob, "face.jpg");
    formData.append("audio", audioBlob, "voice.wav");

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/analyze`, formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error analyzing emotions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container text-center py-5">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="display-4 fw-bold text-light mb-2"
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
          disabled={loading}
          onClick={handleAnalyze}
          className="btn btn-lg btn-primary px-5"
        >
          {loading ? 'Analyzing...' : 'Analyze Emotion'}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5"
        >
          <EmpathyMeter score={result.empathy_score} />
          <p className="mt-3 fs-5 text-light">
            Face: <strong>{result.face_emotion}</strong> | Voice: <strong>{result.voice_emotion}</strong>
          </p>
        </motion.div>
      )}

      <div className="mt-5">
        <HistoryChart />
      </div>
    </div>
  );
}

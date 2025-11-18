'use client';

import { useState } from 'react';
import WebcamPanel from '@/components/camera/WebcamPanel';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function EmotionClient() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCapture = async (blob: Blob) => {
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');

      const res = await fetch(`${API_BASE}/api/emotion/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Emotion API error:', err);
      setResult({ error: 'Request failed' });
    }

    setLoading(false);
  };

  return (
    <div className="container py-4 text-center">
      <h2 className="text-light mb-4">Emotion Detection</h2>

      <WebcamPanel onCapture={handleCapture} />

      {loading && <p className="text-info mt-3">Analyzing emotion...</p>}

      {result && (
        <div className="mt-4 p-3 bg-dark text-light border border-secondary rounded">
          {result.error ? (
            <p className="text-danger">{result.error}</p>
          ) : (
            <>
              <h4>Emotion: {result.emotion}</h4>
              <p>Confidence: {Math.round(result.score * 100)}%</p>
              <p>Valence: {result.valence}</p>
              <p>Arousal: {result.arousal}</p>
              <p className="text-muted small">{result.user_id ? `User: ${result.user_id}` : 'Unauthenticated'}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

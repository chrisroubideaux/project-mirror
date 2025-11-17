// component/history/HistoryChart.tsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HistoryChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/history/1`)
      .then((res) => setData(res.data.logs))
      .catch(() => setData([]));
  }, []);

  return (
    <div className="card bg-dark border-secondary p-3">
      <h5 className="text-light mb-3">Empathy History</h5>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#666" />
          <XAxis dataKey="timestamp" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Line type="monotone" dataKey="empathy_score" stroke="#0d6efd" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('progress_logs')
      .select('*')
      .order('date', { ascending: true });
    if (!error) setLogs(data);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('Triggering workflow — this may take up to a minute if n8n was idle...');
    try {
      await fetch(import.meta.env.VITE_N8N_WEBHOOK_URL, { method: 'POST' });
      setTimeout(async () => {
        await fetchLogs();
        setSyncMessage('Synced!');
        setSyncing(false);
      }, 8000);
    } catch (err) {
      setSyncMessage('Sync failed — check n8n is reachable.');
      setSyncing(false);
    }
  };

  if (logs.length === 0) {
    return <div style={{ textAlign: 'center', marginTop: 100, fontFamily: 'sans-serif' }}>Loading your progress...</div>;
  }

  const latest = logs[logs.length - 1];

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>LeetCode Prep Dashboard</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSync} disabled={syncing} style={{ padding: '10px 20px' }}>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{ padding: '10px 20px' }}>
            Logout
          </button>
        </div>
      </div>
      {syncMessage && <p>{syncMessage}</p>}

      {latest && (
        <div style={{ display: 'flex', gap: 20, margin: '20px 0' }}>
          <StatCard label="Total Solved" value={latest.total_solved} />
          <StatCard label="Easy" value={latest.easy_solved} />
          <StatCard label="Medium" value={latest.medium_solved} />
          <StatCard label="Hard" value={latest.hard_solved} />
        </div>
      )}

      <h3>Progress over time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={logs}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="total_solved" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>

      {latest && (
        <div style={{ marginTop: 30, padding: 20, background: '#f5f5f5', borderRadius: 8 }}>
          <h3>Today's AI Recommendation</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{latest.recommendation}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ flex: 1, padding: 18, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#4f46e5' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  );
}
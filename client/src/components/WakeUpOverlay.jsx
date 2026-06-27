import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Brain } from 'lucide-react';

const WakeUpOverlay = ({ children }) => {
  const [isWaking, setIsWaking] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const pingServer = async () => {
      const timeoutId = setTimeout(() => setIsWaking(true), 1500);

      const tryPing = async () => {
        try {
          await axios.get('/health');
          clearTimeout(timeoutId);
          setIsWaking(false);
          setIsReady(true);
        } catch {
          // Retry every 3 seconds until server responds
          setTimeout(tryPing, 3000);
        }
      };

      tryPing();
      return () => clearTimeout(timeoutId);
    };

    pingServer();
  }, []);

  if (isWaking && !isReady) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <Brain size={30} color="#fff" />
        </div>
        <Loader2 size={28} color="#6366f1" className="animate-spin" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Waking up the server…
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', maxWidth: 360, margin: 0, padding: '0 1rem' }}>
          The backend is on a free tier — it may take up to a minute to spin up after inactivity.
        </p>
      </div>
    );
  }

  return children;
};

export default WakeUpOverlay;
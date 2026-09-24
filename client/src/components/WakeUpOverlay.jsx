import { useState, useEffect } from 'react';
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
      <div className="wake-overlay"><div className="wake-card"><div className="wake-logo"><Brain size={28} /></div><Loader2 size={25} color="#4169e1" className="animate-spin" /><div><h2>Connecting to ExamAI</h2><p>The workspace is waking up. This usually takes a few seconds.</p></div><div className="wake-progress"><span /></div></div></div>
    );
  }

  return children;
};

export default WakeUpOverlay;
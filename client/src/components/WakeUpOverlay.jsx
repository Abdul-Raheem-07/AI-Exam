import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const WakeUpOverlay = ({ children }) => {
  const [isWaking, setIsWaking] = useState(false);
  const [isAwake, setIsAwake] = useState(false);

  useEffect(() => {
    let timeoutId;
    
    const pingServer = async () => {
      // If server doesn't respond in 1.5 seconds, show the wake-up overlay
      timeoutId = setTimeout(() => {
        setIsWaking(true);
      }, 1500);

      try {
        await axios.get('/'); // Hit the base API endpoint
        clearTimeout(timeoutId);
        setIsWaking(false);
        setIsAwake(true);
      } catch (error) {
        // Retry logic could go here
        clearTimeout(timeoutId);
      }
    };

    pingServer();

    return () => clearTimeout(timeoutId);
  }, []);

  if (isWaking) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Waking up the Server...</h2>
        <p className="text-gray-600 text-center max-w-md px-4">
          The backend is hosted on a free tier and might take a minute to spin up after a period of inactivity. Please bear with us!
        </p>
      </div>
    );
  }

  return children;
};

export default WakeUpOverlay;

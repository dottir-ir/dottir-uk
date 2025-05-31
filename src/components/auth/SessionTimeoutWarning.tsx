import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface SessionTimeoutWarningProps {
  timeoutDuration: number; // in minutes
  warningThreshold: number; // in minutes
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  timeoutDuration,
  warningThreshold,
}) => {
  const { signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeoutDuration);

  useEffect(() => {
    let warningTimeout: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(warningTimeout);
      clearInterval(countdownInterval);
      setShowWarning(false);
      setTimeLeft(timeoutDuration);

      // Set warning timeout
      warningTimeout = setTimeout(() => {
        setShowWarning(true);
        // Start countdown
        countdownInterval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              signOut();
              return 0;
            }
            return prev - 1;
          });
        }, 60000); // Update every minute
      }, (timeoutDuration - warningThreshold) * 60000);
    };

    // Reset timers on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimers);
    });

    // Initial setup
    resetTimers();

    // Cleanup
    return () => {
      clearTimeout(warningTimeout);
      clearInterval(countdownInterval);
      events.forEach(event => {
        window.removeEventListener(event, resetTimers);
      });
    };
  }, [timeoutDuration, warningThreshold, signOut]);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-yellow-400 p-4 max-w-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-900">Session Timeout Warning</h3>
          <div className="mt-2 text-sm text-gray-500">
            <p>Your session will expire in {timeLeft} minutes due to inactivity.</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setShowWarning(false);
                setTimeLeft(timeoutDuration);
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 
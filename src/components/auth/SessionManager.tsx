import React, { useEffect, useState } from 'react';
import { authService } from '../../services/api/authService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getDeviceInfo } from '../../utils/auth';

interface Session {
  id: string;
  deviceInfo: any;
  lastActivity: Date;
  ipAddress: string;
}

export const SessionManager: React.FC = () => {
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSessions();
      setupActivityTracking();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      const data = await authService.getUserSessions(user.id);
      setSessions(data);
    } catch (error) {
      toast.error('Failed to load sessions');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupActivityTracking = () => {
    const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        toast.error('Your session has expired due to inactivity');
        signOut();
      }, TIMEOUT_DURATION);
    };

    // Reset timeout on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await authService.deleteSession(sessionId);
      await loadSessions();
      toast.success('Session terminated successfully');
    } catch (error) {
      toast.error('Failed to terminate session');
      console.error(error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Active Sessions</h2>
      <p className="mb-6 text-gray-600">
        Manage your active sessions across different devices. Sessions will automatically expire after 30 minutes of inactivity.
      </p>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="p-4 bg-white rounded-lg shadow-sm border"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">
                  {session.deviceInfo.platform} - {session.deviceInfo.userAgent}
                </h3>
                <p className="text-sm text-gray-600">
                  Last activity: {formatDate(session.lastActivity)}
                </p>
                <p className="text-sm text-gray-600">
                  IP Address: {session.ipAddress}
                </p>
              </div>
              <button
                onClick={() => handleTerminateSession(session.id)}
                className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
              >
                Terminate
              </button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-center text-gray-600 py-4">
            No active sessions found.
          </p>
        )}
      </div>
    </div>
  );
}; 
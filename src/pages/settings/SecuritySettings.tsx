import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MFASetup } from '../../components/auth/MFASetup';
import { SessionManager } from '../../components/auth/SessionManager';
import { SSOConnections } from '../../components/auth/SSOConnections';
import { toast } from 'react-hot-toast';

export const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showSSO, setShowSSO] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>

      {/* MFA Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
            <p className="text-gray-600">
              {user.mfa_enabled
                ? 'Two-factor authentication is enabled for your account.'
                : 'Add an extra layer of security to your account.'}
            </p>
          </div>
          {!user.mfa_enabled && (
            <button
              onClick={() => setShowMFASetup(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Enable 2FA
            </button>
          )}
        </div>

        {showMFASetup && (
          <div className="mt-4">
            <MFASetup onComplete={() => setShowMFASetup(false)} />
          </div>
        )}
      </div>

      {/* Sessions Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Active Sessions</h2>
            <p className="text-gray-600">
              Manage your active sessions across different devices.
            </p>
          </div>
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            {showSessions ? 'Hide Sessions' : 'View Sessions'}
          </button>
        </div>

        {showSessions && (
          <div className="mt-4">
            <SessionManager />
          </div>
        )}
      </div>

      {/* SSO Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Institutional Sign-In</h2>
            <p className="text-gray-600">
              Connect your account with your institution's single sign-on service.
            </p>
          </div>
          <button
            onClick={() => setShowSSO(!showSSO)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            {showSSO ? 'Hide SSO' : 'Manage SSO'}
          </button>
        </div>

        {showSSO && (
          <div className="mt-4">
            <SSOConnections />
          </div>
        )}
      </div>
    </div>
  );
}; 
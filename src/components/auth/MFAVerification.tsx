import React, { useState } from 'react';
import { authService } from '../../services/api/authService';
import { toast } from 'react-hot-toast';

interface MFAVerificationProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({
  userId,
  onSuccess,
  onCancel,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      const isValid = await authService.verifyMFA(userId, verificationCode);
      
      if (isValid) {
        onSuccess();
      } else {
        toast.error('Invalid verification code');
      }
    } catch (error) {
      toast.error('Failed to verify MFA');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
      <p className="mb-4">
        Please enter the 6-digit code from your authenticator app or use a backup code.
      </p>
      <div className="mb-6">
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter code"
          className="w-full p-2 border rounded"
          maxLength={6}
        />
      </div>
      <div className="flex gap-4">
        <button
          onClick={handleVerify}
          disabled={isLoading || !verificationCode}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}; 
import React, { useState } from 'react';
import { authService } from '../../services/api/authService';
import { useAuth } from '../../contexts/AuthContext';
import QRCode from 'qrcode.react';
import { toast } from 'react-hot-toast';

interface MFASetupProps {
  onComplete: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [mfaSetup, setMFASetup] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const setup = await authService.setupMFA(user.id);
      setMFASetup(setup);
      setStep('verify');
    } catch (error) {
      toast.error('Failed to setup MFA');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!user || !mfaSetup) return;

    try {
      setIsLoading(true);
      const isValid = await authService.verifyMFA(user.id, verificationCode);
      
      if (isValid) {
        await authService.enableMFA(user.id);
        toast.success('MFA enabled successfully');
        onComplete();
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

  if (step === 'setup') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Setup Two-Factor Authentication</h2>
        <p className="mb-4">
          Enhance your account security by enabling two-factor authentication.
          You'll need to scan a QR code with your authenticator app.
        </p>
        <button
          onClick={handleSetup}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Setting up...' : 'Begin Setup'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Verify Setup</h2>
      <div className="mb-6">
        <p className="mb-4">Scan this QR code with your authenticator app:</p>
        <div className="flex justify-center mb-4">
          <QRCode value={mfaSetup.qrCode} size={200} />
        </div>
        <p className="text-sm text-gray-600 mb-4">
          If you can't scan the QR code, enter this code manually:
        </p>
        <code className="block p-2 bg-gray-100 rounded mb-4">{mfaSetup.secret}</code>
      </div>
      <div className="mb-6">
        <p className="mb-2">Enter the 6-digit code from your authenticator app:</p>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="000000"
          className="w-full p-2 border rounded"
          maxLength={6}
        />
      </div>
      <div className="mb-6">
        <p className="mb-2">Save these backup codes in a secure place:</p>
        <div className="p-2 bg-gray-100 rounded">
          {mfaSetup.backupCodes.map((code: string, index: number) => (
            <div key={index} className="font-mono text-sm mb-1">{code}</div>
          ))}
        </div>
      </div>
      <button
        onClick={handleVerify}
        disabled={isLoading || verificationCode.length !== 6}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Verifying...' : 'Verify and Enable'}
      </button>
    </div>
  );
}; 
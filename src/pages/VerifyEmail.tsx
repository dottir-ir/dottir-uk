import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setError('Invalid verification link');
        return;
      }

      try {
        setLoading(true);
        await verifyEmail(token);
        setVerified(true);
      } catch (err) {
        setError('Failed to verify email. Please try again.');
        console.error('Email verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams, verifyEmail]);

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await resendVerification();
      setError('Verification email sent. Please check your inbox.');
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
      console.error('Resend verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <Mail className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Email Verified!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your email has been successfully verified. You can now access all features.
            </p>
          </div>
          <div className="mt-8">
            <button
              onClick={() => navigate('/')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Continue to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <Mail className="mx-auto h-16 w-16 text-primary" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            {loading ? 'Verifying your email...' : 'Please verify your email address to continue.'}
          </p>
        </div>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        <div className="mt-8 space-y-4">
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 
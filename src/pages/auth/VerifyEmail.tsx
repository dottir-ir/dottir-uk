import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || !type) {
          throw new Error('Invalid verification link');
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
        });

        if (error) {
          throw error;
        }

        toast.success('Email verified successfully');
        navigate('/login');
      } catch (error: any) {
        toast.error(error.message || 'Failed to verify email');
        navigate('/login');
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Verifying your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {verifying
              ? 'Please wait while we verify your email address...'
              : 'Redirecting to login...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 
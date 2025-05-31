import React from 'react';
import { Link } from 'react-router-dom';

const VerificationRequired: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Verification Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account needs to be verified before you can access this feature.
            Please complete the verification process to continue.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link
            to="/profile/me"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Complete Verification
          </Link>
          <Link
            to="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationRequired; 
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MFAVerification } from '../../components/auth/MFAVerification';
import { SSOConnections } from '../../components/auth/SSOConnections';
import toast from 'react-hot-toast';
import logoWhite from '../../assets/icons/logo-site-white.svg';

// Left column marketing content component (reuse from SignUp)
const AuthMarketing: React.FC = () => (
  <div className="flex flex-col justify-center h-full w-full text-white bg-[#A3243C] min-h-screen max-w-[448px] mx-auto py-12 px-8">
    <div className="flex items-center" style={{ paddingBottom: '24px' }}>
      <img src={logoWhite} alt="Dottir Logo" style={{ height: '64px', width: 'auto' }} />
    </div>
    <p className="mb-10 text-xl opacity-90">Join thousands of healthcare professionals sharing medical cases and advancing knowledge together.</p>
    <div className="space-y-7">
      <div className="flex items-start">
        <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-10 mr-5">
          <svg className="h-7 w-7 text-white opacity-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87v-2a4 4 0 00-3-3.87m6 5.87a4 4 0 01-3-3.87m0 0V4a4 4 0 018 0v12a4 4 0 01-3 3.87z" /></svg>
        </span>
        <div>
          <div className="font-semibold text-lg">Collaborative Learning</div>
          <div className="text-base opacity-90">Share cases and learn from diverse medical experiences</div>
        </div>
      </div>
      <div className="flex items-start">
        <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-10 mr-5">
          <svg className="h-7 w-7 text-white opacity-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0H3" /></svg>
        </span>
        <div>
          <div className="font-semibold text-lg">Comprehensive Library</div>
          <div className="text-base opacity-90">Access cases organized by specialty and condition</div>
        </div>
      </div>
    </div>
  </div>
);

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSSO, setShowSSO] = useState(false);
  
  const { signIn, requiresMFA, verifyMFA, cancelMFA } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      // Note: Navigation will be handled by AuthContext after MFA verification
    } catch (error) {
      toast.error('Invalid email or password');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMFASuccess = () => {
    navigate('/dashboard');
  };

  if (requiresMFA) {
    return (
      <MFAVerification
        userId={useAuth().user?.id || ''}
        onSuccess={handleMFASuccess}
        onCancel={cancelMFA}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-row">
      {/* Left column */}
      <div className="w-1/2 flex flex-col justify-center bg-[#A3243C] min-h-screen">
        <AuthMarketing />
      </div>
      {/* Right column (login form) */}
      <div className="w-1/2 flex flex-col justify-center bg-gray-50 min-h-screen">
        <div className="w-full max-w-md mx-auto px-8 py-12">
          <div className="text-center">
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-sm text-gray-600">
              Share and discuss medical cases with professionals
            </p>
          </div>
          <form className="space-y-5 mt-8" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A3243C] focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A3243C] focus:border-transparent bg-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#A3243C] focus:ring-[#A3243C] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-[#A3243C] hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[#A3243C] hover:bg-[#8B1C32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A3243C] disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-[#A3243C] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
          <div className="pt-6 mt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p className="mb-1">Demo Accounts:</p>
            <p><b>Doctor:</b> jane@example.com (any password)</p>
            <p><b>Student:</b> john@example.com (any password)</p>
          </div>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowSSO(!showSSO)}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showSSO ? 'Hide' : 'Show'} Institutional Sign-In
              </button>
            </div>

            {showSSO && (
              <div className="mt-4">
                <SSOConnections />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';
import logo from '../../assets/icons/logo-site.svg';
import logoWhite from '../../assets/icons/logo-site-white.svg';

// Left column marketing content component (reuse from Login)
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

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill out all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signUp(email, password, name, role);
      if (result && result.warning) {
        toast.success('Account created successfully!');
        toast.error(result.warning);
      } else {
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (error) {
      toast.error('Failed to create account');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen w-full flex flex-row">
      {/* Left column */}
      <div className="w-1/2 flex flex-col justify-center bg-[#A3243C] min-h-screen">
        <AuthMarketing />
      </div>
      {/* Right column (signup form) */}
      <div className="w-1/2 flex flex-col justify-center bg-gray-50 min-h-screen">
        <div className="w-full max-w-md mx-auto px-8 py-12">
          <div className="text-center">
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create an account to share and discuss medical cases
            </p>
          </div>
          <form className="space-y-4 mt-8" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`py-3 px-4 rounded-lg border flex items-center justify-center font-medium transition-colors ${
                    role === 'doctor'
                      ? 'bg-white text-[#041225] border-[#041225]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-3 px-4 rounded-lg border flex items-center justify-center font-medium transition-colors ${
                    role === 'student'
                      ? 'bg-white text-[#041225] border-[#041225]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Student
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
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
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="font-medium text-primary hover:text-primary-dark">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-primary hover:text-primary-dark">
                  Privacy Policy
                </a>
              </label>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-[#A3243C] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
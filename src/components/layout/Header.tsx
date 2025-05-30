import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, Bell, Plus, User, LogOut, Home } from 'lucide-react';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-primary">Medi<span className="text-secondary">Share</span></span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Home size={18} className="mr-1" />
              Home
            </Link>
            {currentUser?.role === 'doctor' && (
              <Link 
                to="/create-post" 
                className="px-3 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-dark flex items-center"
              >
                <Plus size={18} className="mr-1" />
                New Case
              </Link>
            )}
            <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <Bell size={20} />
            </button>
            <div className="relative ml-3">
              <div className="flex items-center">
                <Link to={`/profile/${currentUser?.id}`} className="flex items-center space-x-2">
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={currentUser?.avatar}
                    alt="Profile"
                  />
                  <span className="hidden lg:block text-sm font-medium text-gray-700">
                    {currentUser?.name}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-4 p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home size={18} className="mr-2" />
              Home
            </Link>
            {currentUser?.role === 'doctor' && (
              <Link
                to="/create-post"
                className="block px-3 py-2 rounded-md text-base font-medium bg-primary text-white flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <Plus size={18} className="mr-2" />
                New Case
              </Link>
            )}
            <Link
              to={`/profile/${currentUser?.id}`}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <User size={18} className="mr-2" />
              My Profile
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
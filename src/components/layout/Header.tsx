import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';
import { usePosts } from '../../contexts/PostsContext';
import { Search } from 'lucide-react';
import logo from '../../assets/icons/logo-site.svg';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { searchTerm, setSearchTerm } = usePosts();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 mr-2"
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img src={logo} alt="Dottir Logo" className="h-16 w-auto" />
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 mx-8 justify-center">
            <div className="relative w-full max-w-[560px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for posts, topics, or tags"
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative ml-3">
              <div className="flex items-center">
                <Link to={`/profile/${user?.id}`} className="flex items-center space-x-2">
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user && 'avatar' in user ? (user.avatar as string) : '/default-avatar.png'}
                    alt="Profile"
                  />
                  <span className="hidden lg:block text-sm font-medium text-gray-700">
                    {user && 'name' in user ? (user.name as string) : 'User'}
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
              {isMenuOpen ? <X size={24} /> : <User size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="flex md:hidden w-full mt-2 justify-center">
          <div className="relative w-full max-w-[560px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for posts, topics, or tags"
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to={`/profile/${user?.id}`}
                className="px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 flex items-center"
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
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
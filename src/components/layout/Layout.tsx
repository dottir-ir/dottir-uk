import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <div className={`
            fixed md:static inset-y-0 left-0 z-50
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            w-64 md:w-1/4 lg:w-1/5
            bg-white md:bg-transparent
            shadow-lg md:shadow-none
          `}>
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>

          {/* Main Content */}
          <main className="w-full md:w-3/4 lg:w-4/5 transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
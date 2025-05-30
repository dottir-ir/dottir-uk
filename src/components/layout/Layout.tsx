import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="hidden md:block md:w-1/4 lg:w-1/5">
            <Sidebar />
          </div>
          <main className="w-full md:w-3/4 lg:w-4/5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
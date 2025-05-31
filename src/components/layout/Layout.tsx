import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { SessionTimeoutWarning } from '../auth/SessionTimeoutWarning';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <SessionTimeoutWarning timeoutDuration={30} warningThreshold={5} />
    </div>
  );
};

export default Layout;
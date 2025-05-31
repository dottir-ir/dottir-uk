import React, { useEffect, useState } from 'react';
import { authService } from '../../services/api/authService';
import { toast } from 'react-hot-toast';

interface SSOProvider {
  id: string;
  name: string;
  icon_url: string;
  description: string;
}

export const SSOConnections: React.FC = () => {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await authService.getSSOProviders();
      setProviders(data);
    } catch (error) {
      toast.error('Failed to load SSO providers');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (providerId: string) => {
    try {
      const authUrl = await authService.initiateSSO(providerId);
      window.location.href = authUrl;
    } catch (error) {
      toast.error('Failed to initiate SSO connection');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Institutional Sign-In</h2>
      <p className="mb-6 text-gray-600">
        Connect your account with your institution's single sign-on service for easier access.
      </p>
      <div className="space-y-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="flex items-center p-4 bg-white rounded-lg shadow-sm border hover:border-blue-500 transition-colors"
          >
            {provider.icon_url && (
              <img
                src={provider.icon_url}
                alt={provider.name}
                className="w-12 h-12 mr-4"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{provider.name}</h3>
              <p className="text-sm text-gray-600">{provider.description}</p>
            </div>
            <button
              onClick={() => handleConnect(provider.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Connect
            </button>
          </div>
        ))}
        {providers.length === 0 && (
          <p className="text-center text-gray-600 py-4">
            No SSO providers are currently available.
          </p>
        )}
      </div>
    </div>
  );
}; 
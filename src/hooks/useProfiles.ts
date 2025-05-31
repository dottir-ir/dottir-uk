import { useState, useEffect } from 'react';
import { Profile } from '../services/api/types';
import { profileService } from '../services/api/profileService';

export function useProfiles(userIds: string[]) {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Filter out userIds we already have profiles for
        const missingUserIds = userIds.filter(id => !profiles[id]);

        if (missingUserIds.length === 0) {
          setIsLoading(false);
          return;
        }

        // Fetch profiles for missing userIds
        const fetchedProfiles = await Promise.all(
          missingUserIds.map(id => profileService.getProfile(id))
        );

        // Update profiles state with new data
        setProfiles(prev => ({
          ...prev,
          ...Object.fromEntries(
            fetchedProfiles.map(profile => [profile.id, profile])
          ),
        }));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profiles'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [userIds.join(',')]); // Only re-run if userIds array changes

  return { profiles, isLoading, error };
} 
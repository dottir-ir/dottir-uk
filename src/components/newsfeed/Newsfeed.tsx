import React, { useEffect, useState } from 'react';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { getPersonalizedFeed } from '../../services/newsfeed';
import { Case } from '../../types/case';
import { CaseCard } from '../cases/CaseCard';
import { useAuth } from '../../contexts/AuthContext';

export const Newsfeed: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchCases = async (cursor?: string) => {
    if (!user) return;

    try {
      const response = await getPersonalizedFeed({
        userId: user.id,
        cursor,
        limit: 10
      });

      if (cursor) {
        setCases(prev => [...prev, ...response.cases]);
      } else {
        setCases(response.cases);
      }

      setHasMore(!!response.nextCursor);
      setError(null);
    } catch (err) {
      setError('Failed to load cases. Please try again.');
      console.error('Error loading cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const { lastElementRef } = useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore: () => {
      if (cases.length > 0) {
        fetchCases(cases[cases.length - 1].id);
      }
    }
  });

  useEffect(() => {
    fetchCases();
  }, [user]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Feed</h1>
      
      <div className="space-y-6">
        {cases.map((case_, index) => (
          <div
            key={case_.id}
            ref={index === cases.length - 1 ? lastElementRef : undefined}
          >
            <CaseCard case_={case_} />
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {!loading && cases.length === 0 && (
        <div className="text-center p-4 text-gray-500">
          No cases found. Follow some users or specialties to see their cases in your feed.
        </div>
      )}
    </div>
  );
}; 
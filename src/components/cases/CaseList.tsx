import React from 'react';
import { Case } from '../../services/api/types';
import { CaseCard } from './CaseCard';
import { useProfiles } from '../../hooks/useProfiles';

interface CaseListProps {
  cases: Case[];
  isLoading?: boolean;
  error?: Error | null;
}

export const CaseList: React.FC<CaseListProps> = ({ cases, isLoading, error }) => {
  const { profiles, isLoading: isLoadingProfiles } = useProfiles(
    cases.map((case_) => case_.author_id)
  );

  if (isLoading || isLoadingProfiles) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-[300px] animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        <p>Error loading cases: {error.message}</p>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No cases found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cases.map((case_) => {
        const author = profiles[case_.author_id];
        return (
          <CaseCard
            key={case_.id}
            case_={case_}
            authorName={author?.full_name || 'Unknown Author'}
            authorAvatar={author?.avatar_url}
          />
        );
      })}
    </div>
  );
}; 
import React from 'react';
import { cn } from '../../utils/cn';

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ className, currentPage, totalPages, onPageChange, ...props }, ref) => {
    const pages = React.useMemo(() => {
      const pages = [];
      const maxVisiblePages = 5;
      const halfVisiblePages = Math.floor(maxVisiblePages / 2);

      let startPage = Math.max(1, currentPage - halfVisiblePages);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      return pages;
    }, [currentPage, totalPages]);

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center space-x-2', className)}
        {...props}
      >
        <button
          className={cn(
            'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2',
            currentPage === 1 && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        {pages.map((page) => (
          <button
            key={page}
            className={cn(
              'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
              'border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10',
              currentPage === page && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          className={cn(
            'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2',
            currentPage === totalPages && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  }
);
Pagination.displayName = 'Pagination'; 
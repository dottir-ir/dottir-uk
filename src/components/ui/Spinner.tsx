import React from 'react';
import { cn } from '../../utils/cn';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          {
            'h-4 w-4': size === 'sm',
            'h-6 w-6': size === 'md',
            'h-8 w-8': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Spinner.displayName = 'Spinner'; 
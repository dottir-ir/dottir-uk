import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn(
      'relative rounded-full overflow-hidden bg-gray-100',
      sizeClasses[size],
      className
    )}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          {...props}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}; 
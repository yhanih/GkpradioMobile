import React from 'react';
import { Loader2 } from 'lucide-react';
import './Loading.css';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'md', text, fullScreen = false }) => {
  const sizeMap = {
    sm: 24,
    md: 48,
    lg: 64,
  };

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-content">
          <Loader2 size={sizeMap[size]} className="loading-spinner" />
          {text && <p className="loading-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <Loader2 size={sizeMap[size]} className="loading-spinner" />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

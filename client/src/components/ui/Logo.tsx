import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const sizeClasses: Record<string, string> = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Link to="/" className="flex items-center">
      <span className={`font-display text-primary-600 dark:text-primary-400 ${sizeClasses[size]}`}>
        Top Chef Fantasy
      </span>
    </Link>
  );
};

export default Logo;
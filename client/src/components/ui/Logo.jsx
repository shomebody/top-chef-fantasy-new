import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Link to="/" className="flex items-center">
      <span className="font-display text-primary-600 dark:text-primary-400">
        Top Chef Fantasy
      </span>
    </Link>
  );
};

export default Logo;


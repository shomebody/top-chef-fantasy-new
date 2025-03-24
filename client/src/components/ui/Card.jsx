import React from 'react';

const Card = ({ 
  children, 
  title = '',
  subtitle = '',
  action = null,
  className = '',
  padding = 'md',
  hover = false,
  bordered = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const borderClass = bordered ? 'border border-gray-200 dark:border-gray-700' : '';
  const hoverClass = hover ? 'hover:shadow-card-hover hover:-translate-y-1' : '';
  
  const cardClass = `
    bg-white dark:bg-gray-800 rounded-lg shadow-sm
    ${borderClass}
    ${hoverClass}
    ${className}
    transition-all duration-200
  `;
  
  return (
    <div className={cardClass}>
      {(title || action) && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            {title && <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={paddingClasses[padding] || paddingClasses.md}>
        {children}
      </div>
    </div>
  );
};

export default Card;
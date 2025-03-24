import React, { forwardRef } from 'react';

/**
 * Input component
 */
const Input = forwardRef(({
  label = '',
  error = '',
  type = 'text',
  id = '',
  name = '',
  placeholder = '',
  required = false,
  disabled = false,
  helper = '',
  className = '',
  onChange = () => {},
  ...props
}, ref) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800'} dark:text-white ${className}`;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={inputId}
        name={name}
        className={inputClasses}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" id={`${inputId}-error`}>
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400" id={`${inputId}-helper`}>
          {helper}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
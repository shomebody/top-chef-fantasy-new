import { forwardRef, ChangeEvent } from 'react';

interface InputProps {
  label?: string;
  error?: string;
  type?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helper?: string;
  className?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  // Add any other props that might be needed
  value?: string | number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  type = 'text',
  id,
  name,
  placeholder,
  required = false,
  disabled = false,
  helper,
  className = '',
  onChange,
  ...rest
}, ref) => {
  const inputClasses = `
    w-full px-3 py-2 border rounded-md 
    ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} 
    ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-900'}
    focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-600
    ${className}
  `;
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={onChange}
        className={inputClasses}
        {...rest}
      />
      
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helper}</p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

// Add display name for React DevTools
Input.displayName = 'Input';

export default Input;
import { forwardRef, type InputHTMLAttributes } from 'react';

// Extend the HTML input attributes to include our custom props
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  helper?: string;
  className?: string;
}

/**
 * Input component for form fields
 */
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
        className={inputClasses}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
        {...rest}
      />
      
      {helper && !error && (
        <p 
          id={`${id}-helper`}
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {helper}
        </p>
      )}
      
      {error && (
        <p 
          id={`${id}-error`}
          className="mt-1 text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

// Add display name for React DevTools
Input.displayName = 'Input';

export default Input;
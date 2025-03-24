import { forwardRef } from 'react';

const Input = forwardRef(({
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
  ...props
}, ref) => {
  const inputId = id || name;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={inputId}
        name={name}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${className}`}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
        {...props}
      />

      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600 dark:text-red-500"
        >
          {error}
        </p>
      )}

      {helper && !error && (
        <p
          id={`${inputId}-helper`}
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {helper}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
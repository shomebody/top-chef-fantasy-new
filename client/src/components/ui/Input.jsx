import { forwardRef } from 'react';

/**
 * @typedef {Object} InputProps
 * @property {string} [label]
 * @property {string} [error]
 * @property {string} [type]
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [placeholder]
 * @property {boolean} [required]
 * @property {boolean} [disabled]
 * @property {string} [helper]
 * @property {string} [className]
 * @property {Function} [onChange]
 */

/**
 * Input component
 * @param {InputProps} props
 * @param {import('react').Ref<HTMLInputElement>} ref
 * @returns {JSX.Element}
 */
const Input = forwardRef(({
  // @ts-ignore
  label = '',
  // @ts-ignore
  error = '',
  // @ts-ignore
  type = 'text',
  // @ts-ignore
  id = '',
  // @ts-ignore
  name = '',
  // @ts-ignore
  placeholder = '',
  // @ts-ignore
  required = false,
  // @ts-ignore
  disabled = false,
  // @ts-ignore
  helper = '',
  // @ts-ignore
  className = '',
  // @ts-ignore
  onChange = () => {},
  ...props
}, ref) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="block mb-2 text-sm font-medium">
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
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
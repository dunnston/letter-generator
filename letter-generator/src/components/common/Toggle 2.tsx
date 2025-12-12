import { forwardRef, type InputHTMLAttributes } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, className = '', id, checked, onChange, disabled, ...props }, ref) => {
    const toggleId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`flex items-start justify-between ${className}`}>
        <div className="flex-1">
          <label
            htmlFor={toggleId}
            className="text-sm font-medium text-primary-700 cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p className="text-sm text-primary-500">{description}</p>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={toggleId}
          disabled={disabled}
          onClick={() => {
            if (onChange && !disabled) {
              const syntheticEvent = {
                target: { checked: !checked },
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(syntheticEvent);
            }
          }}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
            border-2 border-transparent transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${checked ? 'bg-secondary-600' : 'bg-primary-200'}
          `}
        >
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full
              bg-white shadow ring-0 transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
        {/* Hidden input for form compatibility */}
        <input
          ref={ref}
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

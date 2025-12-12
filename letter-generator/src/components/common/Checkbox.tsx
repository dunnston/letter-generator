import { forwardRef, type InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`flex items-start ${className}`}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="
              h-4 w-4
              rounded
              border-primary-300
              text-secondary-600
              focus:ring-secondary-500 focus:ring-offset-0
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            {...props}
          />
        </div>
        <div className="ml-3">
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium text-primary-700 cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p className="text-sm text-primary-500">{description}</p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

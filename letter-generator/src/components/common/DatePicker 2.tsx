import { forwardRef, type InputHTMLAttributes } from 'react';
import { format, parseISO } from 'date-fns';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange?: (value: string) => void;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, hint, value, onChange, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    // Format the display value if needed
    const displayValue = value || '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-primary-700 mb-1"
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type="date"
          id={inputId}
          value={displayValue}
          onChange={handleChange}
          className={`
            w-full px-3 py-2
            border rounded-lg
            text-primary-800
            bg-white
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-primary-50 disabled:cursor-not-allowed
            ${error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
              : 'border-primary-300 focus:border-secondary-500 focus:ring-secondary-500'
            }
            ${className}
          `}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1 text-sm text-primary-500">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-error-600">{error}</p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

// Helper to format date for display
export const formatDateForDisplay = (isoDate: string): string => {
  try {
    return format(parseISO(isoDate), 'MMMM d, yyyy');
  } catch {
    return isoDate;
  }
};

// Helper to get today's date in ISO format
export const getTodayISO = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

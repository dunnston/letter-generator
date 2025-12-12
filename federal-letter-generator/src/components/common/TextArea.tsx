import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className = '', id, rows = 4, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-primary-700 mb-1"
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`
            w-full px-3 py-2
            border rounded-lg
            text-primary-800 placeholder-primary-400
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-primary-50 disabled:cursor-not-allowed
            resize-vertical
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

TextArea.displayName = 'TextArea';

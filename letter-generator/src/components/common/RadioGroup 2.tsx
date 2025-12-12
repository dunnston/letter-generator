import { createContext, useContext, type ReactNode } from 'react';

interface RadioGroupContextValue {
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  label,
  error,
  disabled,
  children,
  className = '',
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange, disabled }}>
      <fieldset className={className}>
        {label && (
          <legend className="text-sm font-medium text-primary-700 mb-3">
            {label}
          </legend>
        )}
        <div className="space-y-2">{children}</div>
        {error && (
          <p className="mt-2 text-sm text-error-600">{error}</p>
        )}
      </fieldset>
    </RadioGroupContext.Provider>
  );
}

interface RadioOptionProps {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function RadioOption({
  value,
  label,
  description,
  disabled: optionDisabled,
}: RadioOptionProps) {
  const context = useContext(RadioGroupContext);

  if (!context) {
    throw new Error('RadioOption must be used within a RadioGroup');
  }

  const { name, value: selectedValue, onChange, disabled: groupDisabled } = context;
  const isDisabled = optionDisabled || groupDisabled;
  const isChecked = selectedValue === value;
  const id = `${name}-${value}`;

  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={isChecked}
          onChange={() => onChange(value)}
          disabled={isDisabled}
          className="
            h-4 w-4
            border-primary-300
            text-secondary-600
            focus:ring-secondary-500 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
      </div>
      <div className="ml-3">
        <label
          htmlFor={id}
          className={`text-sm font-medium cursor-pointer ${
            isDisabled ? 'text-primary-400' : 'text-primary-700'
          }`}
        >
          {label}
        </label>
        {description && (
          <p className={`text-sm ${isDisabled ? 'text-primary-300' : 'text-primary-500'}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

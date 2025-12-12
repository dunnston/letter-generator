import type { WizardStep, StepConfig } from '../../types';
import { WIZARD_STEPS } from '../../types';

interface WizardProgressProps {
  currentStep: WizardStep;
  completedSteps?: WizardStep[];
  onStepClick?: (step: WizardStep) => void;
}

export function WizardProgress({
  currentStep,
  completedSteps = [],
  onStepClick,
}: WizardProgressProps) {
  const progress = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="px-4 py-3 bg-white border-b border-primary-100">
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-primary-500 mb-1">
          <span>Step {currentStep} of {WIZARD_STEPS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between overflow-x-auto">
        {WIZARD_STEPS.map((stepConfig, index) => {
          const stepNumber = (index + 1) as WizardStep;
          const isCurrent = stepNumber === currentStep;
          const isCompleted = completedSteps.includes(stepNumber) || stepNumber < currentStep;
          const isClickable = onStepClick && (isCompleted || stepNumber === currentStep);

          return (
            <button
              key={stepConfig.step}
              onClick={() => isClickable && onStepClick?.(stepNumber)}
              disabled={!isClickable}
              className={`
                flex flex-col items-center min-w-0 flex-1 px-1
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                group
              `}
              title={stepConfig.title}
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-xs font-semibold transition-colors
                  ${isCurrent
                    ? 'bg-secondary-600 text-white ring-2 ring-secondary-200'
                    : isCompleted
                    ? 'bg-accent-600 text-white'
                    : 'bg-primary-100 text-primary-400'
                  }
                  ${isClickable && !isCurrent ? 'group-hover:ring-2 group-hover:ring-secondary-200' : ''}
                `}
              >
                {isCompleted && !isCurrent ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={`
                  mt-1 text-[10px] leading-tight text-center truncate w-full
                  ${isCurrent ? 'text-secondary-700 font-medium' : 'text-primary-400'}
                `}
              >
                {stepConfig.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface WizardProgressCompactProps {
  currentStep: WizardStep;
  stepConfig: StepConfig;
}

export function WizardProgressCompact({ currentStep, stepConfig }: WizardProgressCompactProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-primary-100">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-secondary-600 text-white flex items-center justify-center font-semibold">
          {currentStep}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-primary-800">{stepConfig.title}</div>
        <div className="text-xs text-primary-500">{stepConfig.description}</div>
      </div>
      <div className="flex-shrink-0 text-sm text-primary-500">
        {currentStep} / {WIZARD_STEPS.length}
      </div>
    </div>
  );
}

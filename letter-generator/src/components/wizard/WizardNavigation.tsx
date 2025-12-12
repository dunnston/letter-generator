import { Button } from '../common';
import type { WizardStep } from '../../types';

interface WizardNavigationProps {
  currentStep: WizardStep;
  totalSteps: number;
  canProceed: boolean;
  isLoading?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave?: () => void;
  showSave?: boolean;
  nextLabel?: string;
  backLabel?: string;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  canProceed,
  isLoading = false,
  onBack,
  onNext,
  onSave,
  showSave = false,
  nextLabel,
  backLabel = 'Back',
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const getNextLabel = () => {
    if (nextLabel) return nextLabel;
    if (isLastStep) return 'Generate Letter';
    return 'Continue';
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-primary-200">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={isFirstStep || isLoading}
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {backLabel}
        </Button>

        {showSave && onSave && (
          <Button
            variant="ghost"
            onClick={onSave}
            disabled={isLoading}
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Save Progress
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-primary-500">
          Step {currentStep} of {totalSteps}
        </span>
        <Button
          variant={isLastStep ? 'accent' : 'primary'}
          onClick={onNext}
          disabled={!canProceed || isLoading}
          isLoading={isLoading}
        >
          {getNextLabel()}
          {!isLastStep && (
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}

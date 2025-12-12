import { type ReactNode } from 'react';
import { WizardProgress } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { useWizardStore } from '../../store/wizardStore';
import { WIZARD_STEPS, type WizardStep } from '../../types';

interface WizardContainerProps {
  children: ReactNode;
}

export function WizardContainer({ children }: WizardContainerProps) {
  const { currentStep, nextStep, prevStep, setStep, getStepValidation } = useWizardStore();

  const currentStepConfig = WIZARD_STEPS.find((s) => s.step === currentStep);
  const canProceed = getStepValidation(currentStep);

  const handleStepClick = (step: WizardStep) => {
    // Allow going back to any previous step
    if (step < currentStep) {
      setStep(step);
    }
    // Allow going forward only to the next step and only if current is valid
    else if (step === currentStep + 1 && canProceed) {
      nextStep();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <WizardProgress
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4">
          {currentStepConfig && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-primary-800">
                {currentStepConfig.title}
              </h2>
              <p className="text-sm text-primary-500 mt-1">
                {currentStepConfig.description}
                {currentStepConfig.isOptional && (
                  <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                    Optional
                  </span>
                )}
              </p>
            </div>
          )}

          {children}
        </div>
      </div>

      <WizardNavigation
        currentStep={currentStep}
        totalSteps={WIZARD_STEPS.length}
        canProceed={canProceed}
        onBack={prevStep}
        onNext={nextStep}
        showSave={true}
      />
    </div>
  );
}

interface WizardStepContentProps {
  children: ReactNode;
  className?: string;
}

export function WizardStepContent({ children, className = '' }: WizardStepContentProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-primary-200 p-6 ${className}`}>
      {children}
    </div>
  );
}

interface WizardStepSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function WizardStepSection({
  title,
  description,
  children,
  className = '',
}: WizardStepSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="border-b border-primary-100 pb-3">
          {title && (
            <h3 className="text-base font-medium text-primary-700">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-primary-500 mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

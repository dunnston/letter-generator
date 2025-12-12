import { useWizardStore } from '../../../store/wizardStore';
import { Toggle, Select } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type { MonitoringFrequency } from '../../../types';

const FREQUENCY_OPTIONS = [
  { value: 'annually', label: 'Annually' },
  { value: 'semi-annually', label: 'Semi-Annually' },
  { value: 'quarterly', label: 'Quarterly' },
];

const PLANNING_STEPS = [
  {
    step: 1,
    title: 'Understanding Your Personal and Financial Circumstances',
    description: 'Gathering comprehensive information about your current situation',
  },
  {
    step: 2,
    title: 'Identifying and Selecting Goals',
    description: 'Defining your short-term and long-term financial objectives',
  },
  {
    step: 3,
    title: 'Analyzing Your Current Course of Action',
    description: 'Evaluating your existing financial strategies and positions',
  },
  {
    step: 4,
    title: 'Developing Financial Planning Recommendations',
    description: 'Creating personalized strategies to achieve your goals',
  },
  {
    step: 5,
    title: 'Presenting the Financial Planning Recommendations',
    description: 'Reviewing and discussing the proposed plan with you',
  },
  {
    step: 6,
    title: 'Implementing the Financial Planning Recommendations',
    description: 'Executing the agreed-upon strategies and action items',
    optional: true,
    toggleKey: 'includeImplementation' as const,
  },
  {
    step: 7,
    title: 'Monitoring Progress and Updating',
    description: 'Ongoing review and adjustments to keep your plan on track',
    optional: true,
    toggleKey: 'includeMonitoring' as const,
  },
];

export function PlanningProcessStep() {
  const { data, updatePlanningProcess } = useWizardStore();
  const process = data.planningProcess;

  const handleToggle = (key: 'includeImplementation' | 'includeMonitoring' | 'includeUpdating') => {
    updatePlanningProcess({ [key]: !process?.[key] });
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePlanningProcess({ monitoringFrequency: e.target.value as MonitoringFrequency });
  };

  const getProcessPreview = () => {
    const activeSteps = PLANNING_STEPS.filter((step) => {
      if (!step.optional) return true;
      if (step.toggleKey === 'includeImplementation') return process?.includeImplementation;
      if (step.toggleKey === 'includeMonitoring') return process?.includeMonitoring;
      return true;
    });

    let preview = 'Financial Planning Process:\n\n';
    activeSteps.forEach((step) => {
      preview += `${step.step}. ${step.title}\n`;
    });

    if (process?.includeMonitoring) {
      preview += `\nMonitoring Frequency: ${
        FREQUENCY_OPTIONS.find((f) => f.value === process?.monitoringFrequency)?.label || 'Annually'
      }`;
    }

    return preview;
  };

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* CFP 7-Step Process Overview */}
        <WizardStepSection
          title="CFP Board 7-Step Financial Planning Process"
          description="The standard financial planning process that will be described in your engagement letter."
        >
          <div className="space-y-4">
            {PLANNING_STEPS.map((step) => (
              <div
                key={step.step}
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  step.optional
                    ? process?.[step.toggleKey!]
                      ? 'border-secondary-200 bg-secondary-50'
                      : 'border-primary-200 bg-primary-50 opacity-60'
                    : 'border-primary-200 bg-white'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step.optional && !process?.[step.toggleKey!]
                      ? 'bg-primary-200 text-primary-500'
                      : 'bg-secondary-600 text-white'
                  }`}
                >
                  {step.step}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-primary-800">{step.title}</h4>
                  <p className="text-sm text-primary-500 mt-0.5">{step.description}</p>
                  {step.optional && (
                    <span className="inline-block mt-1 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </WizardStepSection>

        {/* Optional Steps Configuration */}
        <WizardStepSection
          title="Optional Services"
          description="Select which optional planning services will be included in this engagement."
        >
          <div className="space-y-4">
            <Toggle
              label="Include Implementation Assistance"
              description="You will help the client implement the financial planning recommendations"
              checked={process?.includeImplementation ?? true}
              onChange={() => handleToggle('includeImplementation')}
            />

            <Toggle
              label="Include Ongoing Monitoring"
              description="You will monitor the client's progress toward their financial goals"
              checked={process?.includeMonitoring ?? true}
              onChange={() => handleToggle('includeMonitoring')}
            />

            {process?.includeMonitoring && (
              <div className="ml-4 pl-4 border-l-2 border-secondary-200">
                <Select
                  label="Monitoring Frequency"
                  options={FREQUENCY_OPTIONS}
                  value={process?.monitoringFrequency || 'annually'}
                  onChange={handleFrequencyChange}
                  hint="How often will you review the client's financial plan?"
                />

                <div className="mt-4">
                  <Toggle
                    label="Include Plan Updating"
                    description="The plan will be updated as circumstances change during monitoring reviews"
                    checked={process?.includeUpdating ?? true}
                    onChange={() => handleToggle('includeUpdating')}
                  />
                </div>
              </div>
            )}
          </div>
        </WizardStepSection>

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">Process Preview</h4>
          <pre className="text-sm text-primary-600 whitespace-pre-wrap font-sans">
            {getProcessPreview()}
          </pre>
        </div>

        {/* Info Box */}
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-secondary-800">About the CFP Process</h4>
              <p className="text-sm text-secondary-700 mt-1">
                The CFP Board's financial planning process provides a structured approach to helping
                clients achieve their financial goals. Steps 1-5 are always included. Steps 6
                (Implementation) and 7 (Monitoring) are optional based on the scope of your
                engagement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}

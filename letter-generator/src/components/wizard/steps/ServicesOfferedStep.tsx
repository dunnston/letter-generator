import { useWizardStore } from '../../../store/wizardStore';
import { Checkbox } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type { InsuranceLine, ServicesOffered } from '../../../types';

type BooleanServiceKey = 'financialPlanning' | 'investmentAdvisory' | 'brokerageServices' | 'riskManagement';

const SERVICE_TYPES = [
  {
    key: 'financialPlanning' as const,
    label: 'Financial Planning',
    description: 'Comprehensive financial planning services including goal-setting, analysis, and recommendations',
  },
  {
    key: 'investmentAdvisory' as const,
    label: 'Investment Advisory',
    description: 'Ongoing investment management and advisory services',
  },
  {
    key: 'brokerageServices' as const,
    label: 'Brokerage Services',
    description: 'Securities transactions and brokerage account services',
  },
  {
    key: 'riskManagement' as const,
    label: 'Risk Management / Insurance',
    description: 'Insurance planning and risk management services',
  },
];

const INSURANCE_LINES: Array<{
  value: InsuranceLine;
  label: string;
  description: string;
}> = [
  {
    value: 'life',
    label: 'Life Insurance',
    description: 'Term, whole, universal, and variable life products',
  },
  {
    value: 'long_term_care',
    label: 'Long-Term Care Insurance',
    description: 'Coverage for nursing home and assisted living care',
  },
  {
    value: 'disability',
    label: 'Disability Insurance',
    description: 'Income protection for disability events',
  },
  {
    value: 'health',
    label: 'Health Insurance',
    description: 'Medical and health coverage products',
  },
  {
    value: 'property_casualty',
    label: 'Property & Casualty Insurance',
    description: 'Home, auto, and liability coverage',
  },
];

export function ServicesOfferedStep() {
  const { data, updateServices } = useWizardStore();
  const services = data.services;

  const handleServiceToggle = (key: BooleanServiceKey) => {
    const newValue = !services?.[key];
    const updates: Partial<ServicesOffered> = { [key]: newValue };

    // Clear insurance lines if risk management is disabled
    if (key === 'riskManagement' && !newValue) {
      updates.insuranceLines = [];
    }

    updateServices(updates);
  };

  const handleInsuranceLineToggle = (line: InsuranceLine) => {
    const currentLines = services?.insuranceLines || [];

    // Handle "all_lines" specially
    if (line === 'all_lines') {
      if (currentLines.includes('all_lines')) {
        updateServices({ insuranceLines: [] });
      } else {
        updateServices({ insuranceLines: ['all_lines'] });
      }
      return;
    }

    // If "all_lines" is selected and user clicks specific line, switch to specific lines
    if (currentLines.includes('all_lines')) {
      const allOtherLines = INSURANCE_LINES.map(l => l.value).filter(l => l !== line);
      updateServices({ insuranceLines: allOtherLines });
      return;
    }

    // Toggle the specific line
    if (currentLines.includes(line)) {
      updateServices({ insuranceLines: currentLines.filter(l => l !== line) });
    } else {
      updateServices({ insuranceLines: [...currentLines, line] });
    }
  };

  const isInsuranceLineSelected = (line: InsuranceLine) => {
    const currentLines = services?.insuranceLines || [];
    if (currentLines.includes('all_lines') && line !== 'all_lines') {
      return true;
    }
    return currentLines.includes(line);
  };

  const getServicesPreview = () => {
    const selected = SERVICE_TYPES.filter(s => services?.[s.key]);
    if (selected.length === 0) {
      return '[Select at least one service]';
    }

    let preview = 'Services to be provided:\n';
    selected.forEach(s => {
      preview += `• ${s.label}\n`;

      if (s.key === 'riskManagement' && services?.insuranceLines?.length) {
        const lines = services.insuranceLines.includes('all_lines')
          ? 'All lines of insurance'
          : INSURANCE_LINES
              .filter(l => services.insuranceLines?.includes(l.value))
              .map(l => l.label)
              .join(', ');
        preview += `  (Insurance lines: ${lines})\n`;
      }
    });

    return preview;
  };

  const selectedCount = SERVICE_TYPES.filter(s => services?.[s.key]).length;

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Services Selection */}
        <WizardStepSection
          title="Services You Will Provide"
          description="Select all services that will be included in this engagement."
        >
          <div className="space-y-3">
            {SERVICE_TYPES.map((service) => (
              <Checkbox
                key={service.key}
                label={service.label}
                description={service.description}
                checked={!!services?.[service.key]}
                onChange={() => handleServiceToggle(service.key)}
              />
            ))}
          </div>

          {selectedCount === 0 && (
            <p className="mt-3 text-sm text-warning-600">
              Please select at least one service to continue.
            </p>
          )}
        </WizardStepSection>

        {/* Insurance Lines - Only shown if Risk Management is selected */}
        {services?.riskManagement && (
          <WizardStepSection
            title="Insurance Lines"
            description="Select the types of insurance you are licensed to offer."
          >
            <div className="space-y-3">
              {/* All Lines option */}
              <div className="border-b border-primary-200 pb-3 mb-3">
                <Checkbox
                  label="All Lines of Insurance"
                  description="Select this if you are licensed for all insurance lines"
                  checked={(services?.insuranceLines || []).includes('all_lines')}
                  onChange={() => handleInsuranceLineToggle('all_lines')}
                />
              </div>

              {/* Individual lines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {INSURANCE_LINES.map((line) => (
                  <Checkbox
                    key={line.value}
                    label={line.label}
                    description={line.description}
                    checked={isInsuranceLineSelected(line.value)}
                    onChange={() => handleInsuranceLineToggle(line.value)}
                    disabled={(services?.insuranceLines || []).includes('all_lines')}
                  />
                ))}
              </div>
            </div>
          </WizardStepSection>
        )}

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">
            Services Preview
          </h4>
          <pre className="text-sm text-primary-600 whitespace-pre-wrap font-sans">
            {getServicesPreview()}
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-secondary-800">
                Service Selection Tips
              </h4>
              <p className="text-sm text-secondary-700 mt-1">
                The services you select will determine subsequent sections of the engagement letter,
                including fee structures and disclosure requirements. Select only the services you
                will actually provide under this engagement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}

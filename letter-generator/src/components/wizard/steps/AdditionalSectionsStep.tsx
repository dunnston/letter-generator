import { useState, useEffect } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { useTemplateStore } from '../../../store/templateStore';
import { Button, Input, Select, Toggle, TextArea } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type {
  AdditionalSections,
  AdvisorInfo,
  EngagementTermination,
  PrivacyPolicyDelivery,
} from '../../../types';

const TERMINATION_OPTIONS = [
  { value: 'ongoing_until_terminated', label: 'Ongoing until terminated by either party' },
  { value: 'fixed_term', label: 'Fixed term engagement' },
];

const PRIVACY_OPTIONS = [
  { value: 'included', label: 'Included with this letter' },
  { value: 'enclosed', label: 'Enclosed separately' },
  { value: 'separate', label: 'Will be delivered separately' },
  { value: 'previously_provided', label: 'Previously provided to client' },
  { value: 'link', label: 'Available at a link' },
];

const DEFAULT_RESPONSIBILITIES = [
  'Providing complete and accurate information about your financial situation',
  'Reviewing all documents and recommendations carefully',
  'Asking questions when you do not understand something',
  'Notifying us promptly of any significant changes in your circumstances',
  'Making timely decisions on recommendations provided',
  'Keeping copies of all documents for your records',
];

export function AdditionalSectionsStep() {
  const { data, updateAdditional, updateAdvisor, applyAdvisorDefaults } = useWizardStore();
  const { settings } = useTemplateStore();
  const additional = data.additional || ({} as AdditionalSections);
  const advisor = data.advisor || ({} as AdvisorInfo);

  const [newResponsibility, setNewResponsibility] = useState('');

  // Auto-populate advisor info from settings if fields are empty
  useEffect(() => {
    const defaultAdvisor = settings.defaultAdvisor;
    if (defaultAdvisor && Object.keys(defaultAdvisor).length > 0) {
      // Only apply if at least one advisor field is empty
      const hasEmptyFields =
        !advisor.name || !advisor.email || !advisor.firmName;
      if (hasEmptyFields) {
        applyAdvisorDefaults(defaultAdvisor);
      }
    }
  }, []); // Run only once on mount

  // Client Responsibilities Handlers
  const handleAddResponsibility = () => {
    if (!newResponsibility.trim()) return;
    const current = additional.clientResponsibilities || [];
    updateAdditional({
      clientResponsibilities: [...current, newResponsibility.trim()],
    });
    setNewResponsibility('');
  };

  const handleRemoveResponsibility = (index: number) => {
    const current = additional.clientResponsibilities || [];
    updateAdditional({
      clientResponsibilities: current.filter((_, i) => i !== index),
    });
  };

  const handleAddDefaultResponsibilities = () => {
    const current = additional.clientResponsibilities || [];
    const newOnes = DEFAULT_RESPONSIBILITIES.filter((r) => !current.includes(r));
    updateAdditional({
      clientResponsibilities: [...current, ...newOnes],
    });
  };

  // Additional Section Handlers
  const handleTerminationChange = (value: EngagementTermination) => {
    updateAdditional({ engagementTermination: value });
  };

  const handlePrivacyChange = (value: PrivacyPolicyDelivery) => {
    updateAdditional({ privacyPolicyDelivery: value });
  };

  // Preview
  const getPreview = () => {
    const parts: string[] = [];

    if (additional.clientResponsibilities?.length) {
      parts.push('Client Responsibilities:');
      additional.clientResponsibilities.forEach((r) => parts.push(`• ${r}`));
      parts.push('');
    }

    parts.push(
      `Engagement: ${
        additional.engagementTermination === 'fixed_term'
          ? 'Fixed term'
          : 'Ongoing until terminated'
      }`
    );
    if (additional.terminationNotice) {
      parts.push(`Notice period: ${additional.terminationNotice}`);
    }

    const privacyLabel = PRIVACY_OPTIONS.find((o) => o.value === additional.privacyPolicyDelivery)?.label || 'N/A';
    if (additional.privacyPolicyDelivery === 'link' && additional.privacyPolicyLink) {
      parts.push(`Privacy Policy: ${privacyLabel} (${additional.privacyPolicyLink})`);
    } else {
      parts.push(`Privacy Policy: ${privacyLabel}`);
    }

    if (additional.hasDisciplinaryHistory) {
      parts.push(`\nDisciplinary History: Yes`);
      if (additional.disciplinaryDescription) {
        parts.push(additional.disciplinaryDescription);
      }
    } else if (additional.includeCleanRecord) {
      parts.push(`\nClean regulatory record statement included`);
    }

    if (additional.hasBankruptcyHistory) {
      parts.push(`\nBankruptcy History: Yes`);
      if (additional.bankruptcyDescription) {
        parts.push(additional.bankruptcyDescription);
      }
    }

    if (advisor.name) {
      parts.push(`\nAdvisor: ${advisor.name}${advisor.credentials ? `, ${advisor.credentials}` : ''}`);
      parts.push(`Firm: ${advisor.firmName || 'N/A'}`);
    }

    return parts.join('\n');
  };

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Client Responsibilities */}
        <WizardStepSection
          title="Client Responsibilities"
          description="What is expected of the client during the engagement."
        >
          <div className="space-y-4">
            {(additional.clientResponsibilities || []).length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-primary-200 rounded-lg">
                <p className="text-sm text-primary-500 mb-3">No responsibilities added yet</p>
                <Button onClick={handleAddDefaultResponsibilities}>
                  Add Standard Responsibilities
                </Button>
              </div>
            ) : (
              <>
                <ul className="space-y-2">
                  {(additional.clientResponsibilities || []).map((responsibility, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg"
                    >
                      <span className="flex-1 text-sm text-primary-700">{responsibility}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveResponsibility(index)}
                      >
                        <svg
                          className="w-4 h-4 text-error-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddDefaultResponsibilities}
                >
                  Add Missing Standard Responsibilities
                </Button>
              </>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Add custom responsibility..."
                value={newResponsibility}
                onChange={(e) => setNewResponsibility(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddResponsibility} disabled={!newResponsibility.trim()}>
                Add
              </Button>
            </div>
          </div>
        </WizardStepSection>

        {/* Engagement Termination */}
        <WizardStepSection
          title="Engagement Termination"
          description="Terms for ending the client relationship."
        >
          <div className="space-y-4">
            <Select
              label="Termination Type"
              options={TERMINATION_OPTIONS}
              value={additional.engagementTermination || 'ongoing_until_terminated'}
              onChange={(e) => handleTerminationChange(e.target.value as EngagementTermination)}
            />

            <Input
              label="Notice Period (Optional)"
              value={additional.terminationNotice || ''}
              onChange={(e) => updateAdditional({ terminationNotice: e.target.value })}
              placeholder="e.g., 30 days written notice"
              hint="How much notice is required to terminate the engagement"
            />
          </div>
        </WizardStepSection>

        {/* Privacy Policy */}
        <WizardStepSection
          title="Privacy Policy Delivery"
          description="How the privacy policy will be provided to the client."
        >
          <div className="space-y-4">
            <Select
              label="Privacy Policy Delivery Method"
              options={PRIVACY_OPTIONS}
              value={additional.privacyPolicyDelivery || 'included'}
              onChange={(e) => handlePrivacyChange(e.target.value as PrivacyPolicyDelivery)}
            />
            {additional.privacyPolicyDelivery === 'link' && (
              <Input
                label="Privacy Policy URL"
                type="url"
                value={additional.privacyPolicyLink || ''}
                onChange={(e) => updateAdditional({ privacyPolicyLink: e.target.value })}
                placeholder="https://yourfirm.com/privacy-policy"
              />
            )}
          </div>
        </WizardStepSection>

        {/* Disciplinary History */}
        <WizardStepSection
          title="Disciplinary History"
          description="Disclosure of any disciplinary or legal events."
        >
          <div className="space-y-4">
            <Toggle
              label="Disciplinary History to Disclose"
              description="You or your firm have disciplinary events that must be disclosed"
              checked={additional.hasDisciplinaryHistory || false}
              onChange={() =>
                updateAdditional({ hasDisciplinaryHistory: !additional.hasDisciplinaryHistory })
              }
            />

            {additional.hasDisciplinaryHistory ? (
              <div className="ml-4 pl-4 border-l-2 border-warning-200">
                <TextArea
                  label="Disciplinary History Description"
                  value={additional.disciplinaryDescription || ''}
                  onChange={(e) =>
                    updateAdditional({ disciplinaryDescription: e.target.value })
                  }
                  placeholder="Describe the disciplinary events that must be disclosed..."
                  rows={4}
                />
              </div>
            ) : (
              <Toggle
                label="Include Clean Record Statement"
                description="Include a statement that you have no material disciplinary events to disclose"
                checked={additional.includeCleanRecord ?? true}
                onChange={() =>
                  updateAdditional({ includeCleanRecord: !additional.includeCleanRecord })
                }
              />
            )}

            <Toggle
              label="Bankruptcy History to Disclose"
              description="You have bankruptcy history that must be disclosed"
              checked={additional.hasBankruptcyHistory || false}
              onChange={() =>
                updateAdditional({ hasBankruptcyHistory: !additional.hasBankruptcyHistory })
              }
            />

            {additional.hasBankruptcyHistory && (
              <div className="ml-4 pl-4 border-l-2 border-warning-200">
                <TextArea
                  label="Bankruptcy History Description"
                  value={additional.bankruptcyDescription || ''}
                  onChange={(e) =>
                    updateAdditional({ bankruptcyDescription: e.target.value })
                  }
                  placeholder="Describe the bankruptcy events that must be disclosed..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </WizardStepSection>

        {/* Advisor Information */}
        <WizardStepSection
          title="Advisor Information"
          description="Your contact information for the signature block."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={advisor.name || ''}
                onChange={(e) => updateAdvisor({ name: e.target.value })}
                placeholder="e.g., John Smith"
                required
              />
              <Input
                label="Credentials"
                value={advisor.credentials || ''}
                onChange={(e) => updateAdvisor({ credentials: e.target.value })}
                placeholder="e.g., CFP®, CPA, ChFC"
              />
            </div>

            <Input
              label="Firm Name"
              value={advisor.firmName || ''}
              onChange={(e) => updateAdvisor({ firmName: e.target.value })}
              placeholder="e.g., ABC Financial Planning, LLC"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                value={advisor.email || ''}
                onChange={(e) => updateAdvisor({ email: e.target.value })}
                placeholder="john@abcfinancial.com"
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={advisor.phone || ''}
                onChange={(e) => updateAdvisor({ phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </WizardStepSection>

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">Additional Sections Preview</h4>
          <pre className="text-sm text-primary-600 whitespace-pre-wrap font-sans">
            {getPreview()}
          </pre>
        </div>

        {/* Validation Warning */}
        {(!advisor.name || !advisor.email) && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-warning-800">Required Information</h4>
                <p className="text-sm text-warning-700 mt-1">
                  Please enter your name and email address to continue to the review step.
                </p>
              </div>
            </div>
          </div>
        )}

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
              <h4 className="text-sm font-medium text-secondary-800">Disclosure Requirements</h4>
              <p className="text-sm text-secondary-700 mt-1">
                SEC and FINRA rules require disclosure of certain disciplinary and bankruptcy events.
                Form ADV and Form CRS contain additional disclosure requirements that should be
                reviewed with your compliance team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}

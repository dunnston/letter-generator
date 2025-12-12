import { useWizardStore } from '../../../store/wizardStore';
import { RadioGroup, RadioOption, Input } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type { InitialContactType } from '../../../types';

const CONTACT_TYPES: Array<{
  value: InitialContactType;
  label: string;
  description: string;
  openingText: string;
}> = [
  {
    value: 'conversation',
    label: 'Conversation',
    description: 'You had a conversation with the client',
    openingText: 'I enjoyed our conversation and I am pleased to be working with you.',
  },
  {
    value: 'email',
    label: 'Email',
    description: 'The client reached out via email',
    openingText: 'Thank you for your email. I am pleased to be working with you.',
  },
  {
    value: 'meeting',
    label: 'Meeting',
    description: 'You met with the client in person',
    openingText: 'It was a pleasure meeting with you. I am pleased to be working with you.',
  },
  {
    value: 'phone',
    label: 'Phone Call',
    description: 'You spoke with the client by phone',
    openingText: 'Thank you for our phone conversation. I am pleased to be working with you.',
  },
  {
    value: 'referral',
    label: 'Referral',
    description: 'The client was referred to you',
    openingText:
      'Thank you for reaching out. [Referrer Name] spoke highly of you, and I am pleased to be working with you.',
  },
];

export function InitialContactStep() {
  const { data, updateInitialContact } = useWizardStore();
  const contact = data.initialContact;

  const selectedType = CONTACT_TYPES.find((t) => t.value === contact?.type);

  const getPreviewText = () => {
    if (!selectedType) return '[Select a contact type to see the opening paragraph]';

    let text = selectedType.openingText;

    // Replace referrer name placeholder if applicable
    if (contact?.type === 'referral' && contact.referrerName) {
      text = text.replace('[Referrer Name]', contact.referrerName);
    }

    // Add custom description if provided
    if (contact?.customDescription) {
      text = contact.customDescription;
    }

    return text;
  };

  return (
    <WizardStepContent>
      <div className="space-y-8">
        <WizardStepSection
          title="How did you initially connect with this client?"
          description="This determines the opening paragraph of the engagement letter."
        >
          <RadioGroup
            name="contactType"
            value={contact?.type || ''}
            onChange={(value) => updateInitialContact({ type: value as InitialContactType })}
          >
            {CONTACT_TYPES.map((type) => (
              <RadioOption
                key={type.value}
                value={type.value}
                label={type.label}
                description={type.description}
              />
            ))}
          </RadioGroup>
        </WizardStepSection>

        {/* Referral Name Input */}
        {contact?.type === 'referral' && (
          <WizardStepSection title="Referrer Information">
            <div className="max-w-md">
              <Input
                label="Referrer's Name"
                value={contact?.referrerName || ''}
                onChange={(e) => updateInitialContact({ referrerName: e.target.value })}
                placeholder="John Smith"
                hint="The name of the person who referred this client to you"
              />
            </div>
          </WizardStepSection>
        )}

        {/* Custom Description */}
        <WizardStepSection
          title="Custom Opening (Optional)"
          description="Override the standard opening with your own text."
        >
          <div className="space-y-2">
            <textarea
              value={contact?.customDescription || ''}
              onChange={(e) => updateInitialContact({ customDescription: e.target.value })}
              placeholder="Leave blank to use the standard opening, or enter custom text..."
              rows={3}
              className="w-full px-3 py-2 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
            />
            {contact?.customDescription && (
              <button
                type="button"
                onClick={() => updateInitialContact({ customDescription: '' })}
                className="text-sm text-secondary-600 hover:text-secondary-700"
              >
                Clear custom text and use standard opening
              </button>
            )}
          </div>
        </WizardStepSection>

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">Opening Paragraph Preview</h4>
          <p className="text-sm text-primary-600 italic">{getPreviewText()}</p>
        </div>
      </div>
    </WizardStepContent>
  );
}

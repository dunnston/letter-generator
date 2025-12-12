import { useState } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { Checkbox, RadioGroup, RadioOption, Input, Button } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type { DeliveryMethod } from '../../../types';

type BooleanDocumentKey = 'formCRS' | 'formADV' | 'regBIDisclosure' | 'brokerageAgreement' | 'investmentAdvisoryAgreement';

const STANDARD_DOCUMENTS = [
  {
    key: 'formCRS' as const,
    label: 'Form CRS (Client Relationship Summary)',
    description: 'SEC-required relationship summary document',
  },
  {
    key: 'formADV' as const,
    label: 'Form ADV Part 2A (Firm Brochure)',
    description: 'Investment adviser disclosure document',
  },
  {
    key: 'regBIDisclosure' as const,
    label: 'Regulation Best Interest Disclosure',
    description: 'Required for broker-dealer recommendations',
  },
  {
    key: 'brokerageAgreement' as const,
    label: 'Brokerage Agreement',
    description: 'Agreement for brokerage services',
  },
  {
    key: 'investmentAdvisoryAgreement' as const,
    label: 'Investment Advisory Agreement',
    description: 'Agreement for advisory services',
  },
];

const DELIVERY_METHODS: Array<{
  value: DeliveryMethod;
  label: string;
  description: string;
}> = [
  {
    value: 'handed',
    label: 'Handed to Client',
    description: 'Documents were provided in person',
  },
  {
    value: 'enclosed',
    label: 'Enclosed with Letter',
    description: 'Documents are included with this letter',
  },
  {
    value: 'attached',
    label: 'Attached (Email)',
    description: 'Documents are attached to the email',
  },
  {
    value: 'separate_correspondence',
    label: 'Separate Correspondence',
    description: 'Documents will be/were sent separately',
  },
];

export function FirmDocumentsStep() {
  const { data, updateFirmDocuments } = useWizardStore();
  const docs = data.firmDocuments;
  const [customDocInput, setCustomDocInput] = useState('');

  const handleDocumentToggle = (key: BooleanDocumentKey) => {
    updateFirmDocuments({ [key]: !docs?.[key] });
  };

  const handleAddCustomDocument = () => {
    if (customDocInput.trim()) {
      updateFirmDocuments({
        customDocuments: [...(docs?.customDocuments || []), customDocInput.trim()],
      });
      setCustomDocInput('');
    }
  };

  const handleRemoveCustomDocument = (index: number) => {
    const updated = (docs?.customDocuments || []).filter((_, i) => i !== index);
    updateFirmDocuments({ customDocuments: updated });
  };

  const getDeliveryText = () => {
    const method = DELIVERY_METHODS.find((m) => m.value === docs?.deliveryMethod);
    if (!method) return '[Select a delivery method]';

    const selectedDocs = STANDARD_DOCUMENTS.filter(
      (d) => docs?.[d.key]
    ).map((d) => d.label);
    const customDocs = docs?.customDocuments || [];
    const allDocs = [...selectedDocs, ...customDocs];

    if (allDocs.length === 0) return '[Select at least one document]';

    let deliveryPhrase = '';
    switch (method.value) {
      case 'handed':
        deliveryPhrase = 'I have handed you';
        break;
      case 'enclosed':
        deliveryPhrase = 'Enclosed with this letter, please find';
        break;
      case 'attached':
        deliveryPhrase = 'Attached to this email, please find';
        break;
      case 'separate_correspondence':
        deliveryPhrase = 'Under separate correspondence, you will receive';
        break;
    }

    return `${deliveryPhrase} the following documents: ${allDocs.join(', ')}.`;
  };

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Standard Documents */}
        <WizardStepSection
          title="Documents Provided"
          description="Select the documents you are providing to the client."
        >
          <div className="space-y-3">
            {STANDARD_DOCUMENTS.map((doc) => (
              <Checkbox
                key={doc.key}
                label={doc.label}
                description={doc.description}
                checked={!!docs?.[doc.key]}
                onChange={() => handleDocumentToggle(doc.key)}
              />
            ))}
          </div>
        </WizardStepSection>

        {/* Custom Documents */}
        <WizardStepSection
          title="Additional Documents"
          description="Add any other documents you are providing."
        >
          <div className="space-y-3">
            {/* List of custom documents */}
            {(docs?.customDocuments || []).length > 0 && (
              <div className="space-y-2">
                {docs?.customDocuments?.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-primary-50 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm text-primary-700">{doc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomDocument(index)}
                      className="text-primary-400 hover:text-error-500 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
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
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add custom document input */}
            <div className="flex gap-2">
              <Input
                value={customDocInput}
                onChange={(e) => setCustomDocInput(e.target.value)}
                placeholder="Enter document name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomDocument();
                  }
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddCustomDocument}
                disabled={!customDocInput.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </WizardStepSection>

        {/* Delivery Method */}
        <WizardStepSection
          title="Delivery Method"
          description="How are you providing these documents to the client?"
        >
          <RadioGroup
            name="deliveryMethod"
            value={docs?.deliveryMethod || ''}
            onChange={(value) =>
              updateFirmDocuments({ deliveryMethod: value as DeliveryMethod })
            }
          >
            {DELIVERY_METHODS.map((method) => (
              <RadioOption
                key={method.value}
                value={method.value}
                label={method.label}
                description={method.description}
              />
            ))}
          </RadioGroup>
        </WizardStepSection>

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">
            Document Disclosure Preview
          </h4>
          <p className="text-sm text-primary-600 italic">{getDeliveryText()}</p>
        </div>
      </div>
    </WizardStepContent>
  );
}

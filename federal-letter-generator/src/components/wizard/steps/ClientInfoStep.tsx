import { useWizardStore } from '../../../store/wizardStore';
import { Input, DatePicker, Select } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type { ClientInfo } from '../../../types';

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export function ClientInfoStep() {
  const { data, updateClient } = useWizardStore();
  const client = data.client;

  // Auto-generate salutation when name changes
  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    const updates: Record<string, string> = { [field]: value };

    // Auto-generate salutation if not manually edited
    const firstName = field === 'firstName' ? value : client?.firstName || '';
    if (firstName) {
      updates.salutation = `Dear ${firstName}:`;
    }

    updateClient(updates);
  };

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Letter Date */}
        <WizardStepSection title="Letter Date">
          <div className="max-w-xs">
            <DatePicker
              label="Date"
              value={client?.letterDate || ''}
              onChange={(value) => updateClient({ letterDate: value })}
              required
            />
          </div>
        </WizardStepSection>

        {/* Client Name */}
        <WizardStepSection
          title="Client Name"
          description="Enter the client's full name as it should appear on the letter."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={client?.firstName || ''}
              onChange={(e) => handleNameChange('firstName', e.target.value)}
              placeholder="Pat"
              required
            />
            <Input
              label="Last Name"
              value={client?.lastName || ''}
              onChange={(e) => handleNameChange('lastName', e.target.value)}
              placeholder="Ramirez"
              required
            />
          </div>
        </WizardStepSection>

        {/* Salutation */}
        <WizardStepSection
          title="Salutation"
          description="How the letter will address the client. Auto-generated from first name."
        >
          <div className="max-w-xs">
            <Input
              label="Salutation"
              value={client?.salutation || ''}
              onChange={(e) => updateClient({ salutation: e.target.value })}
              placeholder="Dear Pat:"
              hint="Format: Dear [Name]:"
            />
          </div>
        </WizardStepSection>

        {/* Client Address */}
        <WizardStepSection
          title="Client Address"
          description="The mailing address for the letter header."
        >
          <div className="space-y-4">
            <Input
              label="Address Line 1"
              value={client?.address?.line1 || ''}
              onChange={(e) =>
                updateClient({
                  address: { ...client?.address, line1: e.target.value } as ClientInfo['address'],
                })
              }
              placeholder="1234 J Street, NW"
              required
            />
            <Input
              label="Address Line 2"
              value={client?.address?.line2 || ''}
              onChange={(e) =>
                updateClient({
                  address: { ...client?.address, line2: e.target.value } as ClientInfo['address'],
                })
              }
              placeholder="Suite 100 (optional)"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Input
                  label="City"
                  value={client?.address?.city || ''}
                  onChange={(e) =>
                    updateClient({
                      address: { ...client?.address, city: e.target.value } as ClientInfo['address'],
                    })
                  }
                  placeholder="Washington"
                  required
                />
              </div>
              <Select
                label="State"
                value={client?.address?.state || ''}
                onChange={(e) =>
                  updateClient({
                    address: { ...client?.address, state: e.target.value } as ClientInfo['address'],
                  })
                }
                options={US_STATES}
                placeholder="Select..."
                required
              />
              <Input
                label="ZIP Code"
                value={client?.address?.zipCode || ''}
                onChange={(e) =>
                  updateClient({
                    address: { ...client?.address, zipCode: e.target.value } as ClientInfo['address'],
                  })
                }
                placeholder="20008"
                required
              />
            </div>
          </div>
        </WizardStepSection>

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">Letter Header Preview</h4>
          <div className="text-sm text-primary-600 font-mono">
            <p>{client?.letterDate || '[Date]'}</p>
            <p className="mt-2">
              {client?.firstName || '[First Name]'} {client?.lastName || '[Last Name]'}
            </p>
            <p>{client?.address?.line1 || '[Address Line 1]'}</p>
            {client?.address?.line2 && <p>{client.address.line2}</p>}
            <p>
              {client?.address?.city || '[City]'}, {client?.address?.state || '[ST]'}{' '}
              {client?.address?.zipCode || '[ZIP]'}
            </p>
            <p className="mt-2">{client?.salutation || '[Salutation]'}</p>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}

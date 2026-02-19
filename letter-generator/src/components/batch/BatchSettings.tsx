/**
 * Batch Settings Component
 * Configure settings for batch letter generation
 */

import { Select } from '../common/Select';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Toggle } from '../common/Toggle';
import { TextArea } from '../common/TextArea';
import { Button } from '../common/Button';
import { open } from '@tauri-apps/plugin-dialog';
import type { BatchSettings, LetterType } from '../../types';

interface BatchSettingsProps {
  settings: BatchSettings;
  onChange: (settings: Partial<BatchSettings>) => void;
}

const letterTypeOptions: { value: Exclude<LetterType, 'engagement'>; label: string }[] = [
  { value: '1099', label: '1099 Report Letters' },
  { value: 'beneficiary', label: 'Beneficiary Review Letters' },
  { value: 'rmd', label: 'RMD Strategy Letters' },
  { value: 'tax_strategies', label: 'Tax Strategies Letters' },
];

const outputFormatOptions: { value: 'docx' | 'pdf' | 'both'; label: string }[] = [
  { value: 'docx', label: 'Word Document (.docx)' },
  { value: 'pdf', label: 'PDF Document (.pdf)' },
  { value: 'both', label: 'Both Formats' },
];

const filePatternVariables = [
  { variable: '{clientName}', description: 'Client name' },
  { variable: '{accountOwner}', description: 'Account owner name' },
  { variable: '{date}', description: 'Current date (YYYY-MM-DD)' },
  { variable: '{year}', description: 'Current year' },
  { variable: '{index}', description: 'Item number (001, 002, ...)' },
  { variable: '{accountNumber}', description: 'Account number' },
];

export function BatchSettingsPanel({ settings, onChange }: BatchSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Letter Type */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-primary-800 mb-4">
          Letter Type
        </h3>
        <Select
          label="Select Letter Type"
          options={letterTypeOptions}
          value={settings.letterType}
          onChange={(e) =>
            onChange({ letterType: e.target.value as Exclude<LetterType, 'engagement'> })
          }
        />
        <p className="mt-2 text-sm text-primary-500">
          {getLetterTypeDescription(settings.letterType)}
        </p>
      </Card>

      {/* Output Settings */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-primary-800 mb-4">
          Output Settings
        </h3>

        <div className="space-y-4">
          <Select
            label="Output Format"
            options={outputFormatOptions}
            value={settings.outputFormat}
            onChange={(e) =>
              onChange({ outputFormat: e.target.value as 'docx' | 'pdf' | 'both' })
            }
          />

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Output Directory
            </label>
            <div className="flex gap-2">
              <Input
                value={settings.outputDirectory}
                onChange={(e) => onChange({ outputDirectory: e.target.value })}
                placeholder="Leave blank for default downloads folder"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={async () => {
                  const selected = await open({
                    directory: true,
                    multiple: false,
                    title: 'Select Output Directory',
                  });
                  if (selected) {
                    onChange({ outputDirectory: selected as string });
                  }
                }}
              >
                Browse...
              </Button>
            </div>
            <p className="mt-1 text-sm text-primary-500">
              Where generated letters will be saved
            </p>
          </div>

          <div>
            <Input
              label="File Naming Pattern"
              value={settings.fileNamingPattern}
              onChange={(e) => onChange({ fileNamingPattern: e.target.value })}
              placeholder="{clientName}_{letterType}_{date}"
            />
            <div className="mt-2">
              <p className="text-xs text-primary-500 mb-1">Available variables:</p>
              <div className="flex flex-wrap gap-2">
                {filePatternVariables.map((v) => (
                  <span
                    key={v.variable}
                    className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded cursor-help"
                    title={v.description}
                  >
                    {v.variable}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Firm Information */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-primary-800 mb-4">
          Firm Information
        </h3>

        <div className="space-y-4">
          <Input
            label="Firm Name"
            value={settings.firmName}
            onChange={(e) => onChange({ firmName: e.target.value })}
            placeholder="Your Firm Name"
            required
          />

          <Input
            label="Assistant/Contact Name"
            value={settings.assistantName}
            onChange={(e) => onChange({ assistantName: e.target.value })}
            placeholder="Contact person for questions"
          />

          <Input
            label="Contact Email"
            type="email"
            value={settings.contactEmail}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
            placeholder="contact@firm.com"
          />

          <Input
            label="Tax Year"
            type="number"
            value={settings.taxYear.toString()}
            onChange={(e) => onChange({ taxYear: parseInt(e.target.value) || new Date().getFullYear() })}
            min={2000}
            max={2100}
          />
        </div>
      </Card>

      {/* Disclaimer Settings */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-primary-800 mb-4">
          Disclaimer
        </h3>

        <div className="space-y-4">
          <Toggle
            label="Include Disclaimer"
            checked={settings.includeDisclaimer}
            onChange={(e) => onChange({ includeDisclaimer: e.target.checked })}
            description="Add a standard disclaimer to each letter"
          />

          {settings.includeDisclaimer && (
            <TextArea
              label="Custom Disclaimer Text"
              value={settings.customDisclaimerText || ''}
              onChange={(e) => onChange({ customDisclaimerText: e.target.value })}
              placeholder="Leave blank for default disclaimer"
              rows={4}
              hint="Optional: Enter custom disclaimer text or leave blank for default"
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function getLetterTypeDescription(type: Exclude<LetterType, 'engagement'>): string {
  switch (type) {
    case '1099':
      return 'Generate letters notifying clients about their 1099 tax forms, including account details and expected forms.';
    case 'beneficiary':
      return 'Generate beneficiary review letters summarizing current beneficiary designations for client accounts.';
    case 'rmd':
      return 'Generate RMD strategy letters with required minimum distribution calculations and recommendations.';
    case 'tax_strategies':
      return 'Generate tax strategy letters comparing year-over-year tax situations and recommendations.';
    default:
      return '';
  }
}

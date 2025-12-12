import { useWizardStore } from '../../../store/wizardStore';
import { Toggle, TextArea } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import { DEFAULT_CFP_LANGUAGE } from '../../../types';

export function CFPDisclosureStep() {
  const { data, updateCFPDisclosure } = useWizardStore();
  const disclosure = data.cfpDisclosure;

  const getPreviewText = () => {
    if (!disclosure?.include) {
      return '[CFP fiduciary disclosure will not be included]';
    }

    if (disclosure.useCustomLanguage && disclosure.customLanguage) {
      return disclosure.customLanguage;
    }

    return DEFAULT_CFP_LANGUAGE;
  };

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Include CFP Disclosure Toggle */}
        <WizardStepSection
          title="CFP Fiduciary Disclosure"
          description="Include the CFP Board's fiduciary language in the engagement letter."
        >
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
            <Toggle
              label="Include CFP Fiduciary Disclosure"
              description="Add standard CFP Board fiduciary language to establish the fiduciary relationship"
              checked={disclosure?.include || false}
              onChange={(e) => updateCFPDisclosure({ include: e.target.checked })}
            />
          </div>

          {!disclosure?.include && (
            <p className="mt-3 text-sm text-primary-500">
              This section is optional. If you are not a CFP professional or prefer not to include
              fiduciary language, you can skip this step.
            </p>
          )}
        </WizardStepSection>

        {/* Custom Language Option */}
        {disclosure?.include && (
          <WizardStepSection
            title="Disclosure Language"
            description="Use the standard CFP Board language or customize it."
          >
            <div className="space-y-4">
              <Toggle
                label="Use Custom Language"
                description="Override the standard disclosure with your own text"
                checked={disclosure?.useCustomLanguage || false}
                onChange={(e) =>
                  updateCFPDisclosure({ useCustomLanguage: e.target.checked })
                }
              />

              {disclosure?.useCustomLanguage ? (
                <div className="space-y-2">
                  <TextArea
                    label="Custom Fiduciary Language"
                    value={disclosure?.customLanguage || ''}
                    onChange={(e) =>
                      updateCFPDisclosure({ customLanguage: e.target.value })
                    }
                    rows={6}
                    placeholder="Enter your custom fiduciary disclosure language..."
                    hint="This will replace the standard CFP Board language"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateCFPDisclosure({
                        customLanguage: DEFAULT_CFP_LANGUAGE,
                      })
                    }
                    className="text-sm text-secondary-600 hover:text-secondary-700"
                  >
                    Reset to standard language
                  </button>
                </div>
              ) : (
                <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                  <h4 className="text-sm font-medium text-primary-700 mb-2">
                    Standard CFP Board Language
                  </h4>
                  <p className="text-sm text-primary-600">{DEFAULT_CFP_LANGUAGE}</p>
                </div>
              )}
            </div>
          </WizardStepSection>
        )}

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">
            Letter Preview
          </h4>
          <p className="text-sm text-primary-600 italic">{getPreviewText()}</p>
        </div>

        {/* Info Box */}
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5"
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
              <h4 className="text-sm font-medium text-accent-800">
                About CFP Fiduciary Duty
              </h4>
              <p className="text-sm text-accent-700 mt-1">
                CFP professionals who provide financial advice must comply with CFP Board's
                fiduciary duty standard. This language helps establish the fiduciary relationship
                and sets clear expectations with your client.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}

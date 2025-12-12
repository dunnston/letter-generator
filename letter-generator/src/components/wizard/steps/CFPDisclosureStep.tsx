import { useWizardStore } from '../../../store/wizardStore';
import { Toggle, TextArea } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import { DEFAULT_CFP_LANGUAGE, DEFAULT_CHFC_LANGUAGE, DEFAULT_RIA_LANGUAGE } from '../../../types';

export function CFPDisclosureStep() {
  const { data, updateCFPDisclosure, updateChFCDisclosure, updateRIADisclosure } = useWizardStore();
  const cfpDisclosure = data.cfpDisclosure;
  const chfcDisclosure = data.chfcDisclosure;
  const riaDisclosure = data.riaDisclosure;

  const getCFPPreviewText = () => {
    if (!cfpDisclosure?.include) {
      return null;
    }

    if (cfpDisclosure.useCustomLanguage && cfpDisclosure.customLanguage) {
      return cfpDisclosure.customLanguage;
    }

    return DEFAULT_CFP_LANGUAGE;
  };

  const getChFCPreviewText = () => {
    if (!chfcDisclosure?.include) {
      return null;
    }

    if (chfcDisclosure.useCustomLanguage && chfcDisclosure.customLanguage) {
      return chfcDisclosure.customLanguage;
    }

    return DEFAULT_CHFC_LANGUAGE;
  };

  const getRIAPreviewText = () => {
    if (!riaDisclosure?.include) {
      return null;
    }

    if (riaDisclosure.useCustomLanguage && riaDisclosure.customLanguage) {
      return riaDisclosure.customLanguage;
    }

    return DEFAULT_RIA_LANGUAGE;
  };

  const getPreviewText = () => {
    const cfpText = getCFPPreviewText();
    const chfcText = getChFCPreviewText();
    const riaText = getRIAPreviewText();

    if (!cfpText && !chfcText && !riaText) {
      return '[No fiduciary or professional designation disclosures will be included]';
    }

    const parts = [];
    if (riaText) parts.push(riaText);
    if (cfpText) parts.push(cfpText);
    if (chfcText) parts.push(chfcText);
    return parts.join('\n\n');
  };

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Include RIA Fiduciary Disclosure Toggle */}
        <WizardStepSection
          title="RIA Fiduciary Disclosure"
          description="Include Registered Investment Advisor fiduciary language in the engagement letter."
        >
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
            <Toggle
              label="Include RIA Fiduciary Disclosure"
              description="Add fiduciary standard language establishing the highest duty of care"
              checked={riaDisclosure?.include || false}
              onChange={(e) => updateRIADisclosure({ include: e.target.checked })}
            />
          </div>

          {/* Custom Language Option for RIA */}
          {riaDisclosure?.include && (
            <div className="mt-4 space-y-4">
              <Toggle
                label="Use Custom Language"
                description="Override the standard disclosure with your own text"
                checked={riaDisclosure?.useCustomLanguage || false}
                onChange={(e) =>
                  updateRIADisclosure({ useCustomLanguage: e.target.checked })
                }
              />

              {riaDisclosure?.useCustomLanguage ? (
                <div className="space-y-2">
                  <TextArea
                    label="Custom RIA Fiduciary Language"
                    value={riaDisclosure?.customLanguage || ''}
                    onChange={(e) =>
                      updateRIADisclosure({ customLanguage: e.target.value })
                    }
                    rows={6}
                    placeholder="Enter your custom RIA fiduciary disclosure language..."
                    hint="This will replace the standard RIA fiduciary language"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateRIADisclosure({
                        customLanguage: DEFAULT_RIA_LANGUAGE,
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
                    Standard RIA Fiduciary Language
                  </h4>
                  <p className="text-sm text-primary-600">{DEFAULT_RIA_LANGUAGE}</p>
                </div>
              )}
            </div>
          )}
        </WizardStepSection>

        {/* Include CFP Disclosure Toggle */}
        <WizardStepSection
          title="CFP® Fiduciary Disclosure"
          description="Include the CFP Board's fiduciary language in the engagement letter."
        >
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
            <Toggle
              label="Include CFP® Fiduciary Disclosure"
              description="Add standard CFP Board fiduciary language to establish the fiduciary relationship"
              checked={cfpDisclosure?.include || false}
              onChange={(e) => updateCFPDisclosure({ include: e.target.checked })}
            />
          </div>

          {/* Custom Language Option for CFP */}
          {cfpDisclosure?.include && (
            <div className="mt-4 space-y-4">
              <Toggle
                label="Use Custom Language"
                description="Override the standard disclosure with your own text"
                checked={cfpDisclosure?.useCustomLanguage || false}
                onChange={(e) =>
                  updateCFPDisclosure({ useCustomLanguage: e.target.checked })
                }
              />

              {cfpDisclosure?.useCustomLanguage ? (
                <div className="space-y-2">
                  <TextArea
                    label="Custom CFP® Fiduciary Language"
                    value={cfpDisclosure?.customLanguage || ''}
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
          )}
        </WizardStepSection>

        {/* Include ChFC Disclosure Toggle */}
        <WizardStepSection
          title="ChFC® Professional Disclosure"
          description="Include the Chartered Financial Consultant designation language in the engagement letter."
        >
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
            <Toggle
              label="Include ChFC® Professional Disclosure"
              description="Add standard ChFC professional language from The American College of Financial Services"
              checked={chfcDisclosure?.include || false}
              onChange={(e) => updateChFCDisclosure({ include: e.target.checked })}
            />
          </div>

          {/* Custom Language Option for ChFC */}
          {chfcDisclosure?.include && (
            <div className="mt-4 space-y-4">
              <Toggle
                label="Use Custom Language"
                description="Override the standard disclosure with your own text"
                checked={chfcDisclosure?.useCustomLanguage || false}
                onChange={(e) =>
                  updateChFCDisclosure({ useCustomLanguage: e.target.checked })
                }
              />

              {chfcDisclosure?.useCustomLanguage ? (
                <div className="space-y-2">
                  <TextArea
                    label="Custom ChFC® Language"
                    value={chfcDisclosure?.customLanguage || ''}
                    onChange={(e) =>
                      updateChFCDisclosure({ customLanguage: e.target.value })
                    }
                    rows={6}
                    placeholder="Enter your custom ChFC disclosure language..."
                    hint="This will replace the standard ChFC language"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateChFCDisclosure({
                        customLanguage: DEFAULT_CHFC_LANGUAGE,
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
                    Standard ChFC Language
                  </h4>
                  <p className="text-sm text-primary-600">{DEFAULT_CHFC_LANGUAGE}</p>
                </div>
              )}
            </div>
          )}
        </WizardStepSection>

        {/* Note about optional step */}
        {!cfpDisclosure?.include && !chfcDisclosure?.include && !riaDisclosure?.include && (
          <p className="text-sm text-primary-500">
            This section is optional. If you do not need to include RIA fiduciary language or do not hold CFP® or ChFC® designations,
            you can skip this step.
          </p>
        )}

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">
            Letter Preview
          </h4>
          <p className="text-sm text-primary-600 italic whitespace-pre-line">{getPreviewText()}</p>
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
                About Fiduciary Standards & Professional Designations
              </h4>
              <p className="text-sm text-accent-700 mt-1">
                <strong>RIA (Registered Investment Advisor)</strong> fiduciary duty is the highest standard of care in financial services,
                requiring advisors to always act in the client's best interest. <strong>CFP®</strong> professionals must comply with CFP Board's
                fiduciary duty standard. <strong>ChFC®</strong> designees follow The American College's Code of Ethics.
                Including these disclosures helps establish professional standards and sets clear expectations with your client.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}

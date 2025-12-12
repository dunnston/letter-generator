import { useState, useMemo, useCallback } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { Button } from '../../common';
import { WizardStepContent } from '../WizardContainer';
import { LetterPreview, SectionNav } from '../../common/LetterPreview';
import { generateEngagementLetterDocx, generateFilename } from '../../../services/documentGenerator';
import { generateEngagementLetterPdf } from '../../../services/pdfGenerator';
import { downloadBlob } from '../../../services/fileService';
import type { EngagementLetterData, WizardStep } from '../../../types';

type ExportFormat = 'docx' | 'pdf';

interface GenerationState {
  isGenerating: boolean;
  format: ExportFormat | null;
  error: string | null;
  success: boolean;
}

export function ReviewGenerateStep() {
  const { data, setStep, markComplete } = useWizardStore();
  const [activeSection, setActiveSection] = useState<string | undefined>();
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    format: null,
    error: null,
    success: false,
  });

  // Build complete engagement letter data
  const letterData = useMemo((): EngagementLetterData | null => {
    if (
      !data.client ||
      !data.initialContact ||
      !data.firmDocuments ||
      !data.cfpDisclosure ||
      !data.services ||
      !data.planningProcess ||
      !data.fees ||
      !data.compensation ||
      !data.additional ||
      !data.advisor
    ) {
      return null;
    }

    return {
      client: data.client,
      initialContact: data.initialContact,
      firmDocuments: data.firmDocuments,
      cfpDisclosure: data.cfpDisclosure,
      services: data.services,
      goals: data.goals || [],
      planningProcess: data.planningProcess,
      accounts: data.accounts || [],
      fees: data.fees,
      compensation: data.compensation,
      conflicts: data.conflicts || [],
      additional: data.additional,
      advisor: data.advisor,
    };
  }, [data]);

  // Map section IDs to wizard steps
  const sectionToStep: Record<string, WizardStep> = {
    header: 1,
    opening: 2,
    documents: 3,
    cfp: 4,
    services: 5,
    goals: 6,
    planning_process: 7,
    accounts: 8,
    fees: 9,
    compensation: 10,
    conflicts: 11,
    responsibilities: 12,
    timing: 12,
    privacy: 12,
    disciplinary: 12,
    signature: 12,
  };

  const handleEditSection = useCallback(
    (sectionId: string) => {
      const step = sectionToStep[sectionId];
      if (step) {
        setStep(step);
      }
    },
    [setStep]
  );

  const handleSectionClick = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    // Scroll to section in preview
    const element = document.getElementById(`preview-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleGenerate = useCallback(
    async (format: ExportFormat) => {
      if (!letterData) return;

      setGenerationState({
        isGenerating: true,
        format,
        error: null,
        success: false,
      });

      try {
        let blob: Blob;
        let filename: string;

        if (format === 'docx') {
          blob = await generateEngagementLetterDocx(letterData);
          filename = generateFilename(letterData, 'docx');
        } else {
          blob = await generateEngagementLetterPdf(letterData);
          filename = generateFilename(letterData, 'pdf');
        }

        // Download the file
        downloadBlob(blob, filename);

        // Mark as complete
        markComplete();

        setGenerationState({
          isGenerating: false,
          format,
          error: null,
          success: true,
        });

        // Clear success message after 5 seconds
        setTimeout(() => {
          setGenerationState((prev) => ({ ...prev, success: false }));
        }, 5000);
      } catch (error) {
        setGenerationState({
          isGenerating: false,
          format,
          error: error instanceof Error ? error.message : 'An error occurred generating the document',
          success: false,
        });
      }
    },
    [letterData, markComplete]
  );

  // Validation check
  const validationIssues = useMemo(() => {
    const issues: string[] = [];

    if (!data.client?.firstName || !data.client?.lastName) {
      issues.push('Client name is required');
    }
    if (!data.client?.address?.line1 || !data.client?.address?.city) {
      issues.push('Client address is incomplete');
    }
    if (!data.advisor?.name) {
      issues.push('Advisor name is required');
    }
    if (!data.advisor?.email) {
      issues.push('Advisor email is required');
    }
    if (
      !data.services?.financialPlanning &&
      !data.services?.investmentAdvisory &&
      !data.services?.brokerageServices &&
      !data.services?.riskManagement
    ) {
      issues.push('At least one service must be selected');
    }
    if (!data.goals || data.goals.length === 0) {
      issues.push('At least one client goal should be specified');
    }

    return issues;
  }, [data]);

  const canGenerate = letterData !== null && validationIssues.length === 0;

  if (!letterData) {
    return (
      <WizardStepContent>
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-warning-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-primary-800">Incomplete Data</h3>
          <p className="mt-2 text-primary-600">
            Please complete all required steps before generating the letter.
          </p>
          <Button className="mt-4" onClick={() => setStep(1)}>
            Go to Step 1
          </Button>
        </div>
      </WizardStepContent>
    );
  }

  return (
    <WizardStepContent className="!p-0 !bg-transparent !shadow-none !border-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-300px)] min-h-[600px]">
        {/* Left sidebar - Section navigation */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-primary-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-primary-800 mb-3">Sections</h3>
          <SectionNav
            data={letterData}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
          />

          {/* Validation issues */}
          {validationIssues.length > 0 && (
            <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <h4 className="text-sm font-medium text-warning-800">Issues to resolve:</h4>
              <ul className="mt-2 text-xs text-warning-700 space-y-1">
                {validationIssues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Center - Letter preview */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-primary-100 rounded-xl p-4 flex-1 overflow-hidden">
            <LetterPreview
              data={letterData}
              onEditSection={handleEditSection}
              className="h-full"
            />
          </div>
        </div>

        {/* Right sidebar - Actions */}
        <div className="lg:col-span-3 space-y-4">
          {/* Export options */}
          <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-4">
            <h3 className="text-sm font-semibold text-primary-800 mb-4">Export Options</h3>

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => handleGenerate('docx')}
                disabled={!canGenerate || generationState.isGenerating}
                isLoading={generationState.isGenerating && generationState.format === 'docx'}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
              >
                Download Word (.docx)
              </Button>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleGenerate('pdf')}
                disabled={!canGenerate || generationState.isGenerating}
                isLoading={generationState.isGenerating && generationState.format === 'pdf'}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                }
              >
                Download PDF
              </Button>
            </div>

            {/* Status messages */}
            {generationState.success && (
              <div className="mt-4 p-3 bg-accent-50 border border-accent-200 rounded-lg">
                <div className="flex items-center gap-2 text-accent-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Document generated successfully!</span>
                </div>
              </div>
            )}

            {generationState.error && (
              <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
                <div className="flex items-start gap-2 text-error-700">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">{generationState.error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick info */}
          <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-4">
            <h3 className="text-sm font-semibold text-primary-800 mb-3">Letter Summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-primary-500">Client:</dt>
                <dd className="font-medium text-primary-800">
                  {letterData.client.firstName} {letterData.client.lastName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-primary-500">Date:</dt>
                <dd className="font-medium text-primary-800">{letterData.client.letterDate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-primary-500">Services:</dt>
                <dd className="font-medium text-primary-800">
                  {[
                    letterData.services.financialPlanning && 'FP',
                    letterData.services.investmentAdvisory && 'IA',
                    letterData.services.brokerageServices && 'BD',
                    letterData.services.riskManagement && 'RM',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-primary-500">Goals:</dt>
                <dd className="font-medium text-primary-800">{letterData.goals.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-primary-500">Accounts:</dt>
                <dd className="font-medium text-primary-800">{letterData.accounts.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-primary-500">Conflicts:</dt>
                <dd className="font-medium text-primary-800">{letterData.conflicts.length}</dd>
              </div>
            </dl>
          </div>

          {/* Tips */}
          <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4">
            <h4 className="text-sm font-medium text-secondary-800 mb-2">Tips</h4>
            <ul className="text-xs text-secondary-700 space-y-1">
              <li>• Hover over sections in the preview to edit</li>
              <li>• Click sections in the sidebar to navigate</li>
              <li>• Review all sections before generating</li>
              <li>• Both formats contain the same content</li>
            </ul>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}

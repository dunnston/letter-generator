/**
 * Batch Processing Wizard
 * Main component that guides users through the batch letter generation process
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { FileUploader } from './FileUploader';
import { ColumnMapper } from './ColumnMapper';
import { BatchSettingsPanel } from './BatchSettings';
import { BatchProgress } from './BatchProgress';
import { useBatchStore } from '../../store/batchStore';
import {
  readSheetData,
  applyMappings,
  validateMappings,
} from '../../services/excelParser';
import type { ColumnMappingConfig, ExcelFile } from '../../types';

type WizardStep = 'upload' | 'settings' | 'mapping' | 'review' | 'processing';

export function BatchWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [mappingValidation, setMappingValidation] = useState<{
    valid: boolean;
    missingFields: string[];
  }>({ valid: false, missingFields: [] });

  const {
    excelFile,
    rawData,
    mappingConfig,
    currentJob,
    settings,
    setExcelFile,
    selectSheet,
    setMappingConfig,
    updateSettings,
    createJob,
    validateJob,
    startJob,
    pauseJob,
    resumeJob,
    cancelJob,
    completeJob,
    updateItemInJob,
    clearCurrentJob,
    clearImport,
  } = useBatchStore();

  // Get selected sheet
  const selectedSheet = excelFile?.sheets.find(
    (s) => s.name === excelFile.selectedSheet
  );

  // Handle file loaded
  const handleFileLoaded = useCallback(
    (file: ExcelFile | null, data: ArrayBuffer | null) => {
      if (file && data) {
        setExcelFile(file, data);
      } else {
        clearImport();
      }
    },
    [setExcelFile, clearImport]
  );

  // Handle mapping changes
  const handleMappingsChange = useCallback(
    (config: ColumnMappingConfig) => {
      setMappingConfig(config);
      const validation = validateMappings(config, settings.letterType);
      setMappingValidation(validation);
    },
    [setMappingConfig, settings.letterType]
  );

  // Can proceed to next step?
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'upload':
        return !!excelFile && !!selectedSheet;
      case 'settings':
        return !!settings.firmName;
      case 'mapping':
        return mappingValidation.valid;
      case 'review':
        return currentJob && currentJob.items.some((i) => i.status === 'pending');
      default:
        return false;
    }
  }, [currentStep, excelFile, selectedSheet, settings, mappingValidation, currentJob]);

  // Handle next step
  const handleNext = useCallback(() => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('settings');
        break;
      case 'settings':
        setCurrentStep('mapping');
        break;
      case 'mapping':
        // Create batch items from Excel data
        if (rawData && excelFile && mappingConfig) {
          try {
            const data = readSheetData(
              rawData,
              excelFile.selectedSheet,
              mappingConfig.hasHeaderRow,
              mappingConfig.startRow
            );
            const items = applyMappings(data, mappingConfig);
            createJob(items);
            validateJob();
            setCurrentStep('review');
          } catch (error) {
            console.error('Failed to create batch job:', error);
          }
        }
        break;
      case 'review':
        startJob();
        setCurrentStep('processing');
        // Start processing (simulated for now)
        processNextItem();
        break;
    }
  }, [currentStep, rawData, excelFile, mappingConfig, createJob, validateJob, startJob]);

  // Handle back
  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'settings':
        setCurrentStep('upload');
        break;
      case 'mapping':
        setCurrentStep('settings');
        break;
      case 'review':
        setCurrentStep('mapping');
        clearCurrentJob();
        break;
    }
  }, [currentStep, clearCurrentJob]);

  // Process items (placeholder - will be replaced with actual document generation)
  const processNextItem = useCallback(() => {
    if (!currentJob || currentJob.status !== 'running') return;

    const pendingItem = currentJob.items.find((i) => i.status === 'pending');
    if (!pendingItem) {
      completeJob();
      return;
    }

    // Mark as processing
    updateItemInJob(pendingItem.id, 'processing');

    // Simulate processing delay
    setTimeout(() => {
      // Simulate success/failure (90% success rate for demo)
      const success = Math.random() > 0.1;

      if (success) {
        updateItemInJob(
          pendingItem.id,
          'success',
          undefined,
          `/output/${pendingItem.id}.docx`
        );
      } else {
        updateItemInJob(
          pendingItem.id,
          'error',
          'Simulated error for demonstration'
        );
      }

      // Process next item
      processNextItem();
    }, 200);
  }, [currentJob, updateItemInJob, completeJob]);

  // Resume processing when job state changes to running
  useEffect(() => {
    if (currentJob?.status === 'running') {
      const processing = currentJob.items.some((i) => i.status === 'processing');
      if (!processing) {
        processNextItem();
      }
    }
  }, [currentJob?.status, processNextItem]);

  // Reset wizard
  const handleReset = () => {
    clearImport();
    clearCurrentJob();
    setCurrentStep('upload');
    setMappingValidation({ valid: false, missingFields: [] });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-800">
          Batch Letter Generator
        </h1>
        <p className="text-primary-600 mt-1">
          Generate multiple client letters from an Excel spreadsheet
        </p>
      </div>

      {/* Progress indicator */}
      <StepProgress currentStep={currentStep} />

      {/* Step content */}
      <div className="mt-8">
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-primary-800 mb-4">
                Step 1: Upload Your Data
              </h2>
              <FileUploader
                onFileLoaded={handleFileLoaded}
                onSheetSelect={selectSheet}
                currentFile={excelFile}
              />
            </Card>
          </div>
        )}

        {currentStep === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-primary-800">
              Step 2: Configure Settings
            </h2>
            <BatchSettingsPanel
              settings={settings}
              onChange={updateSettings}
            />
          </div>
        )}

        {currentStep === 'mapping' && selectedSheet && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-primary-800 mb-4">
                Step 3: Map Columns
              </h2>
              <ColumnMapper
                columns={selectedSheet.columns}
                letterType={settings.letterType}
                initialMappings={mappingConfig?.mappings}
                onMappingsChange={handleMappingsChange}
                hasHeaderRow={mappingConfig?.hasHeaderRow}
                startRow={mappingConfig?.startRow}
              />
            </Card>
          </div>
        )}

        {currentStep === 'review' && currentJob && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-primary-800 mb-4">
                Step 4: Review & Generate
              </h2>

              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-primary-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary-800">
                      {currentJob.totalItems}
                    </div>
                    <div className="text-sm text-primary-500">Total Items</div>
                  </div>
                  <div className="bg-accent-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-accent-600">
                      {currentJob.items.filter((i) => i.status === 'pending').length}
                    </div>
                    <div className="text-sm text-primary-500">Ready</div>
                  </div>
                  <div className="bg-error-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-error-600">
                      {currentJob.errorCount}
                    </div>
                    <div className="text-sm text-primary-500">Errors</div>
                  </div>
                  <div className="bg-warning-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-warning-600">
                      {currentJob.skippedCount}
                    </div>
                    <div className="text-sm text-primary-500">Skipped</div>
                  </div>
                </div>

                {/* Settings summary */}
                <div className="bg-primary-50 rounded-lg p-4">
                  <h4 className="font-medium text-primary-800 mb-2">Settings</h4>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="text-primary-500">Letter Type:</dt>
                    <dd className="text-primary-800">{settings.letterType}</dd>
                    <dt className="text-primary-500">Output Format:</dt>
                    <dd className="text-primary-800">{settings.outputFormat}</dd>
                    <dt className="text-primary-500">Firm Name:</dt>
                    <dd className="text-primary-800">{settings.firmName}</dd>
                    <dt className="text-primary-500">Tax Year:</dt>
                    <dd className="text-primary-800">{settings.taxYear}</dd>
                  </dl>
                </div>

                {/* Errors preview */}
                {currentJob.errorCount > 0 && (
                  <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                    <h4 className="font-medium text-error-800 mb-2">
                      Items with Errors ({currentJob.errorCount})
                    </h4>
                    <p className="text-sm text-error-700 mb-2">
                      These items will be skipped during processing:
                    </p>
                    <ul className="text-sm text-error-600 list-disc list-inside">
                      {currentJob.items
                        .filter((i) => i.status === 'error')
                        .slice(0, 5)
                        .map((item) => (
                          <li key={item.id}>
                            Row {item.rowNumber}: {item.errorMessage}
                          </li>
                        ))}
                      {currentJob.errorCount > 5 && (
                        <li>...and {currentJob.errorCount - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {currentStep === 'processing' && currentJob && (
          <BatchProgress
            job={currentJob}
            onPause={pauseJob}
            onResume={resumeJob}
            onCancel={cancelJob}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <div>
          {currentStep !== 'upload' && currentStep !== 'processing' && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {(currentStep === 'processing' && currentJob?.status === 'completed') && (
            <Button variant="outline" onClick={handleReset}>
              Start New Batch
            </Button>
          )}
        </div>

        <div>
          {currentStep !== 'processing' && (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentStep === 'review' ? 'Generate Letters' : 'Continue'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step progress indicator
function StepProgress({ currentStep }: { currentStep: WizardStep }) {
  const steps: { key: WizardStep; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'settings', label: 'Settings' },
    { key: 'mapping', label: 'Mapping' },
    { key: 'review', label: 'Review' },
    { key: 'processing', label: 'Generate' },
  ];

  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1">
            {/* Step circle */}
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full
                text-sm font-medium transition-colors
                ${isComplete
                  ? 'bg-accent-500 text-white'
                  : isActive
                  ? 'bg-secondary-500 text-white'
                  : 'bg-primary-200 text-primary-500'
                }
              `}
            >
              {isComplete ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>

            {/* Step label */}
            <span
              className={`
                ml-2 text-sm font-medium
                ${isActive ? 'text-primary-800' : 'text-primary-500'}
              `}
            >
              {step.label}
            </span>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-4
                  ${isComplete ? 'bg-accent-500' : 'bg-primary-200'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

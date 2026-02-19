/**
 * Batch Processing Wizard
 * Main component that guides users through the batch letter generation process
 */

import { useState, useCallback, useEffect, useRef } from 'react';
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
import { transformTo1099Data, transformToBeneficiaryData, transformToRMDData, transformToTaxStrategyData } from '../../services/batchProcessor';
import { generate1099LetterDocx, generate1099Filename } from '../../services/report1099Generator';
import { generate1099LetterPdf } from '../../services/pdf1099Generator';
import { generateBeneficiaryLetterDocx, generateBeneficiaryFilename } from '../../services/beneficiaryGenerator';
import { generateBeneficiaryLetterPdf } from '../../services/pdfBeneficiaryGenerator';
import { generateRMDLetterDocx, generateRMDFilename } from '../../services/rmdGenerator';
import { generateRMDLetterPdf } from '../../services/pdfRmdGenerator';
import { generateTaxStrategyLetterDocx, generateTaxStrategyFilename } from '../../services/taxStrategyGenerator';
import { generateTaxStrategyLetterPdf } from '../../services/pdfTaxStrategyGenerator';
import { saveBlobToDirectory } from '../../services/fileService';
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
            // createJob now includes validation in a single atomic update
            createJob(items);
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
  }, [currentStep, rawData, excelFile, mappingConfig, createJob, startJob]);

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

  // Track which clients have already been processed (for grouping)
  const processedClientsRef = useRef<Set<string>>(new Set());

  // Reset processed clients when job changes
  useEffect(() => {
    if (currentJob?.status === 'idle') {
      processedClientsRef.current = new Set();
    }
  }, [currentJob?.status]);

  // Process items with real document generation
  const processNextItem = useCallback(async () => {
    if (!currentJob || currentJob.status !== 'running') return;

    // Find pending items
    const pendingItems = currentJob.items.filter((i) => i.status === 'pending');
    if (pendingItems.length === 0) {
      completeJob();
      return;
    }

    // Get grouping key based on letter type
    // 1099 and tax_strategies letters group by clientName, beneficiary and RMD letters group by accountOwner
    const firstPending = pendingItems[0];
    const groupKey = (settings.letterType === 'beneficiary' || settings.letterType === 'rmd')
      ? String(firstPending.data.accountOwner || '')
      : String(firstPending.data.clientName || '');

    // Skip if this group was already processed
    if (processedClientsRef.current.has(groupKey)) {
      // Mark this item as skipped (already included in another letter)
      updateItemInJob(firstPending.id, 'success', undefined, 'Included in client letter');
      // Continue to next item
      setTimeout(() => processNextItem(), 10);
      return;
    }

    // Find all items for this group
    const groupField = (settings.letterType === 'beneficiary' || settings.letterType === 'rmd') ? 'accountOwner' : 'clientName';
    const groupItems = currentJob.items.filter(
      (i) => String(i.data[groupField] || '') === groupKey && i.status === 'pending'
    );

    // Mark all items for this group as processing
    groupItems.forEach((item) => {
      updateItemInJob(item.id, 'processing');
    });

    try {
      if (settings.letterType === '1099') {
        // Transform items to 1099 data
        const clientDataMap = transformTo1099Data(groupItems, settings);
        const clientData = clientDataMap.get(groupKey);

        if (!clientData) {
          throw new Error('Failed to transform data for client');
        }

        // Generate documents based on output format
        if (settings.outputFormat === 'docx' || settings.outputFormat === 'both') {
          const docxBlob = await generate1099LetterDocx(clientData, settings);
          const filename = generate1099Filename(groupKey, settings.taxYear, 'docx');
          await saveBlobToDirectory(docxBlob, filename, settings.outputDirectory);
        }

        if (settings.outputFormat === 'pdf' || settings.outputFormat === 'both') {
          const pdfBlob = await generate1099LetterPdf(clientData, settings);
          const filename = generate1099Filename(groupKey, settings.taxYear, 'pdf');
          await saveBlobToDirectory(pdfBlob, filename, settings.outputDirectory);
        }

        // Mark all items for this client as success
        const outputFilename = generate1099Filename(groupKey, settings.taxYear,
          settings.outputFormat === 'both' ? 'docx' : settings.outputFormat);
        groupItems.forEach((item) => {
          updateItemInJob(item.id, 'success', undefined, outputFilename);
        });

        // Mark this group as processed
        processedClientsRef.current.add(groupKey);

      } else if (settings.letterType === 'beneficiary') {
        // Transform items to beneficiary data
        const ownerDataMap = transformToBeneficiaryData(groupItems, settings);
        const accounts = ownerDataMap.get(groupKey);

        if (!accounts || accounts.length === 0) {
          throw new Error('Failed to transform data for account owner');
        }

        // Create letter data structure
        const letterData = {
          accountOwner: groupKey,
          accounts: accounts,
          firmName: settings.firmName,
          assistantName: settings.assistantName,
          contactEmail: settings.contactEmail,
        };

        // Generate documents based on output format
        if (settings.outputFormat === 'docx' || settings.outputFormat === 'both') {
          const docxBlob = await generateBeneficiaryLetterDocx(letterData, settings);
          const filename = generateBeneficiaryFilename(groupKey, 'docx');
          await saveBlobToDirectory(docxBlob, filename, settings.outputDirectory);
        }

        if (settings.outputFormat === 'pdf' || settings.outputFormat === 'both') {
          const pdfBlob = await generateBeneficiaryLetterPdf(letterData, settings);
          const filename = generateBeneficiaryFilename(groupKey, 'pdf');
          await saveBlobToDirectory(pdfBlob, filename, settings.outputDirectory);
        }

        // Mark all items for this account owner as success
        const outputFilename = generateBeneficiaryFilename(groupKey,
          settings.outputFormat === 'both' ? 'docx' : settings.outputFormat);
        groupItems.forEach((item) => {
          updateItemInJob(item.id, 'success', undefined, outputFilename);
        });

        // Mark this group as processed
        processedClientsRef.current.add(groupKey);

      } else if (settings.letterType === 'rmd') {
        // Transform items to RMD data
        const ownerDataMap = transformToRMDData(groupItems, settings);
        const rmdData = ownerDataMap.get(groupKey);

        if (!rmdData) {
          throw new Error('Failed to transform data for account owner');
        }

        // Create letter data structure
        const letterData = {
          accountOwner: groupKey,
          taxYear: rmdData.taxYear,
          accounts: rmdData.accounts,
          totalRMDDue: rmdData.totalRMDDue,
          totalWithdrawals: rmdData.totalWithdrawals,
          remainingRMD: rmdData.remainingRMD,
          recommendations: rmdData.recommendations,
          firmName: settings.firmName,
          assistantName: rmdData.assistantName || settings.assistantName,
          contactEmail: settings.contactEmail,
        };

        // Generate documents based on output format
        if (settings.outputFormat === 'docx' || settings.outputFormat === 'both') {
          const docxBlob = await generateRMDLetterDocx(letterData, settings);
          const filename = generateRMDFilename(groupKey, settings.taxYear, 'docx');
          await saveBlobToDirectory(docxBlob, filename, settings.outputDirectory);
        }

        if (settings.outputFormat === 'pdf' || settings.outputFormat === 'both') {
          const pdfBlob = await generateRMDLetterPdf(letterData, settings);
          const filename = generateRMDFilename(groupKey, settings.taxYear, 'pdf');
          await saveBlobToDirectory(pdfBlob, filename, settings.outputDirectory);
        }

        // Mark all items for this account owner as success
        const outputFilename = generateRMDFilename(groupKey, settings.taxYear,
          settings.outputFormat === 'both' ? 'docx' : settings.outputFormat);
        groupItems.forEach((item) => {
          updateItemInJob(item.id, 'success', undefined, outputFilename);
        });

        // Mark this group as processed
        processedClientsRef.current.add(groupKey);

      } else if (settings.letterType === 'tax_strategies') {
        // Transform items to tax strategy data
        const clientDataMap = transformToTaxStrategyData(groupItems, settings);
        const taxData = clientDataMap.get(groupKey);

        if (!taxData) {
          throw new Error('Failed to transform data for client');
        }

        // Create letter data structure
        const letterData = {
          ...taxData,
          firmName: settings.firmName,
          advisorName: settings.assistantName,
          contactEmail: settings.contactEmail,
        };

        // Generate documents based on output format
        if (settings.outputFormat === 'docx' || settings.outputFormat === 'both') {
          const docxBlob = await generateTaxStrategyLetterDocx(letterData, settings);
          const filename = generateTaxStrategyFilename(groupKey, settings.taxYear, 'docx');
          await saveBlobToDirectory(docxBlob, filename, settings.outputDirectory);
        }

        if (settings.outputFormat === 'pdf' || settings.outputFormat === 'both') {
          const pdfBlob = await generateTaxStrategyLetterPdf(letterData, settings);
          const filename = generateTaxStrategyFilename(groupKey, settings.taxYear, 'pdf');
          await saveBlobToDirectory(pdfBlob, filename, settings.outputDirectory);
        }

        // Mark all items for this client as success
        const outputFilename = generateTaxStrategyFilename(groupKey, settings.taxYear,
          settings.outputFormat === 'both' ? 'docx' : settings.outputFormat);
        groupItems.forEach((item) => {
          updateItemInJob(item.id, 'success', undefined, outputFilename);
        });

        // Mark this group as processed
        processedClientsRef.current.add(groupKey);

      } else {
        // Other letter types not yet implemented
        groupItems.forEach((item) => {
          updateItemInJob(item.id, 'error', `Letter type '${settings.letterType}' not yet implemented`);
        });
      }
    } catch (error) {
      // Mark all items for this group as error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error generating document';
      groupItems.forEach((item) => {
        updateItemInJob(item.id, 'error', errorMessage);
      });
    }

    // Small delay before processing next group
    setTimeout(() => processNextItem(), 100);
  }, [currentJob, settings, updateItemInJob, completeJob]);

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
    processedClientsRef.current = new Set(); // Clear processed clients tracking
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
                key={`${excelFile?.fileName}-${selectedSheet.name}-${settings.letterType}`}
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

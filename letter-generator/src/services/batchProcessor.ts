/**
 * Batch Processor Service
 * Manages batch letter generation jobs
 */

import type {
  BatchJob,
  BatchItem,
  BatchResult,
  BatchError,
  BatchSettings,
  ColumnMappingConfig,
  LetterType,
  Report1099Data,
  BeneficiaryReviewData,
  RMDStrategyData,
  TaxStrategyData,
  TaxReportAccount,
  Beneficiary,
  RMDAccount,
  RMDRecommendation,
} from '../types';
import { validateBatchItem, groupItemsByField } from './excelParser';

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new batch job
 */
export function createBatchJob(
  letterType: Exclude<LetterType, 'engagement'>,
  fileName: string,
  items: BatchItem[],
  settings: BatchSettings,
  mappingConfig: ColumnMappingConfig
): BatchJob {
  return {
    id: generateId(),
    letterType,
    fileName,
    totalItems: items.length,
    processedItems: 0,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    status: 'idle',
    items,
    settings,
    mappingConfig,
  };
}

/**
 * Validate all items in a batch job
 */
export function validateBatchJob(job: BatchJob): BatchJob {
  const validatedItems = job.items.map((item) => {
    if (item.status === 'error') {
      return item; // Already has an error
    }

    const validation = validateBatchItem(item, job.letterType);

    if (!validation.valid) {
      return {
        ...item,
        status: 'error' as const,
        errorMessage: validation.errors.join('; '),
      };
    }

    return item;
  });

  const errorCount = validatedItems.filter((i) => i.status === 'error').length;

  return {
    ...job,
    items: validatedItems,
    errorCount,
  };
}

/**
 * Transform batch items into letter-specific data structures
 */
export function transformTo1099Data(
  items: BatchItem[],
  settings: BatchSettings
): Map<string, Report1099Data> {
  // Group by client name to consolidate accounts
  const grouped = groupItemsByField(items, 'clientName');
  const result = new Map<string, Report1099Data>();

  for (const [clientName, clientItems] of grouped) {
    const accounts: TaxReportAccount[] = clientItems.map((item) => ({
      accountName: String(item.data.accountName || ''),
      accountNumber: String(item.data.accountNumber || ''),
      taxForm: String(item.data.taxForm || ''),
      specialNotes: String(item.data.specialNotes || ''),
    }));

    result.set(clientName, {
      client: {
        name: clientName,
        email: clientItems[0]?.data.clientEmail
          ? String(clientItems[0].data.clientEmail)
          : undefined,
      },
      accounts,
      taxYear: settings.taxYear,
      firmName: settings.firmName,
      assistantName: settings.assistantName,
      contactEmail: settings.contactEmail,
    });
  }

  return result;
}

/**
 * Transform batch items into beneficiary review data
 */
export function transformToBeneficiaryData(
  items: BatchItem[],
  _settings: BatchSettings
): Map<string, BeneficiaryReviewData[]> {
  // Group by account owner to consolidate accounts
  const grouped = groupItemsByField(items, 'accountOwner');
  const result = new Map<string, BeneficiaryReviewData[]>();

  for (const [accountOwner, ownerItems] of grouped) {
    // Further group by account
    const accountGroups = groupItemsByField(ownerItems, 'accountNumber');
    const accounts: BeneficiaryReviewData[] = [];

    for (const [accountNumber, accountItems] of accountGroups) {
      const primaryBeneficiaries: Beneficiary[] = [];
      const contingentBeneficiaries: Beneficiary[] = [];
      let primaryPerStirpes = false;
      let contingentPerStirpes = false;

      const accountValue = Number(accountItems[0]?.data.accountValue || 0);

      for (const item of accountItems) {
        const beneficiary: Beneficiary = {
          name: String(item.data.beneficiaryName || ''),
          percentage: Number(item.data.beneficiaryPercentage || 0),
          dollarAmount: accountValue * (Number(item.data.beneficiaryPercentage || 0) / 100),
        };

        const beneficiaryType = String(item.data.beneficiaryType || 'primary').toLowerCase();
        const perStirpes = Boolean(item.data.perStirpes);

        if (beneficiaryType.includes('contingent')) {
          contingentBeneficiaries.push(beneficiary);
          if (perStirpes) contingentPerStirpes = true;
        } else {
          primaryBeneficiaries.push(beneficiary);
          if (perStirpes) primaryPerStirpes = true;
        }
      }

      accounts.push({
        accountOwner,
        accountType: String(accountItems[0]?.data.accountType || ''),
        accountNumber,
        accountValue,
        primaryBeneficiaries,
        primaryPerStirpes,
        contingentBeneficiaries,
        contingentPerStirpes,
      });
    }

    result.set(accountOwner, accounts);
  }

  return result;
}

/**
 * Transform batch items into RMD strategy data
 */
export function transformToRMDData(
  items: BatchItem[],
  settings: BatchSettings
): Map<string, RMDStrategyData> {
  // Group by account owner
  const grouped = groupItemsByField(items, 'accountOwner');
  const result = new Map<string, RMDStrategyData>();

  for (const [accountOwner, ownerItems] of grouped) {
    const accounts: RMDAccount[] = [];
    const recommendations: RMDRecommendation[] = [];
    let totalRMDDue = 0;
    let totalWithdrawals = 0;

    for (const item of ownerItems) {
      const amountRequired = Number(item.data.amountRequired || 0);
      const yearToDateWithdrawals = Number(item.data.yearToDateWithdrawals || 0);

      totalRMDDue += amountRequired;
      totalWithdrawals += yearToDateWithdrawals;

      accounts.push({
        accountName: String(item.data.accountName || ''),
        accountNumber: String(item.data.accountNumber || ''),
        hasSystematic: Boolean(item.data.hasSystematic),
        amountRequired,
        yearToDateWithdrawals,
      });

      // Add recommendation if specified
      if (item.data.suggestedWithdrawal) {
        recommendations.push({
          accountName: String(item.data.accountName || ''),
          suggestedWithdrawal: Number(item.data.suggestedWithdrawal || 0),
          depositLocation: String(item.data.depositLocation || ''),
          federalTax: Number(item.data.federalTax || 0),
          stateTax: Number(item.data.stateTax || 0),
        });
      }
    }

    result.set(accountOwner, {
      accountOwner,
      taxYear: settings.taxYear,
      accounts,
      totalRMDDue,
      totalWithdrawals,
      remainingRMD: totalRMDDue - totalWithdrawals,
      recommendations,
      assistantName: settings.assistantName,
    });
  }

  return result;
}

/**
 * Transform batch items into tax strategy data
 */
export function transformToTaxStrategyData(
  items: BatchItem[],
  _settings: BatchSettings
): Map<string, TaxStrategyData> {
  const result = new Map<string, TaxStrategyData>();

  for (const item of items) {
    const clientName = String(item.data.clientName || '');

    result.set(clientName, {
      clientName,
      taxYear: Number(item.data.taxYear || new Date().getFullYear()),
      priorYear: {
        deduction: Number(item.data.priorYearDeduction || 0),
        deductionType: (String(item.data.priorYearDeductionType || 'standard').toLowerCase() as 'standard' | 'itemized'),
        taxableIncome: Number(item.data.priorYearTaxableIncome || 0),
        taxBill: Number(item.data.priorYearTaxBill || 0),
        bracket: Number(item.data.priorYearBracket || 0),
      },
      currentYear: {
        deduction: Number(item.data.currentYearDeduction || 0),
        taxableIncome: Number(item.data.currentYearTaxableIncome || 0),
        taxBill: Number(item.data.currentYearTaxBill || 0),
        bracket: Number(item.data.currentYearBracket || 0),
      },
      primaryStrategy: String(item.data.primaryStrategy || ''),
      strategyDescription: String(item.data.strategyDescription || ''),
    });
  }

  return result;
}

/**
 * Format a file name based on pattern and data
 */
export function formatFileName(
  pattern: string,
  data: Record<string, unknown>,
  index: number
): string {
  let result = pattern;

  // Replace placeholders
  result = result.replace(/\{clientName\}/gi, sanitizeFileName(String(data.clientName || data.accountOwner || 'Client')));
  result = result.replace(/\{accountOwner\}/gi, sanitizeFileName(String(data.accountOwner || data.clientName || 'Client')));
  result = result.replace(/\{date\}/gi, new Date().toISOString().split('T')[0]);
  result = result.replace(/\{year\}/gi, String(new Date().getFullYear()));
  result = result.replace(/\{index\}/gi, String(index + 1).padStart(3, '0'));
  result = result.replace(/\{accountNumber\}/gi, sanitizeFileName(String(data.accountNumber || '')));

  return result;
}

/**
 * Sanitize a string for use in file names
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
    .substring(0, 50); // Limit length
}

/**
 * Calculate batch progress percentage
 */
export function calculateProgress(job: BatchJob): number {
  if (job.totalItems === 0) return 0;
  return Math.round((job.processedItems / job.totalItems) * 100);
}

/**
 * Get summary statistics for a batch job
 */
export function getBatchSummary(job: BatchJob): {
  total: number;
  pending: number;
  processing: number;
  success: number;
  error: number;
  skipped: number;
} {
  return {
    total: job.totalItems,
    pending: job.items.filter((i) => i.status === 'pending').length,
    processing: job.items.filter((i) => i.status === 'processing').length,
    success: job.items.filter((i) => i.status === 'success').length,
    error: job.items.filter((i) => i.status === 'error').length,
    skipped: job.items.filter((i) => i.status === 'skipped').length,
  };
}

/**
 * Create a batch result summary
 */
export function createBatchResult(
  job: BatchJob,
  startTime: number
): BatchResult {
  const errors: BatchError[] = job.items
    .filter((i) => i.status === 'error')
    .map((item) => ({
      rowNumber: item.rowNumber,
      clientName: item.data.clientName
        ? String(item.data.clientName)
        : item.data.accountOwner
        ? String(item.data.accountOwner)
        : undefined,
      message: item.errorMessage || 'Unknown error',
    }));

  return {
    jobId: job.id,
    success: job.errorCount === 0,
    totalProcessed: job.processedItems,
    successCount: job.successCount,
    errorCount: job.errorCount,
    skippedCount: job.skippedCount,
    outputDirectory: job.settings.outputDirectory,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Export batch result to CSV for error reporting
 */
export function exportErrorReport(result: BatchResult): string {
  const headers = ['Row Number', 'Client Name', 'Error Message'];
  const rows = result.errors.map((error) => [
    String(error.rowNumber),
    error.clientName || '',
    `"${error.message.replace(/"/g, '""')}"`, // Escape quotes
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Batch job state machine transitions
 */
export function transitionJobState(
  job: BatchJob,
  action: 'start' | 'pause' | 'resume' | 'cancel' | 'complete'
): BatchJob {
  switch (action) {
    case 'start':
      if (job.status !== 'idle') {
        throw new Error('Can only start a job that is idle');
      }
      return {
        ...job,
        status: 'running',
        startedAt: new Date().toISOString(),
      };

    case 'pause':
      if (job.status !== 'running') {
        throw new Error('Can only pause a running job');
      }
      return {
        ...job,
        status: 'paused',
      };

    case 'resume':
      if (job.status !== 'paused') {
        throw new Error('Can only resume a paused job');
      }
      return {
        ...job,
        status: 'running',
      };

    case 'cancel':
      if (job.status === 'completed' || job.status === 'cancelled') {
        throw new Error('Cannot cancel a completed or already cancelled job');
      }
      return {
        ...job,
        status: 'cancelled',
        completedAt: new Date().toISOString(),
      };

    case 'complete':
      return {
        ...job,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };

    default:
      return job;
  }
}

/**
 * Update a single item's status in a batch job
 */
export function updateItemStatus(
  job: BatchJob,
  itemId: string,
  status: BatchItem['status'],
  errorMessage?: string,
  outputPath?: string
): BatchJob {
  const itemIndex = job.items.findIndex((i) => i.id === itemId);

  if (itemIndex === -1) {
    throw new Error(`Item ${itemId} not found in job`);
  }

  const updatedItem: BatchItem = {
    ...job.items[itemIndex],
    status,
    errorMessage,
    outputPath,
  };

  const updatedItems = [...job.items];
  updatedItems[itemIndex] = updatedItem;

  // Recalculate counts
  const processedItems = updatedItems.filter(
    (i) => i.status === 'success' || i.status === 'error' || i.status === 'skipped'
  ).length;

  return {
    ...job,
    items: updatedItems,
    processedItems,
    successCount: updatedItems.filter((i) => i.status === 'success').length,
    errorCount: updatedItems.filter((i) => i.status === 'error').length,
    skippedCount: updatedItems.filter((i) => i.status === 'skipped').length,
  };
}

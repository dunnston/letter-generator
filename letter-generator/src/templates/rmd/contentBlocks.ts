/**
 * Content blocks for RMD Strategy Letters
 * Based on sample: letter_templates/RMD Strategy.docx
 * Placeholders use {variableName} syntax for interpolation
 */

export interface ContentBlock {
  id: string;
  content: string;
  placeholders: string[];
}

// Account owner header
export const ACCOUNT_OWNER_HEADER: ContentBlock = {
  id: 'accountOwnerHeader',
  content: 'Account Owner(s): {accountOwner}',
  placeholders: ['accountOwner'],
};

// Introduction paragraph explaining RMD requirements
export const INTRODUCTION_BLOCK: ContentBlock = {
  id: 'introduction',
  content:
    'Each year you are required to take a minimum amount out of your tax deferred account each year. Failure to take the minimum amount by December 31st will result in a 50% penalty of the amount you were supposed to take out.',
  placeholders: [],
};

// Section title for account table
export const ACCOUNT_TABLE_TITLE: ContentBlock = {
  id: 'accountTableTitle',
  content: '{taxYear} Required Minimum Distributions*',
  placeholders: ['taxYear'],
};

// IRS explanation paragraph
export const IRS_EXPLANATION_BLOCK: ContentBlock = {
  id: 'irsExplanation',
  content:
    'The IRS views all of your IRA accounts as a single account when it comes to RMDs. You do not have to satisfy the RMDs on an account by account basis but your must satisfy the total combined RMD due each year. Here is a break down of what you still must take to be compliant.',
  placeholders: [],
};

// Summary labels
export const SUMMARY_LABELS = {
  totalRMDDue: 'Total RMD Due for {taxYear}:',
  totalWithdrawals: 'Total IRA Withdrawals for {taxYear}:',
  remainingRMD: 'Total RMD Remaining for {taxYear}:',
};

// Recommendations section title
export const RECOMMENDATIONS_TITLE: ContentBlock = {
  id: 'recommendationsTitle',
  content: 'Our initial recommendation(s) on how to satisfy your remaining RMDs is as follows:',
  placeholders: [],
};

// Next steps paragraph
export const NEXT_STEPS_BLOCK: ContentBlock = {
  id: 'nextSteps',
  content:
    "The above recommendation is not final. Please do not take any action until we have spoken. If you haven't already please make sure you schedule your RMD call for October. If you would like to take your RMD earlier please reach out to {assistantName} and he/she will get you in the calendar as soon as possible.",
  placeholders: ['assistantName'],
};

// Footnote about managed accounts
export const MANAGED_ACCOUNTS_NOTE: ContentBlock = {
  id: 'managedAccountsNote',
  content:
    '* Please keep in mind that this only includes accounts that are managed by {firmName}, you might also have RMDs that need to be taken from your accounts that are held away. If you would like us to include these as part of our analysis, you will need to provide us with the required amounts for each account.',
  placeholders: ['firmName'],
};

// Table column headers for RMD accounts
export const RMD_TABLE_HEADERS = {
  accountName: 'Account Name',
  accountNumber: 'Account Number',
  systematic: 'Systematic',
  amountRequired: 'Amount Required',
  yearToDateWithdrawals: '{taxYear} Withdrawals',
};

// Table column headers for recommendations
export const RECOMMENDATION_TABLE_HEADERS = {
  accountName: 'Account Name',
  suggestedWithdrawal: 'Suggested Withdrawal',
  depositLocation: 'Deposit Location',
  federalTax: 'Federal Tax',
  stateTax: 'State Tax',
};

// Yes/No for systematic
export const YES_NO = {
  yes: 'Yes',
  no: 'No',
};

// Default disclaimer
export const DEFAULT_RMD_DISCLAIMER =
  'This summary is provided for informational purposes only. The RMD calculations shown are estimates based on the most recent information available to our office and may not reflect recent account activity. Actual RMD amounts should be verified with your tax professional and account custodians. This document does not constitute tax advice. Please consult with your tax advisor before making any withdrawal decisions.';

/**
 * Interpolate placeholders in a content block
 */
export function interpolate(
  template: string,
  data: Record<string, string | number | undefined>
): string {
  return template.replace(/{(\w+)}/g, (_, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : '';
  });
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(0)}%`;
}

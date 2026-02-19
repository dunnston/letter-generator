/**
 * Content blocks for Beneficiary Review Letters
 * Based on sample: letter_templates/Beneficiary Review.docx
 * Placeholders use {variableName} syntax for interpolation
 */

export interface ContentBlock {
  id: string;
  content: string;
  placeholders: string[];
}

// Account owner header - displayed at top of letter
export const ACCOUNT_OWNER_HEADER: ContentBlock = {
  id: 'accountOwnerHeader',
  content: 'Account Owner(s): {accountOwner}',
  placeholders: ['accountOwner'],
};

// Account title line - shows account type and number
export const ACCOUNT_TITLE: ContentBlock = {
  id: 'accountTitle',
  content: 'Confirming your Beneficiaries for {accountType} – {accountNumber}',
  placeholders: ['accountType', 'accountNumber'],
};

// Introduction paragraph - asks client to confirm accuracy
export const INTRODUCTION_BLOCK: ContentBlock = {
  id: 'introduction',
  content:
    'As you review the following information, please confirm both the accuracy of the beneficiaries (e.g. Spelling) AND that this distribution still reflects your wishes.',
  placeholders: [],
};

// Change instructions
export const CHANGE_INSTRUCTIONS: ContentBlock = {
  id: 'changeInstructions',
  content:
    'Changing beneficiaries is as easy as a quick phone call or email to {assistantName}.',
  placeholders: ['assistantName'],
};

// Primary beneficiaries section header
export const PRIMARY_BENEFICIARIES_HEADER: ContentBlock = {
  id: 'primaryHeader',
  content:
    'If the account owner(s) were to pass away, this account would be distributed to the following PRIMARY beneficiaries:',
  placeholders: [],
};

// Contingent beneficiaries section header
export const CONTINGENT_BENEFICIARIES_HEADER: ContentBlock = {
  id: 'contingentHeader',
  content:
    'If the account owner were to pass away AND the Primary beneficiaries listed above were not alive, this account would be distributed to the following CONTINGENT beneficiaries:',
  placeholders: [],
};

// Closing paragraph - about service
export const CLOSING_BLOCK: ContentBlock = {
  id: 'closing',
  content:
    'Making sure your wishes are honored after your passing is just one of the many services we provide for your family. During our next meeting together, we will review your beneficiaries including the appropriate use of "per stirpes" designations.',
  placeholders: [],
};

// Per stirpes explanation (for reference when client has questions)
export const PER_STIRPES_EXPLANATION: ContentBlock = {
  id: 'perStirpesExplanation',
  content:
    'Per Stirpes: If a beneficiary passes away before you, their share will pass to their descendants (children/grandchildren) rather than being redistributed among the remaining beneficiaries.',
  placeholders: [],
};

// Field labels for beneficiary display
export const FIELD_LABELS = {
  beneficiaryName: 'Beneficiary Name:',
  percentage: 'Percentage of Account:',
  dollarAmount: 'Approximate Dollar Amount:',
  perStirpes: 'Designated "Per Stirpes"?',
};

// Section headers
export const SECTION_HEADERS = {
  primaryBeneficiaries: 'PRIMARY',
  contingentBeneficiaries: 'CONTINGENT',
};

// No beneficiary message
export const NO_BENEFICIARIES_MESSAGE = 'No beneficiaries designated';

// Yes/No for per stirpes
export const YES_NO = {
  yes: 'Yes',
  no: 'No',
};

// Default disclaimer
export const DEFAULT_BENEFICIARY_DISCLAIMER =
  'This summary is provided for informational purposes only and is based on the most recent information available to our office. Beneficiary designations shown here may not reflect recent changes that have not yet been processed. Please verify all information with the account custodian. This document does not constitute legal or tax advice.';

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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(0)}%`;
}

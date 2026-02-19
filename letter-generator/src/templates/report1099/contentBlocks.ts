/**
 * Content blocks for 1099 Report Letters
 * Placeholders use {variableName} syntax for interpolation
 */

export interface ContentBlock {
  id: string;
  content: string;
  placeholders: string[];
}

// Introduction paragraph
export const INTRODUCTION_BLOCK: ContentBlock = {
  id: 'introduction',
  content:
    'The following is a list of your accounts held through {firmName} and the respective tax forms that you will need from each account to complete your {taxYear} tax return. Please note that we only have tax information for accounts held through our office.',
  placeholders: ['firmName', 'taxYear'],
};

// Reminder bullet items
export const REMINDER_ITEMS: string[] = [
  'The deadline for companies to make all form 1099s available is February 15th.',
  'Different types of accounts (e.g. IRA, Joint, etc.) are generated at different times and may arrive separately.',
  'In an effort to save trees (and money), many companies are no longer mailing 1099s and are instead posting them online.',
  'All traditional IRA, Rollover IRA, and Roth IRA accounts will generate a form 5498 which is not typically needed for tax preparation.',
];

// Contact section for missing 1099s
export const CONTACT_BLOCK: ContentBlock = {
  id: 'contact',
  content:
    'If you are missing a 1099 or if you have any questions or concerns regarding your accounts through our office, please contact us at {contactEmail}.',
  placeholders: ['contactEmail'],
};

// Tax return request
export const TAX_RETURN_REQUEST: ContentBlock = {
  id: 'taxReturnRequest',
  content:
    'Once your {taxYear} tax return is complete, please send {assistantName} a copy so that we can continue providing you with the best possible tax strategies.',
  placeholders: ['taxYear', 'assistantName'],
};

// Scam alert content
export const SCAM_ALERT_TITLE = 'Scam Alert';

export const SCAM_ALERT_BLOCK: ContentBlock = {
  id: 'scamAlert',
  content:
    "Please assume that every email or phone call that you receive is a scam until proven otherwise. The FTC estimates that $17 million was lost to IRS scams and another $19 million to Social Security scams. Don't be the next scam victim! When in doubt, call our office.",
  placeholders: [],
};

// Default disclaimer
export const DEFAULT_1099_DISCLAIMER =
  'Our attorneys would like us to remind you that this report is provided as a courtesy and is for informational purposes only. Only the tax information you receive directly from your investment companies should be considered official. This guide is not a replacement for having a licensed professional complete your tax return.';

// Table column headers
export const TABLE_HEADERS = {
  accountName: 'Account Name',
  accountNumber: 'Account Number',
  taxForm: 'Tax Form',
  specialNotes: 'Special Notes',
};

// Section header
export const REMINDER_HEADER = 'Please remember the following:';

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

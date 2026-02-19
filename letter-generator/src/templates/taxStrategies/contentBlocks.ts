/**
 * Content blocks for Tax Strategy Letters
 * Based on sample: letter_templates/YOUR Tax Strategies post tax-reform (1).docx
 * Placeholders use {variableName} syntax for interpolation
 */

export interface ContentBlock {
  id: string;
  content: string;
  placeholders: string[];
}

// Letter title/header
export const LETTER_TITLE: ContentBlock = {
  id: 'letterTitle',
  content: 'YOUR Tax Strategies post tax-reform',
  placeholders: [],
};

// Introduction paragraph explaining tax helper role
export const INTRODUCTION_BLOCK: ContentBlock = {
  id: 'introduction',
  content:
    "While we don't prepare your taxes and we're certainly not tax professionals, our involvement in your financial life uniquely positions us as your tax 'helper.' In this role we help gather tax information to make tax season easier for you. We provide tax strategy help based on your financial goals and because of our extensive record keeping, we can provide invaluable assistance should the IRS ever have questions for you.",
  placeholders: [],
};

// Prior year section header
export const PRIOR_YEAR_HEADER: ContentBlock = {
  id: 'priorYearHeader',
  content: 'As a bit of education, based on your {priorYear} tax return:',
  placeholders: ['priorYear'],
};

// Prior year deduction line
export const PRIOR_YEAR_DEDUCTION: ContentBlock = {
  id: 'priorYearDeduction',
  content: 'You claimed the {deductionType} deduction of {deductionAmount}.',
  placeholders: ['deductionType', 'deductionAmount'],
};

// Prior year taxable income line
export const PRIOR_YEAR_TAXABLE_INCOME: ContentBlock = {
  id: 'priorYearTaxableIncome',
  content: "Your 'taxable' income was {taxableIncome}.",
  placeholders: ['taxableIncome'],
};

// Prior year tax bill line
export const PRIOR_YEAR_TAX_BILL: ContentBlock = {
  id: 'priorYearTaxBill',
  content: 'Based on this income your tax bill for the year was {taxBill}',
  placeholders: ['taxBill'],
};

// Prior year tax bracket line
export const PRIOR_YEAR_BRACKET: ContentBlock = {
  id: 'priorYearBracket',
  content: 'This puts you in the {bracket}% tax bracket (i.e. ${bracketCents} of every additional dollar goes to the IRS)',
  placeholders: ['bracket', 'bracketCents'],
};

// Current year section header
export const CURRENT_YEAR_HEADER: ContentBlock = {
  id: 'currentYearHeader',
  content:
    'IF your income and expenses in {currentYear} were the same as {priorYear}, under the new tax law we ESTIMATE your {currentYear} tax return (filed in April {filingYear}) to look something like:',
  placeholders: ['currentYear', 'priorYear', 'filingYear'],
};

// Current year deduction line
export const CURRENT_YEAR_DEDUCTION: ContentBlock = {
  id: 'currentYearDeduction',
  content: 'Standard deduction of {deductionAmount}.',
  placeholders: ['deductionAmount'],
};

// Current year taxable income line
export const CURRENT_YEAR_TAXABLE_INCOME: ContentBlock = {
  id: 'currentYearTaxableIncome',
  content: 'Estimated Taxable income of {taxableIncome}',
  placeholders: ['taxableIncome'],
};

// Current year tax bill line
export const CURRENT_YEAR_TAX_BILL: ContentBlock = {
  id: 'currentYearTaxBill',
  content: 'Estimated tax bill {taxBill}',
  placeholders: ['taxBill'],
};

// Current year tax bracket line
export const CURRENT_YEAR_BRACKET: ContentBlock = {
  id: 'currentYearBracket',
  content: 'Tax Bracket of {bracket}%',
  placeholders: ['bracket'],
};

// Comparison estimate note
export const COMPARISON_NOTE: ContentBlock = {
  id: 'comparisonNote',
  content:
    'Based on what we know of your tax situation in {currentYear}, this estimate will be pretty close to your actual return.',
  placeholders: ['currentYear'],
};

// Tax strategy recommendation intro
export const STRATEGY_INTRO: ContentBlock = {
  id: 'strategyIntro',
  content: "With all this in mind, our top tax strategy in your situation is a {primaryStrategy} because it will let us 'pay the devil today' at a potentially lower rate than if we waited.",
  placeholders: ['primaryStrategy'],
};

// Strategy follow-up (customizable)
export const STRATEGY_FOLLOWUP: ContentBlock = {
  id: 'strategyFollowup',
  content: '{strategyDescription}',
  placeholders: ['strategyDescription'],
};

// Closing paragraph
export const CLOSING_BLOCK: ContentBlock = {
  id: 'closing',
  content:
    'If you have any questions about this estimate or our role as your tax helper, please call or email, otherwise, we look forward to discussing this with you soon.',
  placeholders: [],
};

// Default disclaimer
export const DEFAULT_TAX_STRATEGY_DISCLAIMER =
  'This summary is provided for informational purposes only and does not constitute tax advice. The estimates and calculations shown are based on the information available to our office and assumptions about tax law. Your actual tax liability may differ. Please consult with a qualified tax professional before making any tax-related decisions.';

// Common tax strategies
export const COMMON_TAX_STRATEGIES: { [key: string]: { name: string; description: string } } = {
  roth_conversion: {
    name: 'ROTH Conversion',
    description:
      'Later this month we will want to discuss the exact amount we recommend converting from your IRA to your ROTH.',
  },
  tax_loss_harvesting: {
    name: 'Tax-Loss Harvesting',
    description:
      'We will review your portfolio for opportunities to realize losses that can offset gains and reduce your tax liability.',
  },
  charitable_giving: {
    name: 'Charitable Giving Strategy',
    description:
      'We will discuss optimal timing and methods for charitable contributions to maximize your tax benefit.',
  },
  income_deferral: {
    name: 'Income Deferral',
    description:
      'We will explore opportunities to defer income to the next tax year to potentially lower your current tax bracket.',
  },
  maximize_deductions: {
    name: 'Maximize Deductions',
    description:
      'We will review your deductible expenses and explore opportunities to bunch deductions in this tax year.',
  },
  capital_gains_planning: {
    name: 'Capital Gains Planning',
    description:
      'We will time the sale of investments to optimize your long-term vs short-term capital gains treatment.',
  },
};

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
 * Format percentage value (for tax bracket)
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(0)}%`;
}

/**
 * Get bracket cents (e.g., 25% = $0.25)
 */
export function getBracketCents(bracket: number): string {
  return (bracket / 100).toFixed(2);
}

/**
 * Calculate tax savings between two years
 */
export function calculateTaxSavings(priorTax: number, currentTax: number): number {
  return priorTax - currentTax;
}

/**
 * Get filing year (next year after tax year)
 */
export function getFilingYear(taxYear: number): number {
  return taxYear + 1;
}

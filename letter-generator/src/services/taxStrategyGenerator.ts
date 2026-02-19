import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import type { BatchSettings, TaxStrategyData } from '../types';
import {
  LETTER_TITLE,
  INTRODUCTION_BLOCK,
  PRIOR_YEAR_HEADER,
  PRIOR_YEAR_DEDUCTION,
  PRIOR_YEAR_TAXABLE_INCOME,
  PRIOR_YEAR_TAX_BILL,
  PRIOR_YEAR_BRACKET,
  CURRENT_YEAR_HEADER,
  CURRENT_YEAR_DEDUCTION,
  CURRENT_YEAR_TAXABLE_INCOME,
  CURRENT_YEAR_TAX_BILL,
  CURRENT_YEAR_BRACKET,
  COMPARISON_NOTE,
  STRATEGY_INTRO,
  STRATEGY_FOLLOWUP,
  CLOSING_BLOCK,
  DEFAULT_TAX_STRATEGY_DISCLAIMER,
  interpolate,
  formatCurrency,
  getBracketCents,
  getFilingYear,
} from '../templates/taxStrategies/contentBlocks';

// ==================== DOCX STYLING CONSTANTS ====================

const FONT_FAMILY = 'Arial';
const FONT_SIZE_TITLE = 32; // 16pt in half-points
const FONT_SIZE_NORMAL = 24; // 12pt in half-points
const FONT_SIZE_DISCLAIMER = 18; // 9pt in half-points

const PAGE_MARGINS = {
  top: convertInchesToTwip(1),
  right: convertInchesToTwip(1),
  bottom: convertInchesToTwip(1),
  left: convertInchesToTwip(1),
};

// ==================== HELPER FUNCTIONS ====================

function createTitleParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_TITLE,
        bold: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  });
}

function createNormalParagraph(
  text: string,
  options: { spacing?: { before?: number; after?: number }; italic?: boolean; bold?: boolean } = {}
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_NORMAL,
        italics: options.italic,
        bold: options.bold,
      }),
    ],
    spacing: options.spacing || { after: 200 },
  });
}

function createBulletParagraph(text: string, indent: number = 720): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_NORMAL,
      }),
    ],
    indent: { left: indent },
    spacing: { after: 100 },
  });
}

function createEmptyParagraph(): Paragraph {
  return new Paragraph({
    children: [],
    spacing: { after: 150 },
  });
}

// ==================== DISCLAIMER SECTION ====================

function createDisclaimerSection(content: string): Paragraph[] {
  return [
    createEmptyParagraph(),
    // Horizontal line
    new Paragraph({
      children: [
        new TextRun({
          text: '─'.repeat(50),
          font: FONT_FAMILY,
          size: FONT_SIZE_DISCLAIMER,
          color: '999999',
        }),
      ],
      spacing: { before: 400, after: 200 },
    }),
    // Disclaimer text
    new Paragraph({
      children: [
        new TextRun({
          text: content,
          font: FONT_FAMILY,
          size: FONT_SIZE_DISCLAIMER,
          italics: true,
          color: '666666',
        }),
      ],
      spacing: { after: 100 },
    }),
  ];
}

// ==================== MAIN DOCUMENT GENERATOR ====================

export interface TaxStrategyLetterData extends TaxStrategyData {
  firmName?: string;
  advisorName?: string;
  contactEmail?: string;
}

export async function generateTaxStrategyLetterDocx(
  data: TaxStrategyLetterData,
  settings: BatchSettings
): Promise<Blob> {
  const paragraphs: Paragraph[] = [];

  const priorYear = data.taxYear - 1;
  const currentYear = data.taxYear;
  const filingYear = getFilingYear(currentYear);

  // 1. Title
  paragraphs.push(createTitleParagraph(LETTER_TITLE.content));

  // 2. Introduction paragraph
  paragraphs.push(createNormalParagraph(INTRODUCTION_BLOCK.content, { spacing: { after: 300 } }));

  // 3. Prior year header
  const priorYearHeaderText = interpolate(PRIOR_YEAR_HEADER.content, { priorYear });
  paragraphs.push(createNormalParagraph(priorYearHeaderText, { spacing: { after: 200 } }));

  // 4. Prior year details as bullet points
  const deductionType = data.priorYear.deductionType === 'standard' ? 'Standard' : 'Itemized';
  const priorDeductionText = interpolate(PRIOR_YEAR_DEDUCTION.content, {
    deductionType,
    deductionAmount: formatCurrency(data.priorYear.deduction),
  });
  paragraphs.push(createBulletParagraph(priorDeductionText));

  const priorTaxableIncomeText = interpolate(PRIOR_YEAR_TAXABLE_INCOME.content, {
    taxableIncome: formatCurrency(data.priorYear.taxableIncome),
  });
  paragraphs.push(createBulletParagraph(priorTaxableIncomeText));

  const priorTaxBillText = interpolate(PRIOR_YEAR_TAX_BILL.content, {
    taxBill: formatCurrency(data.priorYear.taxBill),
  });
  paragraphs.push(createBulletParagraph(priorTaxBillText));

  const priorBracketText = interpolate(PRIOR_YEAR_BRACKET.content, {
    bracket: data.priorYear.bracket,
    bracketCents: getBracketCents(data.priorYear.bracket),
  });
  paragraphs.push(createBulletParagraph(priorBracketText));

  paragraphs.push(createEmptyParagraph());

  // 5. Current year header
  const currentYearHeaderText = interpolate(CURRENT_YEAR_HEADER.content, {
    currentYear,
    priorYear,
    filingYear,
  });
  paragraphs.push(createNormalParagraph(currentYearHeaderText, { spacing: { after: 200 } }));

  // 6. Current year details as bullet points
  const currentDeductionText = interpolate(CURRENT_YEAR_DEDUCTION.content, {
    deductionAmount: formatCurrency(data.currentYear.deduction),
  });
  paragraphs.push(createBulletParagraph(currentDeductionText));

  const currentTaxableIncomeText = interpolate(CURRENT_YEAR_TAXABLE_INCOME.content, {
    taxableIncome: formatCurrency(data.currentYear.taxableIncome),
  });
  paragraphs.push(createBulletParagraph(currentTaxableIncomeText));

  const currentTaxBillText = interpolate(CURRENT_YEAR_TAX_BILL.content, {
    taxBill: formatCurrency(data.currentYear.taxBill),
  });
  paragraphs.push(createBulletParagraph(currentTaxBillText));

  const currentBracketText = interpolate(CURRENT_YEAR_BRACKET.content, {
    bracket: data.currentYear.bracket,
  });
  paragraphs.push(createBulletParagraph(currentBracketText));

  paragraphs.push(createEmptyParagraph());

  // 7. Comparison note
  const comparisonNoteText = interpolate(COMPARISON_NOTE.content, { currentYear });
  paragraphs.push(createNormalParagraph(comparisonNoteText, { italic: true, spacing: { after: 300 } }));

  // 8. Tax strategy recommendation
  if (data.primaryStrategy) {
    const strategyIntroText = interpolate(STRATEGY_INTRO.content, {
      primaryStrategy: data.primaryStrategy,
    });
    paragraphs.push(createNormalParagraph(strategyIntroText, { spacing: { after: 200 } }));

    if (data.strategyDescription) {
      const strategyFollowupText = interpolate(STRATEGY_FOLLOWUP.content, {
        strategyDescription: data.strategyDescription,
      });
      paragraphs.push(createNormalParagraph(strategyFollowupText, { spacing: { after: 300 } }));
    }
  }

  // 9. Closing paragraph
  paragraphs.push(createNormalParagraph(CLOSING_BLOCK.content, { spacing: { after: 300 } }));

  // 10. Disclaimer
  const disclaimerText = settings.customDisclaimerText || DEFAULT_TAX_STRATEGY_DISCLAIMER;
  if (settings.includeDisclaimer) {
    paragraphs.push(...createDisclaimerSection(disclaimerText));
  }

  // Create document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: FONT_SIZE_NORMAL,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: PAGE_MARGINS,
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

export async function generateTaxStrategyLetterBuffer(
  data: TaxStrategyLetterData,
  settings: BatchSettings
): Promise<Buffer> {
  const paragraphs: Paragraph[] = [];

  const priorYear = data.taxYear - 1;
  const currentYear = data.taxYear;
  const filingYear = getFilingYear(currentYear);

  // 1. Title
  paragraphs.push(createTitleParagraph(LETTER_TITLE.content));

  // 2. Introduction paragraph
  paragraphs.push(createNormalParagraph(INTRODUCTION_BLOCK.content, { spacing: { after: 300 } }));

  // 3. Prior year header
  const priorYearHeaderText = interpolate(PRIOR_YEAR_HEADER.content, { priorYear });
  paragraphs.push(createNormalParagraph(priorYearHeaderText, { spacing: { after: 200 } }));

  // 4. Prior year details as bullet points
  const deductionType = data.priorYear.deductionType === 'standard' ? 'Standard' : 'Itemized';
  const priorDeductionText = interpolate(PRIOR_YEAR_DEDUCTION.content, {
    deductionType,
    deductionAmount: formatCurrency(data.priorYear.deduction),
  });
  paragraphs.push(createBulletParagraph(priorDeductionText));

  const priorTaxableIncomeText = interpolate(PRIOR_YEAR_TAXABLE_INCOME.content, {
    taxableIncome: formatCurrency(data.priorYear.taxableIncome),
  });
  paragraphs.push(createBulletParagraph(priorTaxableIncomeText));

  const priorTaxBillText = interpolate(PRIOR_YEAR_TAX_BILL.content, {
    taxBill: formatCurrency(data.priorYear.taxBill),
  });
  paragraphs.push(createBulletParagraph(priorTaxBillText));

  const priorBracketText = interpolate(PRIOR_YEAR_BRACKET.content, {
    bracket: data.priorYear.bracket,
    bracketCents: getBracketCents(data.priorYear.bracket),
  });
  paragraphs.push(createBulletParagraph(priorBracketText));

  paragraphs.push(createEmptyParagraph());

  // 5. Current year header
  const currentYearHeaderText = interpolate(CURRENT_YEAR_HEADER.content, {
    currentYear,
    priorYear,
    filingYear,
  });
  paragraphs.push(createNormalParagraph(currentYearHeaderText, { spacing: { after: 200 } }));

  // 6. Current year details as bullet points
  const currentDeductionText = interpolate(CURRENT_YEAR_DEDUCTION.content, {
    deductionAmount: formatCurrency(data.currentYear.deduction),
  });
  paragraphs.push(createBulletParagraph(currentDeductionText));

  const currentTaxableIncomeText = interpolate(CURRENT_YEAR_TAXABLE_INCOME.content, {
    taxableIncome: formatCurrency(data.currentYear.taxableIncome),
  });
  paragraphs.push(createBulletParagraph(currentTaxableIncomeText));

  const currentTaxBillText = interpolate(CURRENT_YEAR_TAX_BILL.content, {
    taxBill: formatCurrency(data.currentYear.taxBill),
  });
  paragraphs.push(createBulletParagraph(currentTaxBillText));

  const currentBracketText = interpolate(CURRENT_YEAR_BRACKET.content, {
    bracket: data.currentYear.bracket,
  });
  paragraphs.push(createBulletParagraph(currentBracketText));

  paragraphs.push(createEmptyParagraph());

  // 7. Comparison note
  const comparisonNoteText = interpolate(COMPARISON_NOTE.content, { currentYear });
  paragraphs.push(createNormalParagraph(comparisonNoteText, { italic: true, spacing: { after: 300 } }));

  // 8. Tax strategy recommendation
  if (data.primaryStrategy) {
    const strategyIntroText = interpolate(STRATEGY_INTRO.content, {
      primaryStrategy: data.primaryStrategy,
    });
    paragraphs.push(createNormalParagraph(strategyIntroText, { spacing: { after: 200 } }));

    if (data.strategyDescription) {
      const strategyFollowupText = interpolate(STRATEGY_FOLLOWUP.content, {
        strategyDescription: data.strategyDescription,
      });
      paragraphs.push(createNormalParagraph(strategyFollowupText, { spacing: { after: 300 } }));
    }
  }

  // 9. Closing paragraph
  paragraphs.push(createNormalParagraph(CLOSING_BLOCK.content, { spacing: { after: 300 } }));

  // 10. Disclaimer
  const disclaimerText = settings.customDisclaimerText || DEFAULT_TAX_STRATEGY_DISCLAIMER;
  if (settings.includeDisclaimer) {
    paragraphs.push(...createDisclaimerSection(disclaimerText));
  }

  // Create document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: FONT_SIZE_NORMAL,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: PAGE_MARGINS,
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

// ==================== FILENAME GENERATOR ====================

export function generateTaxStrategyFilename(
  clientName: string,
  taxYear: number,
  extension: 'docx' | 'pdf'
): string {
  // Sanitize client name for filename
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const sanitizedName = sanitize(clientName);

  return `${sanitizedName}_Tax_Strategy_${taxYear}.${extension}`;
}

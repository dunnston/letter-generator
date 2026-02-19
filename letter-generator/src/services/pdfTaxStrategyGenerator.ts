import jsPDF from 'jspdf';
import type { BatchSettings } from '../types';
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
import { generateTaxStrategyFilename, TaxStrategyLetterData } from './taxStrategyGenerator';

// ==================== PDF STYLING CONSTANTS ====================

const PDF_CONFIG = {
  pageWidth: 8.5, // inches
  pageHeight: 11, // inches
  marginTop: 1,
  marginBottom: 1,
  marginLeft: 1,
  marginRight: 1,
  fontSize: {
    normal: 11,
    title: 16,
    header: 14,
    subheader: 12,
    disclaimer: 8,
  },
  lineHeight: 1.4,
  fontFamily: 'helvetica',
};

// ==================== HELPER FUNCTIONS ====================

interface PDFContext {
  doc: jsPDF;
  y: number;
  pageWidth: number;
  contentWidth: number;
  marginLeft: number;
  marginTop: number;
  marginBottom: number;
  lineHeight: number;
}

function createContext(doc: jsPDF): PDFContext {
  const pageWidth = PDF_CONFIG.pageWidth * 72; // Convert to points
  const marginLeft = PDF_CONFIG.marginLeft * 72;
  const marginRight = PDF_CONFIG.marginRight * 72;
  const marginTop = PDF_CONFIG.marginTop * 72;
  const marginBottom = PDF_CONFIG.marginBottom * 72;

  return {
    doc,
    y: marginTop,
    pageWidth,
    contentWidth: pageWidth - marginLeft - marginRight,
    marginLeft,
    marginTop,
    marginBottom,
    lineHeight: PDF_CONFIG.fontSize.normal * PDF_CONFIG.lineHeight,
  };
}

function checkPageBreak(ctx: PDFContext, neededHeight: number = 20): void {
  const pageHeight = PDF_CONFIG.pageHeight * 72;
  const maxY = pageHeight - ctx.marginBottom;

  if (ctx.y + neededHeight > maxY) {
    ctx.doc.addPage();
    ctx.y = ctx.marginTop;
  }
}

function addText(
  ctx: PDFContext,
  text: string,
  options: {
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    indent?: number;
    color?: [number, number, number];
    spacing?: { before?: number; after?: number };
    align?: 'left' | 'center' | 'right';
  } = {}
): void {
  const fontSize = options.fontSize || PDF_CONFIG.fontSize.normal;
  const indent = options.indent || 0;
  const spacingBefore = options.spacing?.before || 0;
  const spacingAfter = options.spacing?.after || 6;

  ctx.y += spacingBefore;

  ctx.doc.setFontSize(fontSize);

  let fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal';
  if (options.bold && options.italic) {
    fontStyle = 'bolditalic';
  } else if (options.bold) {
    fontStyle = 'bold';
  } else if (options.italic) {
    fontStyle = 'italic';
  }
  ctx.doc.setFont(PDF_CONFIG.fontFamily, fontStyle);

  if (options.color) {
    ctx.doc.setTextColor(...options.color);
  } else {
    ctx.doc.setTextColor(0, 0, 0);
  }

  const x = ctx.marginLeft + indent;
  const maxWidth = ctx.contentWidth - indent;

  // Split text into lines that fit the width
  const lines = ctx.doc.splitTextToSize(text, maxWidth);

  lines.forEach((line: string) => {
    checkPageBreak(ctx, fontSize * PDF_CONFIG.lineHeight);

    if (options.align === 'center') {
      const textWidth = ctx.doc.getTextWidth(line);
      const centerX = ctx.marginLeft + (ctx.contentWidth - textWidth) / 2;
      ctx.doc.text(line, centerX, ctx.y);
    } else {
      ctx.doc.text(line, x, ctx.y);
    }

    ctx.y += fontSize * PDF_CONFIG.lineHeight;
  });

  ctx.y += spacingAfter;
}

function addBulletText(
  ctx: PDFContext,
  text: string,
  options: {
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    color?: [number, number, number];
  } = {}
): void {
  const fontSize = options.fontSize || PDF_CONFIG.fontSize.normal;
  const indent = 20; // Bullet indent

  ctx.doc.setFontSize(fontSize);

  let fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal';
  if (options.bold && options.italic) {
    fontStyle = 'bolditalic';
  } else if (options.bold) {
    fontStyle = 'bold';
  } else if (options.italic) {
    fontStyle = 'italic';
  }
  ctx.doc.setFont(PDF_CONFIG.fontFamily, fontStyle);

  if (options.color) {
    ctx.doc.setTextColor(...options.color);
  } else {
    ctx.doc.setTextColor(0, 0, 0);
  }

  const x = ctx.marginLeft + indent;
  const maxWidth = ctx.contentWidth - indent;

  // Split text into lines that fit the width
  const lines = ctx.doc.splitTextToSize(text, maxWidth);

  lines.forEach((line: string, index: number) => {
    checkPageBreak(ctx, fontSize * PDF_CONFIG.lineHeight);

    // Add bullet only on first line
    if (index === 0) {
      ctx.doc.text('\u2022', ctx.marginLeft + 8, ctx.y);
    }

    ctx.doc.text(line, x, ctx.y);
    ctx.y += fontSize * PDF_CONFIG.lineHeight;
  });

  ctx.y += 4; // Small spacing after bullet point
}

function addEmptyLine(ctx: PDFContext, height: number = 10): void {
  ctx.y += height;
}

// ==================== DISCLAIMER SECTION ====================

function renderDisclaimerSection(ctx: PDFContext, content: string): void {
  addEmptyLine(ctx, 20);

  // Draw horizontal line
  ctx.doc.setDrawColor(153, 153, 153);
  ctx.doc.setLineWidth(0.5);
  ctx.doc.line(ctx.marginLeft, ctx.y, ctx.marginLeft + ctx.contentWidth, ctx.y);
  ctx.y += 10;

  // Render disclaimer text
  addText(ctx, content, {
    fontSize: PDF_CONFIG.fontSize.disclaimer,
    italic: true,
    color: [102, 102, 102],
    spacing: { after: 4 },
  });
}

// ==================== MAIN PDF GENERATOR ====================

export async function generateTaxStrategyLetterPdf(
  data: TaxStrategyLetterData,
  settings: BatchSettings
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const ctx = createContext(doc);

  const priorYear = data.taxYear - 1;
  const currentYear = data.taxYear;
  const filingYear = getFilingYear(currentYear);

  // 1. Title
  addText(ctx, LETTER_TITLE.content, {
    fontSize: PDF_CONFIG.fontSize.title,
    bold: true,
    align: 'center',
    spacing: { after: 20 },
  });

  // 2. Introduction paragraph
  addText(ctx, INTRODUCTION_BLOCK.content, { spacing: { after: 16 } });

  // 3. Prior year header
  const priorYearHeaderText = interpolate(PRIOR_YEAR_HEADER.content, { priorYear });
  addText(ctx, priorYearHeaderText, { spacing: { after: 10 } });

  // 4. Prior year details as bullet points
  const deductionType = data.priorYear.deductionType === 'standard' ? 'Standard' : 'Itemized';
  const priorDeductionText = interpolate(PRIOR_YEAR_DEDUCTION.content, {
    deductionType,
    deductionAmount: formatCurrency(data.priorYear.deduction),
  });
  addBulletText(ctx, priorDeductionText);

  const priorTaxableIncomeText = interpolate(PRIOR_YEAR_TAXABLE_INCOME.content, {
    taxableIncome: formatCurrency(data.priorYear.taxableIncome),
  });
  addBulletText(ctx, priorTaxableIncomeText);

  const priorTaxBillText = interpolate(PRIOR_YEAR_TAX_BILL.content, {
    taxBill: formatCurrency(data.priorYear.taxBill),
  });
  addBulletText(ctx, priorTaxBillText);

  const priorBracketText = interpolate(PRIOR_YEAR_BRACKET.content, {
    bracket: data.priorYear.bracket,
    bracketCents: getBracketCents(data.priorYear.bracket),
  });
  addBulletText(ctx, priorBracketText);

  addEmptyLine(ctx, 10);

  // 5. Current year header
  const currentYearHeaderText = interpolate(CURRENT_YEAR_HEADER.content, {
    currentYear,
    priorYear,
    filingYear,
  });
  addText(ctx, currentYearHeaderText, { spacing: { after: 10 } });

  // 6. Current year details as bullet points
  const currentDeductionText = interpolate(CURRENT_YEAR_DEDUCTION.content, {
    deductionAmount: formatCurrency(data.currentYear.deduction),
  });
  addBulletText(ctx, currentDeductionText);

  const currentTaxableIncomeText = interpolate(CURRENT_YEAR_TAXABLE_INCOME.content, {
    taxableIncome: formatCurrency(data.currentYear.taxableIncome),
  });
  addBulletText(ctx, currentTaxableIncomeText);

  const currentTaxBillText = interpolate(CURRENT_YEAR_TAX_BILL.content, {
    taxBill: formatCurrency(data.currentYear.taxBill),
  });
  addBulletText(ctx, currentTaxBillText);

  const currentBracketText = interpolate(CURRENT_YEAR_BRACKET.content, {
    bracket: data.currentYear.bracket,
  });
  addBulletText(ctx, currentBracketText);

  addEmptyLine(ctx, 10);

  // 7. Comparison note
  const comparisonNoteText = interpolate(COMPARISON_NOTE.content, { currentYear });
  addText(ctx, comparisonNoteText, { italic: true, spacing: { after: 16 } });

  // 8. Tax strategy recommendation
  if (data.primaryStrategy) {
    const strategyIntroText = interpolate(STRATEGY_INTRO.content, {
      primaryStrategy: data.primaryStrategy,
    });
    addText(ctx, strategyIntroText, { spacing: { after: 10 } });

    if (data.strategyDescription) {
      const strategyFollowupText = interpolate(STRATEGY_FOLLOWUP.content, {
        strategyDescription: data.strategyDescription,
      });
      addText(ctx, strategyFollowupText, { spacing: { after: 16 } });
    }
  }

  // 9. Closing paragraph
  addText(ctx, CLOSING_BLOCK.content, { spacing: { after: 16 } });

  // 10. Disclaimer
  if (settings.includeDisclaimer) {
    const disclaimerText = settings.customDisclaimerText || DEFAULT_TAX_STRATEGY_DISCLAIMER;
    renderDisclaimerSection(ctx, disclaimerText);
  }

  return doc.output('blob');
}

export async function generateTaxStrategyLetterPdfDataUri(
  data: TaxStrategyLetterData,
  settings: BatchSettings
): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const ctx = createContext(doc);

  const priorYear = data.taxYear - 1;
  const currentYear = data.taxYear;
  const filingYear = getFilingYear(currentYear);

  // 1. Title
  addText(ctx, LETTER_TITLE.content, {
    fontSize: PDF_CONFIG.fontSize.title,
    bold: true,
    align: 'center',
    spacing: { after: 20 },
  });

  // 2. Introduction paragraph
  addText(ctx, INTRODUCTION_BLOCK.content, { spacing: { after: 16 } });

  // 3. Prior year header
  const priorYearHeaderText = interpolate(PRIOR_YEAR_HEADER.content, { priorYear });
  addText(ctx, priorYearHeaderText, { spacing: { after: 10 } });

  // 4. Prior year details as bullet points
  const deductionType = data.priorYear.deductionType === 'standard' ? 'Standard' : 'Itemized';
  const priorDeductionText = interpolate(PRIOR_YEAR_DEDUCTION.content, {
    deductionType,
    deductionAmount: formatCurrency(data.priorYear.deduction),
  });
  addBulletText(ctx, priorDeductionText);

  const priorTaxableIncomeText = interpolate(PRIOR_YEAR_TAXABLE_INCOME.content, {
    taxableIncome: formatCurrency(data.priorYear.taxableIncome),
  });
  addBulletText(ctx, priorTaxableIncomeText);

  const priorTaxBillText = interpolate(PRIOR_YEAR_TAX_BILL.content, {
    taxBill: formatCurrency(data.priorYear.taxBill),
  });
  addBulletText(ctx, priorTaxBillText);

  const priorBracketText = interpolate(PRIOR_YEAR_BRACKET.content, {
    bracket: data.priorYear.bracket,
    bracketCents: getBracketCents(data.priorYear.bracket),
  });
  addBulletText(ctx, priorBracketText);

  addEmptyLine(ctx, 10);

  // 5. Current year header
  const currentYearHeaderText = interpolate(CURRENT_YEAR_HEADER.content, {
    currentYear,
    priorYear,
    filingYear,
  });
  addText(ctx, currentYearHeaderText, { spacing: { after: 10 } });

  // 6. Current year details as bullet points
  const currentDeductionText = interpolate(CURRENT_YEAR_DEDUCTION.content, {
    deductionAmount: formatCurrency(data.currentYear.deduction),
  });
  addBulletText(ctx, currentDeductionText);

  const currentTaxableIncomeText = interpolate(CURRENT_YEAR_TAXABLE_INCOME.content, {
    taxableIncome: formatCurrency(data.currentYear.taxableIncome),
  });
  addBulletText(ctx, currentTaxableIncomeText);

  const currentTaxBillText = interpolate(CURRENT_YEAR_TAX_BILL.content, {
    taxBill: formatCurrency(data.currentYear.taxBill),
  });
  addBulletText(ctx, currentTaxBillText);

  const currentBracketText = interpolate(CURRENT_YEAR_BRACKET.content, {
    bracket: data.currentYear.bracket,
  });
  addBulletText(ctx, currentBracketText);

  addEmptyLine(ctx, 10);

  // 7. Comparison note
  const comparisonNoteText = interpolate(COMPARISON_NOTE.content, { currentYear });
  addText(ctx, comparisonNoteText, { italic: true, spacing: { after: 16 } });

  // 8. Tax strategy recommendation
  if (data.primaryStrategy) {
    const strategyIntroText = interpolate(STRATEGY_INTRO.content, {
      primaryStrategy: data.primaryStrategy,
    });
    addText(ctx, strategyIntroText, { spacing: { after: 10 } });

    if (data.strategyDescription) {
      const strategyFollowupText = interpolate(STRATEGY_FOLLOWUP.content, {
        strategyDescription: data.strategyDescription,
      });
      addText(ctx, strategyFollowupText, { spacing: { after: 16 } });
    }
  }

  // 9. Closing paragraph
  addText(ctx, CLOSING_BLOCK.content, { spacing: { after: 16 } });

  // 10. Disclaimer
  if (settings.includeDisclaimer) {
    const disclaimerText = settings.customDisclaimerText || DEFAULT_TAX_STRATEGY_DISCLAIMER;
    renderDisclaimerSection(ctx, disclaimerText);
  }

  return doc.output('datauristring');
}

// Re-export filename generator for consistency
export { generateTaxStrategyFilename };

import jsPDF from 'jspdf';
import type { BatchSettings, Beneficiary } from '../types';
import {
  ACCOUNT_OWNER_HEADER,
  ACCOUNT_TITLE,
  INTRODUCTION_BLOCK,
  CHANGE_INSTRUCTIONS,
  PRIMARY_BENEFICIARIES_HEADER,
  CONTINGENT_BENEFICIARIES_HEADER,
  CLOSING_BLOCK,
  FIELD_LABELS,
  NO_BENEFICIARIES_MESSAGE,
  YES_NO,
  DEFAULT_BENEFICIARY_DISCLAIMER,
  interpolate,
  formatCurrency,
  formatPercentage,
} from '../templates/beneficiary/contentBlocks';
import { generateBeneficiaryFilename, type BeneficiaryLetterData } from './beneficiaryGenerator';

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
    header: 14,
    subheader: 12,
    label: 10,
    disclaimer: 8,
  },
  lineHeight: 1.4,
  fontFamily: 'helvetica',
  labelWidth: 180, // Width for labels in points
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
    ctx.doc.text(line, x, ctx.y);
    ctx.y += fontSize * PDF_CONFIG.lineHeight;
  });

  ctx.y += spacingAfter;
}

function addLabelValue(ctx: PDFContext, label: string, value: string): void {
  const fontSize = PDF_CONFIG.fontSize.label;
  const lineHeight = fontSize * PDF_CONFIG.lineHeight;

  checkPageBreak(ctx, lineHeight);

  ctx.doc.setFontSize(fontSize);

  // Label (bold)
  ctx.doc.setFont(PDF_CONFIG.fontFamily, 'bold');
  ctx.doc.setTextColor(0, 0, 0);
  ctx.doc.text(label, ctx.marginLeft, ctx.y);

  // Value (normal)
  ctx.doc.setFont(PDF_CONFIG.fontFamily, 'normal');
  ctx.doc.text(value, ctx.marginLeft + PDF_CONFIG.labelWidth, ctx.y);

  ctx.y += lineHeight + 2;
}

function addEmptyLine(ctx: PDFContext, height: number = 10): void {
  ctx.y += height;
}

// ==================== BENEFICIARY SECTION ====================

function renderBeneficiarySection(
  ctx: PDFContext,
  beneficiaries: Beneficiary[],
  perStirpes: boolean,
  headerText: string
): void {
  // Section header (italic)
  addText(ctx, headerText, {
    fontSize: PDF_CONFIG.fontSize.normal,
    italic: true,
    spacing: { before: 10, after: 8 },
  });

  if (beneficiaries.length === 0) {
    addText(ctx, NO_BENEFICIARIES_MESSAGE, { italic: true, spacing: { after: 10 } });
    return;
  }

  // Display each beneficiary
  for (let i = 0; i < beneficiaries.length; i++) {
    const beneficiary = beneficiaries[i];

    addLabelValue(ctx, FIELD_LABELS.beneficiaryName, beneficiary.name);
    addLabelValue(ctx, FIELD_LABELS.percentage, formatPercentage(beneficiary.percentage));
    addLabelValue(ctx, FIELD_LABELS.dollarAmount, formatCurrency(beneficiary.dollarAmount));

    // Add spacing between beneficiaries if there are multiple
    if (i < beneficiaries.length - 1) {
      addEmptyLine(ctx, 8);
    }
  }

  // Per stirpes designation
  addLabelValue(ctx, FIELD_LABELS.perStirpes, perStirpes ? YES_NO.yes : YES_NO.no);

  addEmptyLine(ctx, 5);
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

export async function generateBeneficiaryLetterPdf(
  data: BeneficiaryLetterData,
  settings: BatchSettings
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const ctx = createContext(doc);

  // Interpolation data
  const interpData = {
    accountOwner: data.accountOwner,
    firmName: data.firmName || settings.firmName,
    assistantName: data.assistantName || settings.assistantName,
    contactEmail: data.contactEmail || settings.contactEmail,
  };

  // 1. Account owner header
  const ownerHeaderText = interpolate(ACCOUNT_OWNER_HEADER.content, interpData);
  addText(ctx, ownerHeaderText, {
    fontSize: PDF_CONFIG.fontSize.header,
    bold: true,
    spacing: { after: 12 },
  });

  // 2. Process each account
  for (const account of data.accounts) {
    const accountInterpData = {
      ...interpData,
      accountType: account.accountType,
      accountNumber: account.accountNumber,
    };

    // Account title
    const titleText = interpolate(ACCOUNT_TITLE.content, accountInterpData);
    addText(ctx, titleText, {
      fontSize: PDF_CONFIG.fontSize.subheader,
      bold: true,
      spacing: { before: 15, after: 10 },
    });

    // Introduction paragraph
    addText(ctx, INTRODUCTION_BLOCK.content, { spacing: { after: 8 } });

    // Change instructions
    const changeText = interpolate(CHANGE_INSTRUCTIONS.content, interpData);
    addText(ctx, changeText, { spacing: { after: 12 } });

    // Primary beneficiaries section
    renderBeneficiarySection(
      ctx,
      account.primaryBeneficiaries,
      account.primaryPerStirpes,
      PRIMARY_BENEFICIARIES_HEADER.content
    );

    // Contingent beneficiaries section
    renderBeneficiarySection(
      ctx,
      account.contingentBeneficiaries,
      account.contingentPerStirpes,
      CONTINGENT_BENEFICIARIES_HEADER.content
    );

    addEmptyLine(ctx, 10);
  }

  // 3. Closing paragraph
  addText(ctx, CLOSING_BLOCK.content, { spacing: { before: 10, after: 15 } });

  // 4. Disclaimer
  if (settings.includeDisclaimer) {
    const disclaimerText = settings.customDisclaimerText || DEFAULT_BENEFICIARY_DISCLAIMER;
    renderDisclaimerSection(ctx, disclaimerText);
  }

  return doc.output('blob');
}

export async function generateBeneficiaryLetterPdfDataUri(
  data: BeneficiaryLetterData,
  settings: BatchSettings
): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const ctx = createContext(doc);

  // Interpolation data
  const interpData = {
    accountOwner: data.accountOwner,
    firmName: data.firmName || settings.firmName,
    assistantName: data.assistantName || settings.assistantName,
    contactEmail: data.contactEmail || settings.contactEmail,
  };

  // 1. Account owner header
  const ownerHeaderText = interpolate(ACCOUNT_OWNER_HEADER.content, interpData);
  addText(ctx, ownerHeaderText, {
    fontSize: PDF_CONFIG.fontSize.header,
    bold: true,
    spacing: { after: 12 },
  });

  // 2. Process each account
  for (const account of data.accounts) {
    const accountInterpData = {
      ...interpData,
      accountType: account.accountType,
      accountNumber: account.accountNumber,
    };

    // Account title
    const titleText = interpolate(ACCOUNT_TITLE.content, accountInterpData);
    addText(ctx, titleText, {
      fontSize: PDF_CONFIG.fontSize.subheader,
      bold: true,
      spacing: { before: 15, after: 10 },
    });

    // Introduction paragraph
    addText(ctx, INTRODUCTION_BLOCK.content, { spacing: { after: 8 } });

    // Change instructions
    const changeText = interpolate(CHANGE_INSTRUCTIONS.content, interpData);
    addText(ctx, changeText, { spacing: { after: 12 } });

    // Primary beneficiaries section
    renderBeneficiarySection(
      ctx,
      account.primaryBeneficiaries,
      account.primaryPerStirpes,
      PRIMARY_BENEFICIARIES_HEADER.content
    );

    // Contingent beneficiaries section
    renderBeneficiarySection(
      ctx,
      account.contingentBeneficiaries,
      account.contingentPerStirpes,
      CONTINGENT_BENEFICIARIES_HEADER.content
    );

    addEmptyLine(ctx, 10);
  }

  // 3. Closing paragraph
  addText(ctx, CLOSING_BLOCK.content, { spacing: { before: 10, after: 15 } });

  // 4. Disclaimer
  if (settings.includeDisclaimer) {
    const disclaimerText = settings.customDisclaimerText || DEFAULT_BENEFICIARY_DISCLAIMER;
    renderDisclaimerSection(ctx, disclaimerText);
  }

  return doc.output('datauristring');
}

// Re-export filename generator for consistency
export { generateBeneficiaryFilename };

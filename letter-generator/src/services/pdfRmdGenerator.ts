import jsPDF from 'jspdf';
import type { BatchSettings, RMDAccount, RMDRecommendation } from '../types';
import {
  ACCOUNT_OWNER_HEADER,
  INTRODUCTION_BLOCK,
  ACCOUNT_TABLE_TITLE,
  IRS_EXPLANATION_BLOCK,
  SUMMARY_LABELS,
  RECOMMENDATIONS_TITLE,
  NEXT_STEPS_BLOCK,
  MANAGED_ACCOUNTS_NOTE,
  RMD_TABLE_HEADERS,
  RECOMMENDATION_TABLE_HEADERS,
  YES_NO,
  DEFAULT_RMD_DISCLAIMER,
  interpolate,
  formatCurrency,
  formatPercentage,
} from '../templates/rmd/contentBlocks';
import { generateRMDFilename, RMDLetterData } from './rmdGenerator';

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
    tableHeader: 9,
    tableCell: 9,
    disclaimer: 8,
    summary: 11,
  },
  lineHeight: 1.4,
  fontFamily: 'helvetica',
};

// RMD table configuration
const RMD_TABLE_CONFIG = {
  columnWidths: [100, 80, 60, 90, 100], // in points
  rowHeight: 18,
  headerBgColor: [232, 232, 232] as [number, number, number],
  borderColor: [204, 204, 204] as [number, number, number],
};

// Recommendation table configuration
const REC_TABLE_CONFIG = {
  columnWidths: [95, 90, 120, 70, 70], // in points
  rowHeight: 18,
  headerBgColor: [232, 232, 232] as [number, number, number],
  borderColor: [204, 204, 204] as [number, number, number],
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

function addEmptyLine(ctx: PDFContext, height: number = 10): void {
  ctx.y += height;
}

function addSummaryLine(
  ctx: PDFContext,
  label: string,
  value: string,
  isHighlight: boolean = false
): void {
  ctx.doc.setFontSize(PDF_CONFIG.fontSize.summary);
  ctx.doc.setFont(PDF_CONFIG.fontFamily, 'bold');
  ctx.doc.setTextColor(0, 0, 0);
  ctx.doc.text(label, ctx.marginLeft, ctx.y);

  const labelWidth = ctx.doc.getTextWidth(label);
  ctx.doc.setFont(PDF_CONFIG.fontFamily, isHighlight ? 'bold' : 'normal');
  if (isHighlight) {
    ctx.doc.setTextColor(204, 0, 0);
  }
  ctx.doc.text(' ' + value, ctx.marginLeft + labelWidth, ctx.y);
  ctx.doc.setTextColor(0, 0, 0);

  ctx.y += PDF_CONFIG.fontSize.summary * PDF_CONFIG.lineHeight + 4;
}

// ==================== TABLE RENDERING ====================

function renderRMDAccountTable(ctx: PDFContext, accounts: RMDAccount[], taxYear: number): void {
  const startX = ctx.marginLeft;
  const { columnWidths, rowHeight, headerBgColor, borderColor } = RMD_TABLE_CONFIG;
  const tableWidth = columnWidths.reduce((sum, w) => sum + w, 0);

  // Check if we have enough space for header + at least 2 rows
  checkPageBreak(ctx, rowHeight * 3);

  // Draw header background
  ctx.doc.setFillColor(...headerBgColor);
  ctx.doc.rect(startX, ctx.y - 4, tableWidth, rowHeight, 'F');

  // Draw header text
  ctx.doc.setFontSize(PDF_CONFIG.fontSize.tableHeader);
  ctx.doc.setFont(PDF_CONFIG.fontFamily, 'bold');
  ctx.doc.setTextColor(0, 0, 0);

  const headers = [
    RMD_TABLE_HEADERS.accountName,
    RMD_TABLE_HEADERS.accountNumber,
    RMD_TABLE_HEADERS.systematic,
    RMD_TABLE_HEADERS.amountRequired,
    interpolate(RMD_TABLE_HEADERS.yearToDateWithdrawals, { taxYear }),
  ];

  let x = startX + 3;
  headers.forEach((header, i) => {
    const truncatedHeader = truncateText(ctx.doc, header, columnWidths[i] - 6);
    ctx.doc.text(truncatedHeader, x, ctx.y + 10);
    x += columnWidths[i];
  });

  ctx.y += rowHeight;

  // Draw header border bottom
  ctx.doc.setDrawColor(...borderColor);
  ctx.doc.setLineWidth(0.5);
  ctx.doc.line(startX, ctx.y - 4, startX + tableWidth, ctx.y - 4);

  // Draw data rows
  ctx.doc.setFont(PDF_CONFIG.fontFamily, 'normal');
  ctx.doc.setFontSize(PDF_CONFIG.fontSize.tableCell);

  accounts.forEach((account) => {
    checkPageBreak(ctx, rowHeight);

    x = startX + 3;
    const values = [
      truncateText(ctx.doc, account.accountName, columnWidths[0] - 6),
      account.accountNumber,
      account.hasSystematic ? YES_NO.yes : YES_NO.no,
      formatCurrency(account.amountRequired),
      formatCurrency(account.yearToDateWithdrawals),
    ];

    values.forEach((value, i) => {
      ctx.doc.text(value, x, ctx.y + 10);
      x += columnWidths[i];
    });

    ctx.y += rowHeight;

    // Draw row border
    ctx.doc.line(startX, ctx.y - 4, startX + tableWidth, ctx.y - 4);
  });

  // Draw table outline
  const tableTop = ctx.y - rowHeight * (accounts.length + 1) - 4;
  ctx.doc.rect(startX, tableTop, tableWidth, rowHeight * (accounts.length + 1));

  // Draw vertical lines
  x = startX;
  columnWidths.forEach((width) => {
    ctx.doc.line(x, tableTop, x, ctx.y - 4);
    x += width;
  });
  ctx.doc.line(x, tableTop, x, ctx.y - 4);

  ctx.y += 10; // Space after table
}

function renderRecommendationTable(ctx: PDFContext, recommendations: RMDRecommendation[]): void {
  const startX = ctx.marginLeft;
  const { columnWidths, rowHeight, headerBgColor, borderColor } = REC_TABLE_CONFIG;
  const tableWidth = columnWidths.reduce((sum, w) => sum + w, 0);

  // Check if we have enough space for header + at least 2 rows
  checkPageBreak(ctx, rowHeight * 3);

  // Draw header background
  ctx.doc.setFillColor(...headerBgColor);
  ctx.doc.rect(startX, ctx.y - 4, tableWidth, rowHeight, 'F');

  // Draw header text
  ctx.doc.setFontSize(PDF_CONFIG.fontSize.tableHeader);
  ctx.doc.setFont(PDF_CONFIG.fontFamily, 'bold');
  ctx.doc.setTextColor(0, 0, 0);

  const headers = [
    RECOMMENDATION_TABLE_HEADERS.accountName,
    RECOMMENDATION_TABLE_HEADERS.suggestedWithdrawal,
    RECOMMENDATION_TABLE_HEADERS.depositLocation,
    RECOMMENDATION_TABLE_HEADERS.federalTax,
    RECOMMENDATION_TABLE_HEADERS.stateTax,
  ];

  let x = startX + 3;
  headers.forEach((header, i) => {
    const truncatedHeader = truncateText(ctx.doc, header, columnWidths[i] - 6);
    ctx.doc.text(truncatedHeader, x, ctx.y + 10);
    x += columnWidths[i];
  });

  ctx.y += rowHeight;

  // Draw header border bottom
  ctx.doc.setDrawColor(...borderColor);
  ctx.doc.setLineWidth(0.5);
  ctx.doc.line(startX, ctx.y - 4, startX + tableWidth, ctx.y - 4);

  // Draw data rows
  ctx.doc.setFont(PDF_CONFIG.fontFamily, 'normal');
  ctx.doc.setFontSize(PDF_CONFIG.fontSize.tableCell);

  recommendations.forEach((rec) => {
    checkPageBreak(ctx, rowHeight);

    x = startX + 3;
    const values = [
      truncateText(ctx.doc, rec.accountName, columnWidths[0] - 6),
      formatCurrency(rec.suggestedWithdrawal),
      truncateText(ctx.doc, rec.depositLocation, columnWidths[2] - 6),
      formatPercentage(rec.federalTax),
      formatPercentage(rec.stateTax),
    ];

    values.forEach((value, i) => {
      ctx.doc.text(value, x, ctx.y + 10);
      x += columnWidths[i];
    });

    ctx.y += rowHeight;

    // Draw row border
    ctx.doc.line(startX, ctx.y - 4, startX + tableWidth, ctx.y - 4);
  });

  // Draw table outline
  const tableTop = ctx.y - rowHeight * (recommendations.length + 1) - 4;
  ctx.doc.rect(startX, tableTop, tableWidth, rowHeight * (recommendations.length + 1));

  // Draw vertical lines
  x = startX;
  columnWidths.forEach((width) => {
    ctx.doc.line(x, tableTop, x, ctx.y - 4);
    x += width;
  });
  ctx.doc.line(x, tableTop, x, ctx.y - 4);

  ctx.y += 10; // Space after table
}

function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) {
    return text;
  }

  let truncated = text;
  while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
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

export async function generateRMDLetterPdf(
  data: RMDLetterData,
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
    taxYear: data.taxYear || settings.taxYear,
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

  // 2. Introduction paragraph
  addText(ctx, INTRODUCTION_BLOCK.content, { spacing: { after: 16 } });

  // 3. Account table title
  const tableTitle = interpolate(ACCOUNT_TABLE_TITLE.content, interpData);
  addText(ctx, tableTitle, {
    fontSize: PDF_CONFIG.fontSize.subheader,
    bold: true,
    spacing: { before: 10, after: 12 },
  });

  // 4. RMD Account table
  renderRMDAccountTable(ctx, data.accounts, interpData.taxYear);
  addEmptyLine(ctx, 10);

  // 5. IRS explanation
  addText(ctx, IRS_EXPLANATION_BLOCK.content, { spacing: { after: 16 } });

  // 6. Summary section
  const totalRMDLabel = interpolate(SUMMARY_LABELS.totalRMDDue, interpData);
  const totalWithdrawalsLabel = interpolate(SUMMARY_LABELS.totalWithdrawals, interpData);
  const remainingRMDLabel = interpolate(SUMMARY_LABELS.remainingRMD, interpData);

  addSummaryLine(ctx, totalRMDLabel, formatCurrency(data.totalRMDDue));
  addSummaryLine(ctx, totalWithdrawalsLabel, formatCurrency(data.totalWithdrawals));
  addSummaryLine(ctx, remainingRMDLabel, formatCurrency(data.remainingRMD), true);
  addEmptyLine(ctx, 10);

  // 7. Recommendations section (only if there are recommendations)
  if (data.recommendations && data.recommendations.length > 0) {
    addText(ctx, RECOMMENDATIONS_TITLE.content, {
      bold: true,
      spacing: { before: 10, after: 10 },
    });
    renderRecommendationTable(ctx, data.recommendations);
    addEmptyLine(ctx, 10);
  }

  // 8. Next steps paragraph
  const nextStepsText = interpolate(NEXT_STEPS_BLOCK.content, interpData);
  addText(ctx, nextStepsText, { spacing: { after: 16 } });

  // 9. Managed accounts footnote
  const footnoteText = interpolate(MANAGED_ACCOUNTS_NOTE.content, interpData);
  addText(ctx, footnoteText, { italic: true, spacing: { after: 12 } });

  // 10. Disclaimer
  if (settings.includeDisclaimer) {
    const disclaimerText = settings.customDisclaimerText || DEFAULT_RMD_DISCLAIMER;
    renderDisclaimerSection(ctx, disclaimerText);
  }

  return doc.output('blob');
}

export async function generateRMDLetterPdfDataUri(
  data: RMDLetterData,
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
    taxYear: data.taxYear || settings.taxYear,
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

  // 2. Introduction paragraph
  addText(ctx, INTRODUCTION_BLOCK.content, { spacing: { after: 16 } });

  // 3. Account table title
  const tableTitle = interpolate(ACCOUNT_TABLE_TITLE.content, interpData);
  addText(ctx, tableTitle, {
    fontSize: PDF_CONFIG.fontSize.subheader,
    bold: true,
    spacing: { before: 10, after: 12 },
  });

  // 4. RMD Account table
  renderRMDAccountTable(ctx, data.accounts, interpData.taxYear);
  addEmptyLine(ctx, 10);

  // 5. IRS explanation
  addText(ctx, IRS_EXPLANATION_BLOCK.content, { spacing: { after: 16 } });

  // 6. Summary section
  const totalRMDLabel = interpolate(SUMMARY_LABELS.totalRMDDue, interpData);
  const totalWithdrawalsLabel = interpolate(SUMMARY_LABELS.totalWithdrawals, interpData);
  const remainingRMDLabel = interpolate(SUMMARY_LABELS.remainingRMD, interpData);

  addSummaryLine(ctx, totalRMDLabel, formatCurrency(data.totalRMDDue));
  addSummaryLine(ctx, totalWithdrawalsLabel, formatCurrency(data.totalWithdrawals));
  addSummaryLine(ctx, remainingRMDLabel, formatCurrency(data.remainingRMD), true);
  addEmptyLine(ctx, 10);

  // 7. Recommendations section (only if there are recommendations)
  if (data.recommendations && data.recommendations.length > 0) {
    addText(ctx, RECOMMENDATIONS_TITLE.content, {
      bold: true,
      spacing: { before: 10, after: 10 },
    });
    renderRecommendationTable(ctx, data.recommendations);
    addEmptyLine(ctx, 10);
  }

  // 8. Next steps paragraph
  const nextStepsText = interpolate(NEXT_STEPS_BLOCK.content, interpData);
  addText(ctx, nextStepsText, { spacing: { after: 16 } });

  // 9. Managed accounts footnote
  const footnoteText = interpolate(MANAGED_ACCOUNTS_NOTE.content, interpData);
  addText(ctx, footnoteText, { italic: true, spacing: { after: 12 } });

  // 10. Disclaimer
  if (settings.includeDisclaimer) {
    const disclaimerText = settings.customDisclaimerText || DEFAULT_RMD_DISCLAIMER;
    renderDisclaimerSection(ctx, disclaimerText);
  }

  return doc.output('datauristring');
}

// Re-export filename generator for consistency
export { generateRMDFilename };

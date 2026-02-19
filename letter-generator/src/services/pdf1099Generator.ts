import jsPDF from 'jspdf';
import type { Report1099Data, BatchSettings, TaxReportAccount } from '../types';
import {
  INTRODUCTION_BLOCK,
  REMINDER_ITEMS,
  REMINDER_HEADER,
  CONTACT_BLOCK,
  TAX_RETURN_REQUEST,
  SCAM_ALERT_TITLE,
  SCAM_ALERT_BLOCK,
  DEFAULT_1099_DISCLAIMER,
  TABLE_HEADERS,
  interpolate,
} from '../templates/report1099/contentBlocks';
import { generate1099Filename } from './report1099Generator';

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
    tableHeader: 10,
    tableCell: 10,
    disclaimer: 8,
  },
  lineHeight: 1.4,
  fontFamily: 'helvetica',
};

// Table configuration
const TABLE_CONFIG = {
  columnWidths: [170, 100, 100, 100], // in points
  rowHeight: 20,
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

// ==================== TABLE RENDERING ====================

function renderAccountTable(ctx: PDFContext, accounts: TaxReportAccount[]): void {
  const startX = ctx.marginLeft;
  const { columnWidths, rowHeight, headerBgColor, borderColor } = TABLE_CONFIG;
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
    TABLE_HEADERS.accountName,
    TABLE_HEADERS.accountNumber,
    TABLE_HEADERS.taxForm,
    TABLE_HEADERS.specialNotes,
  ];

  let x = startX + 4;
  headers.forEach((header, i) => {
    ctx.doc.text(header, x, ctx.y + 10);
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

    x = startX + 4;
    const values = [
      truncateText(ctx.doc, account.accountName, columnWidths[0] - 8),
      account.accountNumber,
      account.taxForm || 'NONE',
      truncateText(ctx.doc, account.specialNotes || 'NONE', columnWidths[3] - 8),
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

// ==================== SCAM ALERT BOX ====================

function renderScamAlertBox(ctx: PDFContext, content: string): void {
  const boxPadding = 10;
  const boxWidth = ctx.contentWidth;
  const borderColor: [number, number, number] = [204, 0, 0]; // Red
  const bgColor: [number, number, number] = [255, 240, 240]; // Light red

  // Calculate box height
  ctx.doc.setFontSize(PDF_CONFIG.fontSize.normal);
  const contentLines = ctx.doc.splitTextToSize(content, boxWidth - boxPadding * 2);
  const titleHeight = PDF_CONFIG.fontSize.normal * PDF_CONFIG.lineHeight;
  const contentHeight = contentLines.length * PDF_CONFIG.fontSize.normal * PDF_CONFIG.lineHeight;
  const totalHeight = titleHeight + contentHeight + boxPadding * 3;

  checkPageBreak(ctx, totalHeight);

  const boxTop = ctx.y;

  // Draw background
  ctx.doc.setFillColor(...bgColor);
  ctx.doc.rect(ctx.marginLeft, boxTop, boxWidth, totalHeight, 'F');

  // Draw border
  ctx.doc.setDrawColor(...borderColor);
  ctx.doc.setLineWidth(2);
  ctx.doc.rect(ctx.marginLeft, boxTop, boxWidth, totalHeight, 'S');

  // Draw title
  ctx.y = boxTop + boxPadding + PDF_CONFIG.fontSize.normal;
  ctx.doc.setFontSize(PDF_CONFIG.fontSize.normal);
  ctx.doc.setFont(PDF_CONFIG.fontFamily, 'bold');
  ctx.doc.setTextColor(...borderColor);
  ctx.doc.text(SCAM_ALERT_TITLE, ctx.marginLeft + boxWidth / 2, ctx.y, { align: 'center' });

  // Draw content
  ctx.y += titleHeight;
  ctx.doc.setFont(PDF_CONFIG.fontFamily, 'normal');
  ctx.doc.setTextColor(0, 0, 0);
  contentLines.forEach((line: string) => {
    ctx.doc.text(line, ctx.marginLeft + boxPadding, ctx.y);
    ctx.y += PDF_CONFIG.fontSize.normal * PDF_CONFIG.lineHeight;
  });

  ctx.y = boxTop + totalHeight + 15; // Space after box
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

export async function generate1099LetterPdf(
  data: Report1099Data,
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
    firmName: data.firmName || settings.firmName,
    taxYear: data.taxYear || settings.taxYear,
    assistantName: data.assistantName || settings.assistantName,
    contactEmail: data.contactEmail || settings.contactEmail,
  };

  // 1. Client header
  addText(ctx, data.client.name, {
    fontSize: PDF_CONFIG.fontSize.header,
    bold: true,
    spacing: { after: 16 },
  });

  // 2. Introduction paragraph
  const introText = interpolate(INTRODUCTION_BLOCK.content, interpData);
  addText(ctx, introText, { spacing: { after: 16 } });

  // 3. Account table
  renderAccountTable(ctx, data.accounts);
  addEmptyLine(ctx, 10);

  // 4. Reminder section
  addText(ctx, REMINDER_HEADER, { bold: true, spacing: { before: 10, after: 8 } });
  REMINDER_ITEMS.forEach((item) => {
    addText(ctx, `• ${item}`, { indent: 18, spacing: { after: 4 } });
  });
  addEmptyLine(ctx, 10);

  // 5. Contact section
  const contactText = interpolate(CONTACT_BLOCK.content, interpData);
  addText(ctx, contactText);

  // 6. Tax return request
  const taxReturnText = interpolate(TAX_RETURN_REQUEST.content, interpData);
  addText(ctx, taxReturnText, { spacing: { after: 20 } });

  // 7. Scam alert box
  renderScamAlertBox(ctx, SCAM_ALERT_BLOCK.content);

  // 8. Disclaimer
  if (settings.includeDisclaimer) {
    const disclaimerText = settings.customDisclaimerText || DEFAULT_1099_DISCLAIMER;
    renderDisclaimerSection(ctx, disclaimerText);
  }

  return doc.output('blob');
}

export async function generate1099LetterPdfDataUri(
  data: Report1099Data,
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
    firmName: data.firmName || settings.firmName,
    taxYear: data.taxYear || settings.taxYear,
    assistantName: data.assistantName || settings.assistantName,
    contactEmail: data.contactEmail || settings.contactEmail,
  };

  // 1. Client header
  addText(ctx, data.client.name, {
    fontSize: PDF_CONFIG.fontSize.header,
    bold: true,
    spacing: { after: 16 },
  });

  // 2. Introduction paragraph
  const introText = interpolate(INTRODUCTION_BLOCK.content, interpData);
  addText(ctx, introText, { spacing: { after: 16 } });

  // 3. Account table
  renderAccountTable(ctx, data.accounts);
  addEmptyLine(ctx, 10);

  // 4. Reminder section
  addText(ctx, REMINDER_HEADER, { bold: true, spacing: { before: 10, after: 8 } });
  REMINDER_ITEMS.forEach((item) => {
    addText(ctx, `• ${item}`, { indent: 18, spacing: { after: 4 } });
  });
  addEmptyLine(ctx, 10);

  // 5. Contact section
  const contactText = interpolate(CONTACT_BLOCK.content, interpData);
  addText(ctx, contactText);

  // 6. Tax return request
  const taxReturnText = interpolate(TAX_RETURN_REQUEST.content, interpData);
  addText(ctx, taxReturnText, { spacing: { after: 20 } });

  // 7. Scam alert box
  renderScamAlertBox(ctx, SCAM_ALERT_BLOCK.content);

  // 8. Disclaimer
  if (settings.includeDisclaimer) {
    const disclaimerText = settings.customDisclaimerText || DEFAULT_1099_DISCLAIMER;
    renderDisclaimerSection(ctx, disclaimerText);
  }

  return doc.output('datauristring');
}

// Re-export filename generator for consistency
export { generate1099Filename };

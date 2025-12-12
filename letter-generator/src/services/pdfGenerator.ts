import jsPDF from 'jspdf';
import type { EngagementLetterData } from '../types';
import { generateLetterSections } from './templateEngine';
import { generateFilename } from './documentGenerator';

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
    heading: 12,
    sectionHeader: 11,
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
    indent?: number;
    spacing?: { before?: number; after?: number };
  } = {}
): void {
  const fontSize = options.fontSize || PDF_CONFIG.fontSize.normal;
  const indent = options.indent || 0;
  const spacingBefore = options.spacing?.before || 0;
  const spacingAfter = options.spacing?.after || 6;

  ctx.y += spacingBefore;

  ctx.doc.setFontSize(fontSize);
  ctx.doc.setFont(PDF_CONFIG.fontFamily, options.bold ? 'bold' : 'normal');

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

// ==================== SECTION RENDERERS ====================

function renderHeaderSection(ctx: PDFContext, content: string): void {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (line.trim() === '') {
      addEmptyLine(ctx, 8);
    } else if (index === 0) {
      // Date
      addText(ctx, line, { spacing: { after: 12 } });
    } else if (line.startsWith('Dear ')) {
      // Salutation
      addText(ctx, line, { spacing: { before: 12, after: 12 } });
    } else {
      // Address lines
      addText(ctx, line, { spacing: { after: 0 } });
    }
  });
}

function renderBodySection(ctx: PDFContext, content: string, isHeader: boolean = false): void {
  if (isHeader) {
    addText(ctx, content.toUpperCase(), {
      fontSize: PDF_CONFIG.fontSize.sectionHeader,
      bold: true,
      spacing: { before: 16, after: 8 },
    });
    return;
  }

  const lines = content.split('\n');

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine === '') {
      addEmptyLine(ctx, 6);
      return;
    }

    // Check for numbered list items
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      addText(ctx, `${numberedMatch[1]}. ${numberedMatch[2]}`, {
        indent: 18,
        spacing: { after: 4 },
      });
      return;
    }

    // Check for bullet points
    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
      const bulletText = trimmedLine.replace(/^[•-]\s*/, '');
      addText(ctx, `• ${bulletText}`, {
        indent: 18,
        spacing: { after: 4 },
      });
      return;
    }

    // Check for sub-items (indented)
    if (line.startsWith('  ') && (trimmedLine.startsWith('-') || trimmedLine.startsWith('•'))) {
      const bulletText = trimmedLine.replace(/^[•-]\s*/, '');
      addText(ctx, `  - ${bulletText}`, {
        indent: 36,
        spacing: { after: 2 },
      });
      return;
    }

    // Regular paragraph
    addText(ctx, trimmedLine);
  });
}

function renderSignatureSection(ctx: PDFContext, content: string): void {
  const lines = content.split('\n');

  lines.forEach((line) => {
    if (line.trim() === '') {
      addEmptyLine(ctx, 8);
    } else if (line === 'Sincerely,') {
      addText(ctx, line, { spacing: { before: 16, after: 36 } }); // Space for signature
    } else {
      addText(ctx, line, { spacing: { after: 0 } });
    }
  });
}

// ==================== MAIN PDF GENERATOR ====================

export async function generateEngagementLetterPdf(data: EngagementLetterData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const ctx = createContext(doc);
  const sections = generateLetterSections(data);

  sections.forEach((section) => {
    if (section.isEmpty) return;

    if (section.id === 'header') {
      renderHeaderSection(ctx, section.content);
    } else if (section.id === 'signature') {
      renderSignatureSection(ctx, section.content);
    } else if (section.id.endsWith('_header')) {
      renderBodySection(ctx, section.content, true);
    } else {
      renderBodySection(ctx, section.content);
    }
  });

  return doc.output('blob');
}

export async function generateEngagementLetterPdfDataUri(data: EngagementLetterData): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const ctx = createContext(doc);
  const sections = generateLetterSections(data);

  sections.forEach((section) => {
    if (section.isEmpty) return;

    if (section.id === 'header') {
      renderHeaderSection(ctx, section.content);
    } else if (section.id === 'signature') {
      renderSignatureSection(ctx, section.content);
    } else if (section.id.endsWith('_header')) {
      renderBodySection(ctx, section.content, true);
    } else {
      renderBodySection(ctx, section.content);
    }
  });

  return doc.output('datauristring');
}

// Re-export filename generator for consistency
export { generateFilename };

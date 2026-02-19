import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
} from 'docx';
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

// ==================== DOCX STYLING CONSTANTS ====================

const FONT_FAMILY = 'Arial';
const FONT_SIZE_NORMAL = 24; // 12pt in half-points
const FONT_SIZE_HEADER = 28; // 14pt in half-points
const FONT_SIZE_DISCLAIMER = 18; // 9pt in half-points
const FONT_SIZE_TABLE = 22; // 11pt in half-points

const PAGE_MARGINS = {
  top: convertInchesToTwip(1),
  right: convertInchesToTwip(1),
  bottom: convertInchesToTwip(1),
  left: convertInchesToTwip(1),
};

// Table column widths (total ~6.5 inches)
const TABLE_WIDTHS = {
  accountName: convertInchesToTwip(2.2),
  accountNumber: convertInchesToTwip(1.3),
  taxForm: convertInchesToTwip(1.5),
  specialNotes: convertInchesToTwip(1.5),
};

const TOTAL_TABLE_WIDTH =
  TABLE_WIDTHS.accountName +
  TABLE_WIDTHS.accountNumber +
  TABLE_WIDTHS.taxForm +
  TABLE_WIDTHS.specialNotes;

// ==================== HELPER FUNCTIONS ====================

function createClientHeader(clientName: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: clientName,
        font: FONT_FAMILY,
        size: FONT_SIZE_HEADER,
        bold: true,
      }),
    ],
    spacing: { after: 300 },
  });
}

function createNormalParagraph(
  text: string,
  options: { spacing?: { before?: number; after?: number } } = {}
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_NORMAL,
      }),
    ],
    spacing: options.spacing || { after: 200 },
  });
}

function createBulletParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_NORMAL,
      }),
    ],
    bullet: {
      level: 0,
    },
    spacing: { after: 100 },
  });
}

function createEmptyParagraph(): Paragraph {
  return new Paragraph({
    children: [],
    spacing: { after: 200 },
  });
}

function createSectionHeader(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_NORMAL,
        bold: true,
      }),
    ],
    spacing: { before: 300, after: 150 },
  });
}

// ==================== TABLE FUNCTIONS ====================

function createTableHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            font: FONT_FAMILY,
            size: FONT_SIZE_TABLE,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
    width: { size: width, type: WidthType.DXA },
    shading: {
      type: ShadingType.CLEAR,
      fill: 'E8E8E8',
    },
    margins: {
      top: convertInchesToTwip(0.05),
      bottom: convertInchesToTwip(0.05),
      left: convertInchesToTwip(0.08),
      right: convertInchesToTwip(0.08),
    },
  });
}

function createTableDataCell(text: string, width: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || '-',
            font: FONT_FAMILY,
            size: FONT_SIZE_TABLE,
          }),
        ],
      }),
    ],
    width: { size: width, type: WidthType.DXA },
    margins: {
      top: convertInchesToTwip(0.05),
      bottom: convertInchesToTwip(0.05),
      left: convertInchesToTwip(0.08),
      right: convertInchesToTwip(0.08),
    },
  });
}

function createAccountTable(accounts: TaxReportAccount[]): Table {
  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      createTableHeaderCell(TABLE_HEADERS.accountName, TABLE_WIDTHS.accountName),
      createTableHeaderCell(TABLE_HEADERS.accountNumber, TABLE_WIDTHS.accountNumber),
      createTableHeaderCell(TABLE_HEADERS.taxForm, TABLE_WIDTHS.taxForm),
      createTableHeaderCell(TABLE_HEADERS.specialNotes, TABLE_WIDTHS.specialNotes),
    ],
  });

  // Data rows
  const dataRows = accounts.map(
    (account) =>
      new TableRow({
        children: [
          createTableDataCell(account.accountName, TABLE_WIDTHS.accountName),
          createTableDataCell(account.accountNumber, TABLE_WIDTHS.accountNumber),
          createTableDataCell(account.taxForm || 'NONE', TABLE_WIDTHS.taxForm),
          createTableDataCell(account.specialNotes || 'NONE', TABLE_WIDTHS.specialNotes),
        ],
      })
  );

  return new Table({
    width: { size: TOTAL_TABLE_WIDTH, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
  });
}

// ==================== SCAM ALERT BOX ====================

function createScamAlertBox(content: string): Paragraph[] {
  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 12,
    color: 'CC0000',
  };

  return [
    // Alert title
    new Paragraph({
      children: [
        new TextRun({
          text: SCAM_ALERT_TITLE,
          font: FONT_FAMILY,
          size: FONT_SIZE_NORMAL,
          bold: true,
          color: 'CC0000',
        }),
      ],
      border: {
        top: borderStyle,
        left: borderStyle,
        right: borderStyle,
      },
      shading: {
        type: ShadingType.CLEAR,
        fill: 'FFF0F0',
      },
      spacing: { before: 300, after: 0 },
      alignment: AlignmentType.CENTER,
    }),
    // Alert content
    new Paragraph({
      children: [
        new TextRun({
          text: content,
          font: FONT_FAMILY,
          size: FONT_SIZE_NORMAL,
        }),
      ],
      border: {
        bottom: borderStyle,
        left: borderStyle,
        right: borderStyle,
      },
      shading: {
        type: ShadingType.CLEAR,
        fill: 'FFF0F0',
      },
      spacing: { after: 300 },
    }),
  ];
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

export async function generate1099LetterDocx(
  data: Report1099Data,
  settings: BatchSettings
): Promise<Blob> {
  const paragraphs: (Paragraph | Table)[] = [];

  // Interpolation data
  const interpData = {
    firmName: data.firmName || settings.firmName,
    taxYear: data.taxYear || settings.taxYear,
    assistantName: data.assistantName || settings.assistantName,
    contactEmail: data.contactEmail || settings.contactEmail,
  };

  // 1. Client header
  paragraphs.push(createClientHeader(data.client.name));

  // 2. Introduction paragraph
  const introText = interpolate(INTRODUCTION_BLOCK.content, interpData);
  paragraphs.push(createNormalParagraph(introText, { spacing: { after: 300 } }));

  // 3. Account table
  paragraphs.push(createAccountTable(data.accounts));
  paragraphs.push(createEmptyParagraph());

  // 4. Reminder section
  paragraphs.push(createSectionHeader(REMINDER_HEADER));
  REMINDER_ITEMS.forEach((item) => {
    paragraphs.push(createBulletParagraph(item));
  });
  paragraphs.push(createEmptyParagraph());

  // 5. Contact section
  const contactText = interpolate(CONTACT_BLOCK.content, interpData);
  paragraphs.push(createNormalParagraph(contactText));

  // 6. Tax return request
  const taxReturnText = interpolate(TAX_RETURN_REQUEST.content, interpData);
  paragraphs.push(createNormalParagraph(taxReturnText));

  // 7. Scam alert box
  paragraphs.push(...createScamAlertBox(SCAM_ALERT_BLOCK.content));

  // 8. Disclaimer
  const disclaimerText = settings.customDisclaimerText || DEFAULT_1099_DISCLAIMER;
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

export async function generate1099LetterBuffer(
  data: Report1099Data,
  settings: BatchSettings
): Promise<Buffer> {
  const paragraphs: (Paragraph | Table)[] = [];

  // Interpolation data
  const interpData = {
    firmName: data.firmName || settings.firmName,
    taxYear: data.taxYear || settings.taxYear,
    assistantName: data.assistantName || settings.assistantName,
    contactEmail: data.contactEmail || settings.contactEmail,
  };

  // 1. Client header
  paragraphs.push(createClientHeader(data.client.name));

  // 2. Introduction paragraph
  const introText = interpolate(INTRODUCTION_BLOCK.content, interpData);
  paragraphs.push(createNormalParagraph(introText, { spacing: { after: 300 } }));

  // 3. Account table
  paragraphs.push(createAccountTable(data.accounts));
  paragraphs.push(createEmptyParagraph());

  // 4. Reminder section
  paragraphs.push(createSectionHeader(REMINDER_HEADER));
  REMINDER_ITEMS.forEach((item) => {
    paragraphs.push(createBulletParagraph(item));
  });
  paragraphs.push(createEmptyParagraph());

  // 5. Contact section
  const contactText = interpolate(CONTACT_BLOCK.content, interpData);
  paragraphs.push(createNormalParagraph(contactText));

  // 6. Tax return request
  const taxReturnText = interpolate(TAX_RETURN_REQUEST.content, interpData);
  paragraphs.push(createNormalParagraph(taxReturnText));

  // 7. Scam alert box
  paragraphs.push(...createScamAlertBox(SCAM_ALERT_BLOCK.content));

  // 8. Disclaimer
  const disclaimerText = settings.customDisclaimerText || DEFAULT_1099_DISCLAIMER;
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

export function generate1099Filename(
  clientName: string,
  taxYear: number,
  extension: 'docx' | 'pdf'
): string {
  // Sanitize client name for filename
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const sanitizedName = sanitize(clientName);

  return `${sanitizedName}_1099_Report_${taxYear}.${extension}`;
}

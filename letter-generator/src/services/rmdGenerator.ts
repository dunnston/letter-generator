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

// ==================== DOCX STYLING CONSTANTS ====================

const FONT_FAMILY = 'Arial';
const FONT_SIZE_NORMAL = 24; // 12pt in half-points
const FONT_SIZE_HEADER = 28; // 14pt in half-points
const FONT_SIZE_SUBHEADER = 26; // 13pt in half-points
const FONT_SIZE_DISCLAIMER = 18; // 9pt in half-points
const FONT_SIZE_TABLE = 20; // 10pt in half-points
const FONT_SIZE_SUMMARY = 24; // 12pt in half-points

const PAGE_MARGINS = {
  top: convertInchesToTwip(1),
  right: convertInchesToTwip(1),
  bottom: convertInchesToTwip(1),
  left: convertInchesToTwip(1),
};

// RMD Account table column widths (total ~6.5 inches)
const RMD_TABLE_WIDTHS = {
  accountName: convertInchesToTwip(1.6),
  accountNumber: convertInchesToTwip(1.2),
  systematic: convertInchesToTwip(0.9),
  amountRequired: convertInchesToTwip(1.3),
  yearToDateWithdrawals: convertInchesToTwip(1.5),
};

const TOTAL_RMD_TABLE_WIDTH =
  RMD_TABLE_WIDTHS.accountName +
  RMD_TABLE_WIDTHS.accountNumber +
  RMD_TABLE_WIDTHS.systematic +
  RMD_TABLE_WIDTHS.amountRequired +
  RMD_TABLE_WIDTHS.yearToDateWithdrawals;

// Recommendation table column widths
const REC_TABLE_WIDTHS = {
  accountName: convertInchesToTwip(1.5),
  suggestedWithdrawal: convertInchesToTwip(1.3),
  depositLocation: convertInchesToTwip(1.7),
  federalTax: convertInchesToTwip(1.0),
  stateTax: convertInchesToTwip(1.0),
};

const TOTAL_REC_TABLE_WIDTH =
  REC_TABLE_WIDTHS.accountName +
  REC_TABLE_WIDTHS.suggestedWithdrawal +
  REC_TABLE_WIDTHS.depositLocation +
  REC_TABLE_WIDTHS.federalTax +
  REC_TABLE_WIDTHS.stateTax;

// ==================== HELPER FUNCTIONS ====================

function createHeaderParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_HEADER,
        bold: true,
      }),
    ],
    spacing: { after: 200 },
  });
}

function createSubHeaderParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_SUBHEADER,
        bold: true,
      }),
    ],
    spacing: { before: 300, after: 200 },
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

function createEmptyParagraph(): Paragraph {
  return new Paragraph({
    children: [],
    spacing: { after: 150 },
  });
}

function createSummaryParagraph(label: string, value: string, isHighlight: boolean = false): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: label,
        font: FONT_FAMILY,
        size: FONT_SIZE_SUMMARY,
        bold: true,
      }),
      new TextRun({
        text: ' ' + value,
        font: FONT_FAMILY,
        size: FONT_SIZE_SUMMARY,
        bold: isHighlight,
        color: isHighlight ? 'CC0000' : undefined,
      }),
    ],
    spacing: { after: 100 },
  });
}

// ==================== TABLE FUNCTIONS ====================

function createTableHeaderCell(text: string, width: number, alignment: typeof AlignmentType.CENTER | typeof AlignmentType.LEFT | typeof AlignmentType.RIGHT = AlignmentType.CENTER): TableCell {
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
        alignment: alignment,
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

function createTableDataCell(
  text: string,
  width: number,
  alignment: typeof AlignmentType.CENTER | typeof AlignmentType.LEFT | typeof AlignmentType.RIGHT = AlignmentType.LEFT
): TableCell {
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
        alignment: alignment,
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

function createRMDAccountTable(accounts: RMDAccount[], taxYear: number): Table {
  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      createTableHeaderCell(RMD_TABLE_HEADERS.accountName, RMD_TABLE_WIDTHS.accountName, AlignmentType.LEFT),
      createTableHeaderCell(RMD_TABLE_HEADERS.accountNumber, RMD_TABLE_WIDTHS.accountNumber),
      createTableHeaderCell(RMD_TABLE_HEADERS.systematic, RMD_TABLE_WIDTHS.systematic),
      createTableHeaderCell(RMD_TABLE_HEADERS.amountRequired, RMD_TABLE_WIDTHS.amountRequired),
      createTableHeaderCell(
        interpolate(RMD_TABLE_HEADERS.yearToDateWithdrawals, { taxYear }),
        RMD_TABLE_WIDTHS.yearToDateWithdrawals
      ),
    ],
  });

  // Data rows
  const dataRows = accounts.map(
    (account) =>
      new TableRow({
        children: [
          createTableDataCell(account.accountName, RMD_TABLE_WIDTHS.accountName),
          createTableDataCell(account.accountNumber, RMD_TABLE_WIDTHS.accountNumber, AlignmentType.CENTER),
          createTableDataCell(
            account.hasSystematic ? YES_NO.yes : YES_NO.no,
            RMD_TABLE_WIDTHS.systematic,
            AlignmentType.CENTER
          ),
          createTableDataCell(formatCurrency(account.amountRequired), RMD_TABLE_WIDTHS.amountRequired, AlignmentType.RIGHT),
          createTableDataCell(
            formatCurrency(account.yearToDateWithdrawals),
            RMD_TABLE_WIDTHS.yearToDateWithdrawals,
            AlignmentType.RIGHT
          ),
        ],
      })
  );

  return new Table({
    width: { size: TOTAL_RMD_TABLE_WIDTH, type: WidthType.DXA },
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

function createRecommendationTable(recommendations: RMDRecommendation[]): Table {
  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      createTableHeaderCell(RECOMMENDATION_TABLE_HEADERS.accountName, REC_TABLE_WIDTHS.accountName, AlignmentType.LEFT),
      createTableHeaderCell(RECOMMENDATION_TABLE_HEADERS.suggestedWithdrawal, REC_TABLE_WIDTHS.suggestedWithdrawal),
      createTableHeaderCell(RECOMMENDATION_TABLE_HEADERS.depositLocation, REC_TABLE_WIDTHS.depositLocation),
      createTableHeaderCell(RECOMMENDATION_TABLE_HEADERS.federalTax, REC_TABLE_WIDTHS.federalTax),
      createTableHeaderCell(RECOMMENDATION_TABLE_HEADERS.stateTax, REC_TABLE_WIDTHS.stateTax),
    ],
  });

  // Data rows
  const dataRows = recommendations.map(
    (rec) =>
      new TableRow({
        children: [
          createTableDataCell(rec.accountName, REC_TABLE_WIDTHS.accountName),
          createTableDataCell(formatCurrency(rec.suggestedWithdrawal), REC_TABLE_WIDTHS.suggestedWithdrawal, AlignmentType.RIGHT),
          createTableDataCell(rec.depositLocation, REC_TABLE_WIDTHS.depositLocation),
          createTableDataCell(formatPercentage(rec.federalTax), REC_TABLE_WIDTHS.federalTax, AlignmentType.CENTER),
          createTableDataCell(formatPercentage(rec.stateTax), REC_TABLE_WIDTHS.stateTax, AlignmentType.CENTER),
        ],
      })
  );

  return new Table({
    width: { size: TOTAL_REC_TABLE_WIDTH, type: WidthType.DXA },
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

export interface RMDLetterData {
  accountOwner: string;
  taxYear: number;
  accounts: RMDAccount[];
  totalRMDDue: number;
  totalWithdrawals: number;
  remainingRMD: number;
  recommendations: RMDRecommendation[];
  firmName: string;
  assistantName: string;
  contactEmail: string;
}

export async function generateRMDLetterDocx(
  data: RMDLetterData,
  settings: BatchSettings
): Promise<Blob> {
  const paragraphs: (Paragraph | Table)[] = [];

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
  paragraphs.push(createHeaderParagraph(ownerHeaderText));

  // 2. Introduction paragraph
  paragraphs.push(createNormalParagraph(INTRODUCTION_BLOCK.content, { spacing: { after: 300 } }));

  // 3. Account table title
  const tableTitle = interpolate(ACCOUNT_TABLE_TITLE.content, interpData);
  paragraphs.push(createSubHeaderParagraph(tableTitle));

  // 4. RMD Account table
  paragraphs.push(createRMDAccountTable(data.accounts, interpData.taxYear));
  paragraphs.push(createEmptyParagraph());

  // 5. IRS explanation
  paragraphs.push(createNormalParagraph(IRS_EXPLANATION_BLOCK.content, { spacing: { after: 300 } }));

  // 6. Summary section
  const totalRMDLabel = interpolate(SUMMARY_LABELS.totalRMDDue, interpData);
  const totalWithdrawalsLabel = interpolate(SUMMARY_LABELS.totalWithdrawals, interpData);
  const remainingRMDLabel = interpolate(SUMMARY_LABELS.remainingRMD, interpData);

  paragraphs.push(createSummaryParagraph(totalRMDLabel, formatCurrency(data.totalRMDDue)));
  paragraphs.push(createSummaryParagraph(totalWithdrawalsLabel, formatCurrency(data.totalWithdrawals)));
  paragraphs.push(createSummaryParagraph(remainingRMDLabel, formatCurrency(data.remainingRMD), true));
  paragraphs.push(createEmptyParagraph());

  // 7. Recommendations section (only if there are recommendations)
  if (data.recommendations && data.recommendations.length > 0) {
    paragraphs.push(createNormalParagraph(RECOMMENDATIONS_TITLE.content, { bold: true, spacing: { after: 200 } }));
    paragraphs.push(createRecommendationTable(data.recommendations));
    paragraphs.push(createEmptyParagraph());
  }

  // 8. Next steps paragraph
  const nextStepsText = interpolate(NEXT_STEPS_BLOCK.content, interpData);
  paragraphs.push(createNormalParagraph(nextStepsText, { spacing: { after: 300 } }));

  // 9. Managed accounts footnote
  const footnoteText = interpolate(MANAGED_ACCOUNTS_NOTE.content, interpData);
  paragraphs.push(createNormalParagraph(footnoteText, { italic: true, spacing: { after: 200 } }));

  // 10. Disclaimer
  const disclaimerText = settings.customDisclaimerText || DEFAULT_RMD_DISCLAIMER;
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

export async function generateRMDLetterBuffer(
  data: RMDLetterData,
  settings: BatchSettings
): Promise<Buffer> {
  const paragraphs: (Paragraph | Table)[] = [];

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
  paragraphs.push(createHeaderParagraph(ownerHeaderText));

  // 2. Introduction paragraph
  paragraphs.push(createNormalParagraph(INTRODUCTION_BLOCK.content, { spacing: { after: 300 } }));

  // 3. Account table title
  const tableTitle = interpolate(ACCOUNT_TABLE_TITLE.content, interpData);
  paragraphs.push(createSubHeaderParagraph(tableTitle));

  // 4. RMD Account table
  paragraphs.push(createRMDAccountTable(data.accounts, interpData.taxYear));
  paragraphs.push(createEmptyParagraph());

  // 5. IRS explanation
  paragraphs.push(createNormalParagraph(IRS_EXPLANATION_BLOCK.content, { spacing: { after: 300 } }));

  // 6. Summary section
  const totalRMDLabel = interpolate(SUMMARY_LABELS.totalRMDDue, interpData);
  const totalWithdrawalsLabel = interpolate(SUMMARY_LABELS.totalWithdrawals, interpData);
  const remainingRMDLabel = interpolate(SUMMARY_LABELS.remainingRMD, interpData);

  paragraphs.push(createSummaryParagraph(totalRMDLabel, formatCurrency(data.totalRMDDue)));
  paragraphs.push(createSummaryParagraph(totalWithdrawalsLabel, formatCurrency(data.totalWithdrawals)));
  paragraphs.push(createSummaryParagraph(remainingRMDLabel, formatCurrency(data.remainingRMD), true));
  paragraphs.push(createEmptyParagraph());

  // 7. Recommendations section (only if there are recommendations)
  if (data.recommendations && data.recommendations.length > 0) {
    paragraphs.push(createNormalParagraph(RECOMMENDATIONS_TITLE.content, { bold: true, spacing: { after: 200 } }));
    paragraphs.push(createRecommendationTable(data.recommendations));
    paragraphs.push(createEmptyParagraph());
  }

  // 8. Next steps paragraph
  const nextStepsText = interpolate(NEXT_STEPS_BLOCK.content, interpData);
  paragraphs.push(createNormalParagraph(nextStepsText, { spacing: { after: 300 } }));

  // 9. Managed accounts footnote
  const footnoteText = interpolate(MANAGED_ACCOUNTS_NOTE.content, interpData);
  paragraphs.push(createNormalParagraph(footnoteText, { italic: true, spacing: { after: 200 } }));

  // 10. Disclaimer
  const disclaimerText = settings.customDisclaimerText || DEFAULT_RMD_DISCLAIMER;
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

export function generateRMDFilename(
  accountOwner: string,
  taxYear: number,
  extension: 'docx' | 'pdf'
): string {
  // Sanitize account owner name for filename
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const sanitizedName = sanitize(accountOwner);

  return `${sanitizedName}_RMD_Strategy_${taxYear}.${extension}`;
}

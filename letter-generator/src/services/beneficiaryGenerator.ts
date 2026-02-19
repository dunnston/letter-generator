import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from 'docx';
import type { BeneficiaryReviewData, BatchSettings, Beneficiary } from '../types';
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

// ==================== DOCX STYLING CONSTANTS ====================

const FONT_FAMILY = 'Arial';
const FONT_SIZE_NORMAL = 24; // 12pt in half-points
const FONT_SIZE_HEADER = 28; // 14pt in half-points
const FONT_SIZE_SUBHEADER = 26; // 13pt in half-points
const FONT_SIZE_DISCLAIMER = 18; // 9pt in half-points
const FONT_SIZE_LABEL = 22; // 11pt in half-points

const PAGE_MARGINS = {
  top: convertInchesToTwip(1),
  right: convertInchesToTwip(1),
  bottom: convertInchesToTwip(1),
  left: convertInchesToTwip(1),
};

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

function createLabelValueParagraph(label: string, value: string, isBold: boolean = false): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: label,
        font: FONT_FAMILY,
        size: FONT_SIZE_LABEL,
        bold: true,
      }),
      new TextRun({
        text: '\t' + value,
        font: FONT_FAMILY,
        size: FONT_SIZE_LABEL,
        bold: isBold,
      }),
    ],
    tabStops: [
      {
        type: 'left' as const,
        position: convertInchesToTwip(2.5),
      },
    ],
    spacing: { after: 80 },
  });
}

function createSectionHeaderParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_NORMAL,
        italics: true,
      }),
    ],
    spacing: { before: 250, after: 150 },
  });
}

// ==================== BENEFICIARY DISPLAY FUNCTIONS ====================

function createBeneficiarySection(
  beneficiaries: Beneficiary[],
  perStirpes: boolean,
  headerText: string
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Section header paragraph
  paragraphs.push(createSectionHeaderParagraph(headerText));

  if (beneficiaries.length === 0) {
    paragraphs.push(createNormalParagraph(NO_BENEFICIARIES_MESSAGE, { italic: true }));
    return paragraphs;
  }

  // Display each beneficiary with label/value format (like sample)
  for (const beneficiary of beneficiaries) {
    paragraphs.push(createLabelValueParagraph(FIELD_LABELS.beneficiaryName, beneficiary.name));
    paragraphs.push(createLabelValueParagraph(FIELD_LABELS.percentage, formatPercentage(beneficiary.percentage)));
    paragraphs.push(createLabelValueParagraph(FIELD_LABELS.dollarAmount, formatCurrency(beneficiary.dollarAmount)));

    // Add small spacing between beneficiaries if there are multiple
    if (beneficiaries.length > 1 && beneficiary !== beneficiaries[beneficiaries.length - 1]) {
      paragraphs.push(createEmptyParagraph());
    }
  }

  // Per stirpes designation (shown once at end of beneficiary section)
  paragraphs.push(createLabelValueParagraph(FIELD_LABELS.perStirpes, perStirpes ? YES_NO.yes : YES_NO.no));

  return paragraphs;
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

export interface BeneficiaryLetterData {
  accountOwner: string;
  accounts: BeneficiaryReviewData[];
  firmName: string;
  assistantName: string;
  contactEmail: string;
}

export async function generateBeneficiaryLetterDocx(
  data: BeneficiaryLetterData,
  settings: BatchSettings
): Promise<Blob> {
  const paragraphs: Paragraph[] = [];

  // Interpolation data
  const interpData = {
    accountOwner: data.accountOwner,
    firmName: data.firmName || settings.firmName,
    assistantName: data.assistantName || settings.assistantName,
    contactEmail: data.contactEmail || settings.contactEmail,
  };

  // 1. Account owner header
  const ownerHeaderText = interpolate(ACCOUNT_OWNER_HEADER.content, interpData);
  paragraphs.push(createHeaderParagraph(ownerHeaderText));

  // 2. Process each account
  for (const account of data.accounts) {
    const accountInterpData = {
      ...interpData,
      accountType: account.accountType,
      accountNumber: account.accountNumber,
    };

    // Account title
    const titleText = interpolate(ACCOUNT_TITLE.content, accountInterpData);
    paragraphs.push(createSubHeaderParagraph(titleText));

    // Introduction paragraph
    paragraphs.push(createNormalParagraph(INTRODUCTION_BLOCK.content));

    // Change instructions
    const changeText = interpolate(CHANGE_INSTRUCTIONS.content, interpData);
    paragraphs.push(createNormalParagraph(changeText, { spacing: { after: 250 } }));

    // Primary beneficiaries section
    paragraphs.push(
      ...createBeneficiarySection(
        account.primaryBeneficiaries,
        account.primaryPerStirpes,
        PRIMARY_BENEFICIARIES_HEADER.content
      )
    );

    // Contingent beneficiaries section
    paragraphs.push(
      ...createBeneficiarySection(
        account.contingentBeneficiaries,
        account.contingentPerStirpes,
        CONTINGENT_BENEFICIARIES_HEADER.content
      )
    );

    paragraphs.push(createEmptyParagraph());
  }

  // 3. Closing paragraph
  paragraphs.push(createNormalParagraph(CLOSING_BLOCK.content, { spacing: { before: 200, after: 300 } }));

  // 4. Disclaimer
  const disclaimerText = settings.customDisclaimerText || DEFAULT_BENEFICIARY_DISCLAIMER;
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

export async function generateBeneficiaryLetterBuffer(
  data: BeneficiaryLetterData,
  settings: BatchSettings
): Promise<Buffer> {
  const paragraphs: Paragraph[] = [];

  // Interpolation data
  const interpData = {
    accountOwner: data.accountOwner,
    firmName: data.firmName || settings.firmName,
    assistantName: data.assistantName || settings.assistantName,
    contactEmail: data.contactEmail || settings.contactEmail,
  };

  // 1. Account owner header
  const ownerHeaderText = interpolate(ACCOUNT_OWNER_HEADER.content, interpData);
  paragraphs.push(createHeaderParagraph(ownerHeaderText));

  // 2. Process each account
  for (const account of data.accounts) {
    const accountInterpData = {
      ...interpData,
      accountType: account.accountType,
      accountNumber: account.accountNumber,
    };

    // Account title
    const titleText = interpolate(ACCOUNT_TITLE.content, accountInterpData);
    paragraphs.push(createSubHeaderParagraph(titleText));

    // Introduction paragraph
    paragraphs.push(createNormalParagraph(INTRODUCTION_BLOCK.content));

    // Change instructions
    const changeText = interpolate(CHANGE_INSTRUCTIONS.content, interpData);
    paragraphs.push(createNormalParagraph(changeText, { spacing: { after: 250 } }));

    // Primary beneficiaries section
    paragraphs.push(
      ...createBeneficiarySection(
        account.primaryBeneficiaries,
        account.primaryPerStirpes,
        PRIMARY_BENEFICIARIES_HEADER.content
      )
    );

    // Contingent beneficiaries section
    paragraphs.push(
      ...createBeneficiarySection(
        account.contingentBeneficiaries,
        account.contingentPerStirpes,
        CONTINGENT_BENEFICIARIES_HEADER.content
      )
    );

    paragraphs.push(createEmptyParagraph());
  }

  // 3. Closing paragraph
  paragraphs.push(createNormalParagraph(CLOSING_BLOCK.content, { spacing: { before: 200, after: 300 } }));

  // 4. Disclaimer
  const disclaimerText = settings.customDisclaimerText || DEFAULT_BENEFICIARY_DISCLAIMER;
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

export function generateBeneficiaryFilename(
  accountOwner: string,
  extension: 'docx' | 'pdf'
): string {
  // Sanitize client name for filename
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const sanitizedName = sanitize(accountOwner);
  const date = new Date().toISOString().split('T')[0];

  return `${sanitizedName}_Beneficiary_Review_${date}.${extension}`;
}

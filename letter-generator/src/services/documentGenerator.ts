import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import type { EngagementLetterData, DisclaimerSettings } from '../types';
import { generateLetterSections } from './templateEngine';

// ==================== DOCX STYLING CONSTANTS ====================

const FONT_FAMILY = 'Arial';
const FONT_SIZE_NORMAL = 24; // 12pt in half-points
const FONT_SIZE_SECTION = 26; // 13pt
const FONT_SIZE_DISCLAIMER = 18; // 9pt in half-points

const PAGE_MARGINS = {
  top: convertInchesToTwip(1),
  right: convertInchesToTwip(1),
  bottom: convertInchesToTwip(1),
  left: convertInchesToTwip(1),
};

// ==================== HELPER FUNCTIONS ====================

/**
 * IMPORTANT: The docx library does NOT support \n in TextRun.
 * Always use separate Paragraph elements for line breaks.
 */

function createHeadingParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_SECTION,
        bold: true,
        allCaps: true,
      }),
    ],
    spacing: { before: 400, after: 200 },
  });
}

function createNormalParagraph(text: string, options: { spacing?: { before?: number; after?: number } } = {}): Paragraph {
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
  // Using proper numbering for bullets - never use Unicode symbols like •
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

function createNumberedParagraph(text: string, level: number = 0): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: FONT_SIZE_NORMAL,
      }),
    ],
    numbering: {
      reference: 'numbered-list',
      level: level,
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

// ==================== SECTION CONVERTERS ====================

function convertHeaderSection(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (line.trim() === '') {
      paragraphs.push(createEmptyParagraph());
    } else if (index === 0) {
      // Date
      paragraphs.push(createNormalParagraph(line));
    } else if (line.startsWith('Dear ')) {
      // Salutation
      paragraphs.push(createNormalParagraph(line, { spacing: { before: 200, after: 200 } }));
    } else {
      // Address lines
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: FONT_FAMILY,
              size: FONT_SIZE_NORMAL,
            }),
          ],
          spacing: { after: 0 },
        })
      );
    }
  });

  return paragraphs;
}

/**
 * Parse text with **bold** markers and return TextRun array
 */
function parseTextWithBold(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  parts.forEach((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text - remove the ** markers
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          font: FONT_FAMILY,
          size: FONT_SIZE_NORMAL,
          bold: true,
        })
      );
    } else if (part) {
      // Regular text
      runs.push(
        new TextRun({
          text: part,
          font: FONT_FAMILY,
          size: FONT_SIZE_NORMAL,
        })
      );
    }
  });

  return runs;
}

function convertBodySection(content: string, isHeader: boolean = false): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (isHeader) {
    paragraphs.push(createHeadingParagraph(content));
    return paragraphs;
  }

  const lines = content.split('\n');

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine === '') {
      paragraphs.push(createEmptyParagraph());
      return;
    }

    // Check for numbered list items (1., 2., etc.)
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      paragraphs.push(createNumberedParagraph(numberedMatch[2]));
      return;
    }

    // Check for bullet points (• or -)
    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
      const bulletText = trimmedLine.replace(/^[•-]\s*/, '');
      paragraphs.push(createBulletParagraph(bulletText));
      return;
    }

    // Check for indented sub-items
    if (line.startsWith('  ') && (trimmedLine.startsWith('-') || trimmedLine.startsWith('•'))) {
      const bulletText = trimmedLine.replace(/^[•-]\s*/, '');
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: bulletText,
              font: FONT_FAMILY,
              size: FONT_SIZE_NORMAL,
            }),
          ],
          bullet: { level: 1 },
          spacing: { after: 50 },
        })
      );
      return;
    }

    // Regular paragraph - check for bold markers
    if (trimmedLine.includes('**')) {
      paragraphs.push(
        new Paragraph({
          children: parseTextWithBold(trimmedLine),
          spacing: { after: 200 },
        })
      );
    } else {
      paragraphs.push(createNormalParagraph(trimmedLine));
    }
  });

  return paragraphs;
}

function convertSignatureSection(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = content.split('\n');

  lines.forEach((line) => {
    if (line.trim() === '') {
      paragraphs.push(createEmptyParagraph());
    } else if (line === 'Sincerely,') {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: FONT_FAMILY,
              size: FONT_SIZE_NORMAL,
            }),
          ],
          spacing: { before: 400, after: 600 }, // Space for signature
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: FONT_FAMILY,
              size: FONT_SIZE_NORMAL,
            }),
          ],
          spacing: { after: 0 },
        })
      );
    }
  });

  return paragraphs;
}

function convertDisclaimerSection(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Add some space before the disclaimer
  paragraphs.push(createEmptyParagraph());

  // Add a horizontal line effect with underscores or just space
  paragraphs.push(
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
    })
  );

  // Split content into paragraphs (in case there are multiple)
  const contentParagraphs = content.split('\n\n');

  contentParagraphs.forEach((para) => {
    if (para.trim()) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para.trim(),
              font: FONT_FAMILY,
              size: FONT_SIZE_DISCLAIMER,
              italics: true,
              color: '666666',
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  });

  return paragraphs;
}

// ==================== MAIN DOCUMENT GENERATOR ====================

export async function generateEngagementLetterDocx(
  data: EngagementLetterData,
  disclaimer?: DisclaimerSettings
): Promise<Blob> {
  const sections = generateLetterSections(data, disclaimer);
  const documentParagraphs: Paragraph[] = [];

  sections.forEach((section) => {
    if (section.isEmpty) return;

    // Handle different section types
    if (section.id === 'header') {
      documentParagraphs.push(...convertHeaderSection(section.content));
    } else if (section.id === 'signature') {
      documentParagraphs.push(...convertSignatureSection(section.content));
    } else if (section.id === 'disclaimer') {
      documentParagraphs.push(...convertDisclaimerSection(section.content));
    } else if (section.id.endsWith('_header')) {
      documentParagraphs.push(...convertBodySection(section.content, true));
    } else {
      documentParagraphs.push(...convertBodySection(section.content));
    }
  });

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'numbered-list',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                },
              },
            },
          ],
        },
      ],
    },
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
        children: documentParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

export async function generateEngagementLetterBuffer(
  data: EngagementLetterData,
  disclaimer?: DisclaimerSettings
): Promise<Buffer> {
  const sections = generateLetterSections(data, disclaimer);
  const documentParagraphs: Paragraph[] = [];

  sections.forEach((section) => {
    if (section.isEmpty) return;

    if (section.id === 'header') {
      documentParagraphs.push(...convertHeaderSection(section.content));
    } else if (section.id === 'signature') {
      documentParagraphs.push(...convertSignatureSection(section.content));
    } else if (section.id === 'disclaimer') {
      documentParagraphs.push(...convertDisclaimerSection(section.content));
    } else if (section.id.endsWith('_header')) {
      documentParagraphs.push(...convertBodySection(section.content, true));
    } else {
      documentParagraphs.push(...convertBodySection(section.content));
    }
  });

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'numbered-list',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                },
              },
            },
          ],
        },
      ],
    },
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
        children: documentParagraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

// ==================== FILENAME GENERATOR ====================

export function generateFilename(data: EngagementLetterData, extension: 'docx' | 'pdf'): string {
  const { client } = data;
  const date = new Date(client.letterDate);
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

  // Sanitize names for filename
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');

  return `${sanitize(client.lastName)}_${sanitize(client.firstName)}_Engagement_${dateStr}.${extension}`;
}

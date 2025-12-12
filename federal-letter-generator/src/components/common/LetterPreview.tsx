import { useMemo } from 'react';
import type { EngagementLetterData } from '../../types';
import { generateLetterSections, type LetterSection } from '../../services/templateEngine';

// ==================== SECTION RENDERER ====================

interface SectionProps {
  section: LetterSection;
  onEditSection?: (sectionId: string) => void;
}

function PreviewSection({ section, onEditSection }: SectionProps) {
  // Format content for display
  const formattedContent = useMemo(() => {
    const lines = section.content.split('\n');

    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      // Empty lines
      if (trimmedLine === '') {
        return <div key={index} className="h-3" />;
      }

      // Numbered list items
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        return (
          <div key={index} className="flex gap-2 ml-4">
            <span className="flex-shrink-0 w-6 text-right">{numberedMatch[1]}.</span>
            <span>{numberedMatch[2]}</span>
          </div>
        );
      }

      // Bullet points
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        const bulletText = trimmedLine.replace(/^[•-]\s*/, '');
        return (
          <div key={index} className="flex gap-2 ml-4">
            <span className="flex-shrink-0">•</span>
            <span>{bulletText}</span>
          </div>
        );
      }

      // Indented sub-items
      if (line.startsWith('  ') && (trimmedLine.startsWith('-') || trimmedLine.startsWith('•'))) {
        const bulletText = trimmedLine.replace(/^[•-]\s*/, '');
        return (
          <div key={index} className="flex gap-2 ml-8">
            <span className="flex-shrink-0">-</span>
            <span className="text-sm text-primary-600">{bulletText}</span>
          </div>
        );
      }

      // Regular text
      return <p key={index}>{line}</p>;
    });
  }, [section.content]);

  // Section header styling
  const isHeader = section.id.endsWith('_header');

  return (
    <div
      className={`group relative ${isHeader ? 'mt-6' : ''}`}
      id={`preview-${section.id}`}
    >
      {/* Edit button (shown on hover) */}
      {onEditSection && !isHeader && (
        <button
          onClick={() => onEditSection(section.id)}
          className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity
                     w-6 h-6 rounded bg-secondary-100 hover:bg-secondary-200
                     flex items-center justify-center text-secondary-600"
          title={`Edit ${section.title}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      )}

      {/* Content */}
      <div
        className={
          isHeader
            ? 'text-sm font-semibold text-primary-800 tracking-wide uppercase border-b border-primary-200 pb-1 mb-2'
            : 'text-sm text-primary-700 leading-relaxed'
        }
      >
        {formattedContent}
      </div>
    </div>
  );
}

// ==================== MAIN LETTER PREVIEW COMPONENT ====================

interface LetterPreviewProps {
  data: EngagementLetterData;
  onEditSection?: (sectionId: string) => void;
  className?: string;
}

export function LetterPreview({ data, onEditSection, className = '' }: LetterPreviewProps) {
  const sections = useMemo(() => generateLetterSections(data), [data]);

  return (
    <div
      className={`bg-white shadow-lg rounded-lg overflow-hidden ${className}`}
      style={{
        // Simulate letter paper proportions
        aspectRatio: '8.5 / 11',
        maxHeight: '100%',
      }}
    >
      <div className="h-full overflow-y-auto p-8 sm:p-12">
        {/* Letter content */}
        <div className="max-w-[600px] mx-auto space-y-4 font-serif">
          {sections
            .filter((s) => !s.isEmpty)
            .map((section) => (
              <PreviewSection
                key={section.id}
                section={section}
                onEditSection={onEditSection}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

// ==================== MINI PREVIEW (FOR THUMBNAILS) ====================

interface MiniPreviewProps {
  data: EngagementLetterData;
  className?: string;
}

export function MiniLetterPreview({ data, className = '' }: MiniPreviewProps) {
  const sections = useMemo(() => generateLetterSections(data), [data]);

  return (
    <div
      className={`bg-white shadow border border-primary-200 rounded overflow-hidden ${className}`}
      style={{
        aspectRatio: '8.5 / 11',
      }}
    >
      <div className="h-full overflow-hidden p-2 scale-50 origin-top-left">
        <div className="space-y-1">
          {sections
            .filter((s) => !s.isEmpty)
            .slice(0, 6) // Only show first few sections
            .map((section) => (
              <div
                key={section.id}
                className={
                  section.id.endsWith('_header')
                    ? 'text-[4px] font-bold text-primary-800 uppercase'
                    : 'text-[3px] text-primary-600 line-clamp-2'
                }
              >
                {section.content.substring(0, 100)}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ==================== SECTION NAVIGATION ====================

interface SectionNavProps {
  data: EngagementLetterData;
  activeSection?: string;
  onSectionClick: (sectionId: string) => void;
}

export function SectionNav({ data, activeSection, onSectionClick }: SectionNavProps) {
  const sections = useMemo(
    () => generateLetterSections(data).filter((s) => !s.isEmpty && !s.id.endsWith('_header')),
    [data]
  );

  return (
    <nav className="space-y-1">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionClick(section.id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
            ${
              activeSection === section.id
                ? 'bg-secondary-100 text-secondary-800 font-medium'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
        >
          {section.title}
          {section.isOptional && (
            <span className="ml-2 text-xs text-primary-400">(optional)</span>
          )}
        </button>
      ))}
    </nav>
  );
}

// ==================== PRINT STYLES ====================

export const printStyles = `
@media print {
  @page {
    size: letter;
    margin: 1in;
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: black;
  }

  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  .letter-preview {
    box-shadow: none;
    border: none;
    padding: 0;
    max-width: none;
    aspect-ratio: auto;
  }
}
`;

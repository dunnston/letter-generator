import type { ReactNode } from 'react';

interface PreviewPaneProps {
  title?: string;
  children: ReactNode;
  className?: string;
  showPrintButton?: boolean;
  onPrint?: () => void;
}

export function PreviewPane({
  title = 'Preview',
  children,
  className = '',
  showPrintButton = false,
  onPrint,
}: PreviewPaneProps) {
  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-sm border border-primary-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary-100">
        <h3 className="text-sm font-medium text-primary-700">{title}</h3>
        {showPrintButton && onPrint && (
          <button
            onClick={onPrint}
            className="text-sm text-secondary-600 hover:text-secondary-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
}

interface LetterPreviewProps {
  date?: string;
  clientName?: string;
  clientAddress?: string[];
  salutation?: string;
  sections: LetterSection[];
  signature?: {
    name: string;
    credentials?: string;
  };
}

interface LetterSection {
  id: string;
  title?: string;
  content: string | string[];
  type?: 'paragraph' | 'bullets' | 'numbered';
}

export function LetterPreview({
  date,
  clientName,
  clientAddress = [],
  salutation,
  sections,
  signature,
}: LetterPreviewProps) {
  return (
    <div className="letter-preview font-serif text-sm leading-relaxed text-primary-800">
      {/* Header */}
      {date && (
        <p className="mb-6">{date}</p>
      )}

      {clientName && (
        <div className="mb-6">
          <p className="font-medium">{clientName}</p>
          {clientAddress.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {salutation && (
        <p className="mb-4">{salutation}</p>
      )}

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.id} className="mb-4">
          {section.title && (
            <p className="font-bold uppercase text-xs tracking-wide mb-2">
              {section.title}
            </p>
          )}
          {renderSectionContent(section)}
        </div>
      ))}

      {/* Signature */}
      {signature && (
        <div className="mt-8">
          <p className="mb-4">Sincerely,</p>
          <p className="font-medium">
            {signature.name}
            {signature.credentials && `, ${signature.credentials}`}
          </p>
        </div>
      )}
    </div>
  );
}

function renderSectionContent(section: LetterSection) {
  const { content, type = 'paragraph' } = section;

  if (typeof content === 'string') {
    return <p>{content}</p>;
  }

  switch (type) {
    case 'bullets':
      return (
        <ul className="list-disc list-inside space-y-1 ml-4">
          {content.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case 'numbered':
      return (
        <ol className="list-decimal list-inside space-y-1 ml-4">
          {content.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    default:
      return (
        <>
          {content.map((item, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {item}
            </p>
          ))}
        </>
      );
  }
}

interface PreviewPlaceholderProps {
  message?: string;
}

export function PreviewPlaceholder({
  message = 'Complete the form to see a preview',
}: PreviewPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <svg
        className="w-16 h-16 text-primary-200 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-sm text-primary-400">{message}</p>
    </div>
  );
}

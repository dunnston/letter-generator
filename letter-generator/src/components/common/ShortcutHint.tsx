import { formatShortcut } from '../../hooks/useKeyboardShortcuts';

interface ShortcutHintProps {
  shortcut: {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  className?: string;
}

export function ShortcutHint({ shortcut, className = '' }: ShortcutHintProps) {
  return (
    <kbd
      className={`
        inline-flex items-center gap-0.5 px-1.5 py-0.5
        text-xs font-mono
        bg-primary-100 text-primary-600
        rounded border border-primary-200
        ${className}
      `}
    >
      {formatShortcut(shortcut)}
    </kbd>
  );
}

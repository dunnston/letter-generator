import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {children}
    </div>
  );
}

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

export function Sidebar({ children, className = '' }: SidebarProps) {
  return (
    <aside
      className={`
        w-64 bg-white border-r border-primary-200
        flex flex-col
        ${className}
      `}
    >
      {children}
    </aside>
  );
}

interface SidebarHeaderProps {
  title: string;
  subtitle?: string;
}

export function SidebarHeader({ title, subtitle }: SidebarHeaderProps) {
  return (
    <div className="p-4 border-b border-primary-100">
      <h1 className="text-lg font-bold text-primary-800">{title}</h1>
      {subtitle && (
        <p className="text-sm text-primary-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

interface SidebarNavProps {
  children: ReactNode;
}

export function SidebarNav({ children }: SidebarNavProps) {
  return (
    <nav className="flex-1 overflow-y-auto p-2">
      {children}
    </nav>
  );
}

interface SidebarNavItemProps {
  icon?: ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function SidebarNavItem({
  icon,
  label,
  isActive = false,
  onClick,
  disabled = false,
}: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg
        text-sm font-medium
        transition-colors duration-150
        ${isActive
          ? 'bg-secondary-50 text-secondary-700'
          : 'text-primary-600 hover:bg-primary-50 hover:text-primary-800'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
      {label}
    </button>
  );
}

interface SidebarFooterProps {
  children: ReactNode;
}

export function SidebarFooter({ children }: SidebarFooterProps) {
  return (
    <div className="p-4 border-t border-primary-100">
      {children}
    </div>
  );
}

interface MainContentProps {
  children: ReactNode;
  className?: string;
}

export function MainContent({ children, className = '' }: MainContentProps) {
  return (
    <main className={`flex-1 overflow-hidden flex flex-col ${className}`}>
      {children}
    </main>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-primary-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary-800">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-primary-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className = '' }: PageContentProps) {
  return (
    <div className={`flex-1 overflow-y-auto p-6 ${className}`}>
      {children}
    </div>
  );
}

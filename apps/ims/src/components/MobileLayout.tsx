import { FC, useState, ReactNode } from 'react';
import { MobileNavigation, MobileBottomNav } from './MobileNavigation';
import { useAuth } from '../contexts/AuthContext';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  showBottomNav?: boolean;
  className?: string;
}

export const MobileLayout: FC<MobileLayoutProps> = ({
  children,
  title,
  showBottomNav = true,
  className = "",
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsNavOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>

          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`${showBottomNav ? 'pb-20' : 'pb-4'} lg:pb-4`}>
        {children}
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
};

// Mobile-optimized card component
export const MobileCard: FC<{
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}> = ({
  children,
  className = '',
  padding = 'md',
  onClick
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const interactiveClasses = onClick ? 'active:bg-gray-50 touch-manipulation' : '';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${paddingClasses[padding]} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
};

// Mobile-optimized button component
export const MobileButton: FC<{
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors touch-manipulation';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-sm min-h-[44px]',
    lg: 'px-6 py-4 text-base min-h-[48px]',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
import { FC } from 'react';
import { UserMenu } from './UserMenu';

interface DashboardHeaderProps {
  selectedPeriod: '7d' | '30d' | '90d' | '1y';
  onPeriodChange: (period: '7d' | '30d' | '90d' | '1y') => void;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
  ] as const;

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of your inventory management system
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Period Selector */}
            <div className="flex rounded-md shadow-sm">
              {periods.map((period, index) => (
                <button
                  key={period.value}
                  onClick={() => onPeriodChange(period.value)}
                  className={`
                    px-4 py-2 text-sm font-medium border
                    ${index === 0 ? 'rounded-l-md' : ''}
                    ${index === periods.length - 1 ? 'rounded-r-md' : ''}
                    ${
                      selectedPeriod === period.value
                        ? 'bg-blue-600 text-white border-blue-600 z-10'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                    ${index > 0 ? '-ml-px' : ''}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  `}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
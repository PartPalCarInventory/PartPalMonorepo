import { FC } from 'react';
import { UserMenu } from './UserMenu';

interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  vehicleId?: string;
  categoryId?: string;
  sellerId?: string;
  reportType?: 'overview' | 'inventory' | 'financial' | 'performance' | 'sales';
}

interface ReportsHeaderProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onExport: () => void;
  activeTab: 'overview' | 'inventory' | 'financial' | 'performance' | 'sales';
  onTabChange: (tab: 'overview' | 'inventory' | 'financial' | 'performance' | 'sales') => void;
}

export const ReportsHeader: FC<ReportsHeaderProps> = ({
  filters,
  onFiltersChange,
  onExport,
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'inventory', name: 'Inventory', icon: '📦' },
    { id: 'financial', name: 'Financial', icon: '💰' },
    { id: 'performance', name: 'Performance', icon: '📈' },
    { id: 'sales', name: 'Sales', icon: '🛒' },
  ];

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive business intelligence and performance insights
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Date Range Filters */}
            <div className="flex items-center space-x-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={onExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};
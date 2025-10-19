import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analytics } from '../utils/analytics';
import { ReportsHeader } from '../components/ReportsHeader';
import { InventoryReport } from '../components/InventoryReport';
import { FinancialReport } from '../components/FinancialReport';
import { PerformanceReport } from '../components/PerformanceReport';
import { SalesReport } from '../components/SalesReport';
import { ExportModal } from '../components/ExportModal';
import { MobileLayout, MobileCard, MobileButton } from '../components/MobileLayout';

interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  vehicleId?: string;
  categoryId?: string;
  sellerId?: string;
  reportType?: 'overview' | 'inventory' | 'financial' | 'performance' | 'sales';
}

const Reports: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    reportType: 'overview',
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'financial' | 'performance' | 'sales'>('overview');

  // Fetch reports data
  const { data: reportsData, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        ),
      });

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports data');
      }
      return response.json();
    },
  });

  useEffect(() => {
    analytics.trackPageView('/reports');
    analytics.trackUserEngagement('reports_view', {
      filters,
      timestamp: new Date().toISOString(),
    });
  }, [filters]);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    analytics.trackUserEngagement('report_export', {
      format,
      reportType: activeTab,
      filters,
    });
    setShowExportModal(false);
    console.log(`Exporting ${activeTab} report as ${format}`);
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setFilters({ ...filters, reportType: tab });
    analytics.trackUserEngagement('report_tab_change', {
      tab,
      timestamp: new Date().toISOString(),
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Reports</h2>
          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
          <button
            onClick={() => refetch()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    switch (activeTab) {
      case 'inventory':
        return <InventoryReport data={reportsData?.inventory} filters={filters} />;
      case 'financial':
        return <FinancialReport data={reportsData?.financial} filters={filters} />;
      case 'performance':
        return <PerformanceReport data={reportsData?.performance} filters={filters} />;
      case 'sales':
        return <SalesReport data={reportsData?.sales} filters={filters} />;
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <InventoryReport data={reportsData?.inventory} filters={filters} compact />
            </div>
            <FinancialReport data={reportsData?.financial} filters={filters} compact />
            <PerformanceReport data={reportsData?.performance} filters={filters} compact />
          </div>
        );
    }
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <ReportsHeader
          filters={filters}
          onFiltersChange={setFilters}
          onExport={() => setShowExportModal(true)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderReportContent()}
        </main>
      </div>

      {/* Mobile Layout */}
      <MobileLayout title="Reports" className="lg:hidden">
        <div className="p-4 space-y-4">
          {/* Mobile Date Range Selector */}
          <MobileCard>
            <h3 className="font-medium text-gray-900 mb-3">Date Range</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </MobileCard>

          {/* Mobile Report Type Selector */}
          <MobileCard>
            <h3 className="font-medium text-gray-900 mb-3">Report Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'overview', label: 'Overview' },
                { value: 'inventory', label: 'Inventory' },
                { value: 'financial', label: 'Financial' },
                { value: 'performance', label: 'Performance' },
                { value: 'sales', label: 'Sales' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTabChange(type.value as any)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === type.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </MobileCard>

          {/* Mobile Export Button */}
          <MobileCard>
            <MobileButton
              onClick={() => setShowExportModal(true)}
              fullWidth
              variant="secondary"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </MobileButton>
          </MobileCard>

          {/* Mobile Report Content */}
          <div className="space-y-4">
            {renderReportContent()}
          </div>
        </div>
      </MobileLayout>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          reportType={activeTab}
        />
      )}
    </>
  );
};

export default Reports;
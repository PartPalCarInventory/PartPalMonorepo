import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from '@partpal/shared-types';
import { analytics } from '../utils/analytics';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatsOverview } from '../components/StatsOverview';
import { RevenueChart } from '../components/RevenueChart';
import { TopSellingParts } from '../components/TopSellingParts';
import { RecentActivity } from '../components/RecentActivity';
import { PartsInventoryChart } from '../components/PartsInventoryChart';
import { MobileLayout, MobileCard } from '../components/MobileLayout';
import Link from 'next/link';

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Fetch dashboard stats
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/stats?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  useEffect(() => {
    // Track dashboard view
    analytics.trackPageView('/dashboard');
    analytics.trackUserEngagement('dashboard_view', {
      period: selectedPeriod,
      timestamp: new Date().toISOString(),
    });
  }, [selectedPeriod]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <DashboardHeader
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Navigation */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/vehicles"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-blue-500"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Vehicle Management</h3>
                    <p className="text-sm text-gray-500">Manage your vehicle inventory</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/parts"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-green-500"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Parts Management</h3>
                    <p className="text-sm text-gray-500">Manage your parts inventory</p>
                  </div>
                </div>
              </Link>

              <div className="block p-6 bg-white rounded-lg shadow border-l-4 border-gray-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-400">Marketplace</h3>
                    <p className="text-sm text-gray-400">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview stats={stats} />

          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
              <RevenueChart period={selectedPeriod} />
            </div>

            {/* Parts Inventory Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Parts Inventory</h3>
              <PartsInventoryChart period={selectedPeriod} />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Top Selling Parts */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Parts</h3>
              <TopSellingParts parts={stats?.topSellingParts || []} />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <RecentActivity activities={stats?.recentActivity || []} />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <MobileLayout title="Dashboard" className="lg:hidden">
        <div className="p-4 space-y-4">
          {/* Period Selector for Mobile */}
          <MobileCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Time Period</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: '7d', label: '7 days' },
                { value: '30d', label: '30 days' },
                { value: '90d', label: '3 months' },
                { value: '1y', label: '1 year' },
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value as any)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedPeriod === period.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </MobileCard>

          {/* Quick Actions */}
          <MobileCard>
            <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/vehicles"
                className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <div className="flex-shrink-0 p-2 bg-blue-600 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-900">Manage Vehicles</h4>
                  <p className="text-sm text-gray-600">{stats?.totalVehicles || 0} vehicles</p>
                </div>
              </Link>

              <Link
                href="/parts"
                className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
              >
                <div className="flex-shrink-0 p-2 bg-green-600 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-900">Manage Parts</h4>
                  <p className="text-sm text-gray-600">{stats?.totalParts || 0} parts</p>
                </div>
              </Link>
            </div>
          </MobileCard>

          {/* Key Metrics */}
          <MobileCard>
            <h3 className="font-medium text-gray-900 mb-3">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.recentSales || 0}</div>
                <div className="text-sm text-gray-600">Recent Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  R{(stats?.monthlyRevenue || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Monthly Revenue</div>
              </div>
            </div>
          </MobileCard>

          {/* Revenue Chart - Mobile Optimized */}
          <MobileCard>
            <h3 className="font-medium text-gray-900 mb-3">Revenue Trends</h3>
            <div className="h-64">
              <RevenueChart period={selectedPeriod} />
            </div>
          </MobileCard>

          {/* Top Selling Parts - Mobile View */}
          <MobileCard>
            <h3 className="font-medium text-gray-900 mb-3">Top Selling Parts</h3>
            <div className="space-y-3">
              {(stats?.topSellingParts || []).slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{item.part.name}</h4>
                      <p className="text-xs text-gray-600">{item.salesCount} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">R{item.part.price.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </MobileCard>

          {/* Recent Activity */}
          <MobileCard>
            <h3 className="font-medium text-gray-900 mb-3">Recent Activity</h3>
            <div className="space-y-3">
              {(stats?.recentActivity || []).slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </MobileCard>
        </div>
      </MobileLayout>
    </>
  );
};

export default Dashboard;
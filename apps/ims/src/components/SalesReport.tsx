import { FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface SalesReportData {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  salesTrend: Array<{
    date: string;
    sales: number;
    revenue: number;
    orders: number;
  }>;
  salesByChannel: Array<{
    channel: string;
    sales: number;
    revenue: number;
    percentage: number;
  }>;
  topSellingParts: Array<{
    partId: string;
    partName: string;
    partNumber: string;
    category: string;
    unitsSold: number;
    revenue: number;
    profit: number;
  }>;
  customerSegments: Array<{
    segment: string;
    customers: number;
    revenue: number;
    averageOrderValue: number;
    frequency: number;
  }>;
  salesFunnel: Array<{
    stage: string;
    count: number;
    conversionRate: number;
  }>;
  geographicSales: Array<{
    region: string;
    sales: number;
    revenue: number;
    growth: number;
  }>;
  salesPerformance: {
    target: number;
    actual: number;
    achievement: number;
    forecast: number;
  };
}

interface SalesReportProps {
  data?: SalesReportData;
  filters: any;
  compact?: boolean;
}

export const SalesReport: FC<SalesReportProps> = ({ data, filters, compact = false }) => {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const channelColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {
                entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('value')
                  ? formatCurrency(entry.value)
                  : entry.value.toLocaleString()
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h3>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.totalSales.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalRevenue)}</div>
            <div className="text-sm text-gray-600">Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(data.averageOrderValue)}</div>
            <div className="text-sm text-gray-600">Avg Order</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{formatPercentage(data.conversionRate)}</div>
            <div className="text-sm text-gray-600">Conversion</div>
          </div>
        </div>

        {/* Sales Trend Mini Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.salesTrend.slice(-7)}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalSales.toLocaleString()}</p>
              <p className="text-sm text-gray-600">parts sold</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(data.totalRevenue)}</p>
              <p className="text-sm text-gray-600">
                Target: {formatPercentage(data.salesPerformance.achievement)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(data.averageOrderValue)}</p>
              <p className="text-sm text-gray-600">per transaction</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPercentage(data.conversionRate)}</p>
              <p className="text-sm text-gray-600">inquiry to sale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales & Revenue Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="sales" orientation="left" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="revenue" orientation="right" stroke="#6b7280" fontSize={12} tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                yAxisId="sales"
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Sales"
              />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales by Channel & Top Selling Parts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Channel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Channel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.salesByChannel}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="sales"
                >
                  {data.salesByChannel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={channelColors[index % channelColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {data.salesByChannel.map((channel, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: channelColors[index % channelColors.length] }}
                  ></div>
                  <span className="text-sm text-gray-700">{channel.channel}</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(channel.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Funnel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Funnel</h3>
          <div className="space-y-4">
            {data.salesFunnel.map((stage, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                    <span className="text-sm text-gray-600">{stage.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${stage.conversionRate}%` }}
                    ></div>
                  </div>
                </div>
                <span className="ml-3 text-sm font-semibold text-blue-600">
                  {formatPercentage(stage.conversionRate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Selling Parts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Parts</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topSellingParts.map((part, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{part.partName}</div>
                    <div className="text-sm text-gray-500">#{part.partNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {part.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {part.unitsSold.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(part.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {formatCurrency(part.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Segments & Geographic Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
          <div className="space-y-4">
            {data.customerSegments.map((segment, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{segment.segment}</h4>
                  <span className="text-sm text-gray-600">{segment.customers} customers</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Revenue: </span>
                    <span className="font-semibold">{formatCurrency(segment.revenue)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">AOV: </span>
                    <span className="font-semibold">{formatCurrency(segment.averageOrderValue)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Purchase Frequency: </span>
                    <span className="font-semibold">{segment.frequency.toFixed(1)}x/month</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Sales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.geographicSales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="region" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {data.geographicSales.map((region, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{region.region}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">{formatCurrency(region.revenue)}</span>
                  <span className={`text-xs ${region.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {region.growth >= 0 ? '+' : ''}{formatPercentage(region.growth)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
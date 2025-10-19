import { FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, BarChart, Bar, Cell } from 'recharts';

interface PerformanceReportData {
  kpis: {
    inventoryTurnover: number;
    averageSaleTime: number;
    customerSatisfaction: number;
    operationalEfficiency: number;
    marketShare: number;
    returnRate: number;
  };
  performanceTrends: Array<{
    date: string;
    efficiency: number;
    quality: number;
    speed: number;
    satisfaction: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    turnoverRate: number;
    profitability: number;
    demand: number;
    avgSaleTime: number;
  }>;
  employeeMetrics: Array<{
    employeeId: string;
    name: string;
    salesCount: number;
    revenue: number;
    efficiency: number;
    customerRating: number;
  }>;
  processingTimes: Array<{
    process: string;
    averageTime: number;
    targetTime: number;
    efficiency: number;
  }>;
  qualityMetrics: {
    defectRate: number;
    returnRate: number;
    customerComplaints: number;
    qualityScore: number;
  };
}

interface PerformanceReportProps {
  data?: PerformanceReportData;
  filters: any;
  compact?: boolean;
}

export const PerformanceReport: FC<PerformanceReportProps> = ({ data, filters, compact = false }) => {
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

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatDays = (value: number) => `${value.toFixed(1)} days`;

  const getKPIColor = (value: number, isReverse = false) => {
    if (isReverse) {
      if (value <= 2) return 'text-green-600';
      if (value <= 5) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getKPIBgColor = (value: number, isReverse = false) => {
    if (isReverse) {
      if (value <= 2) return 'bg-green-100';
      if (value <= 5) return 'bg-yellow-100';
      return 'bg-red-100';
    }
    if (value >= 80) return 'bg-green-100';
    if (value >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>

        {/* Key KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getKPIColor(data.kpis.operationalEfficiency)}`}>
              {formatPercentage(data.kpis.operationalEfficiency)}
            </div>
            <div className="text-sm text-gray-600">Efficiency</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getKPIColor(data.kpis.customerSatisfaction)}`}>
              {formatPercentage(data.kpis.customerSatisfaction)}
            </div>
            <div className="text-sm text-gray-600">Satisfaction</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getKPIColor(data.kpis.averageSaleTime, true)}`}>
              {formatDays(data.kpis.averageSaleTime)}
            </div>
            <div className="text-sm text-gray-600">Sale Time</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getKPIColor(data.kpis.returnRate, true)}`}>
              {formatPercentage(data.kpis.returnRate)}
            </div>
            <div className="text-sm text-gray-600">Return Rate</div>
          </div>
        </div>

        {/* Performance Trend Mini Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.performanceTrends.slice(-7)}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="satisfaction" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  const radialKPIData = [
    { name: 'Efficiency', value: data.kpis.operationalEfficiency, fill: '#10b981' },
    { name: 'Satisfaction', value: data.kpis.customerSatisfaction, fill: '#3b82f6' },
    { name: 'Quality', value: data.qualityMetrics.qualityScore, fill: '#8b5cf6' },
    { name: 'Market Share', value: data.kpis.marketShare, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`rounded-lg shadow p-6 ${getKPIBgColor(data.kpis.operationalEfficiency)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Operational Efficiency</p>
              <p className={`text-3xl font-bold ${getKPIColor(data.kpis.operationalEfficiency)}`}>
                {formatPercentage(data.kpis.operationalEfficiency)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg className={`w-8 h-8 ${getKPIColor(data.kpis.operationalEfficiency)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow p-6 ${getKPIBgColor(data.kpis.customerSatisfaction)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Customer Satisfaction</p>
              <p className={`text-3xl font-bold ${getKPIColor(data.kpis.customerSatisfaction)}`}>
                {formatPercentage(data.kpis.customerSatisfaction)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg className={`w-8 h-8 ${getKPIColor(data.kpis.customerSatisfaction)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow p-6 ${getKPIBgColor(data.kpis.averageSaleTime, true)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Sale Time</p>
              <p className={`text-3xl font-bold ${getKPIColor(data.kpis.averageSaleTime, true)}`}>
                {formatDays(data.kpis.averageSaleTime)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg className={`w-8 h-8 ${getKPIColor(data.kpis.averageSaleTime, true)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends & KPI Radial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trends */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.performanceTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Efficiency"
                />
                <Line
                  type="monotone"
                  dataKey="quality"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Quality"
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Speed"
                />
                <Line
                  type="monotone"
                  dataKey="satisfaction"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Satisfaction"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI Radial Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">KPI Dashboard</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialKPIData}>
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff' }}
                  background
                  dataKey="value"
                />
                <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {radialKPIData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.fill }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Bar dataKey="turnoverRate" fill="#10b981" name="Turnover Rate" />
              <Bar dataKey="profitability" fill="#3b82f6" name="Profitability" />
              <Bar dataKey="demand" fill="#f59e0b" name="Demand" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Processing Times & Quality Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Times */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Times</h3>
          <div className="space-y-4">
            {data.processingTimes.map((process, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{process.process}</span>
                    <span className="text-sm text-gray-600">
                      {process.averageTime}h / {process.targetTime}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        process.efficiency >= 100 ? 'bg-green-500' :
                        process.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, process.efficiency)}%` }}
                    ></div>
                  </div>
                </div>
                <span className={`ml-3 text-sm font-semibold ${
                  process.efficiency >= 100 ? 'text-green-600' :
                  process.efficiency >= 80 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {process.efficiency.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h3>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {data.qualityMetrics.qualityScore}%
              </div>
              <div className="text-sm text-gray-600 mb-4">Overall Quality Score</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full"
                  style={{ width: `${data.qualityMetrics.qualityScore}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className={`text-xl font-bold ${getKPIColor(100 - data.qualityMetrics.defectRate)}`}>
                  {formatPercentage(data.qualityMetrics.defectRate)}
                </div>
                <div className="text-xs text-gray-600">Defect Rate</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${getKPIColor(100 - data.qualityMetrics.returnRate)}`}>
                  {formatPercentage(data.qualityMetrics.returnRate)}
                </div>
                <div className="text-xs text-gray-600">Return Rate</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${getKPIColor(100 - data.qualityMetrics.customerComplaints)}`}>
                  {data.qualityMetrics.customerComplaints}
                </div>
                <div className="text-xs text-gray-600">Complaints</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.employeeMetrics.map((employee, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.salesCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    R{employee.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getKPIColor(employee.efficiency)}`}>
                      {formatPercentage(employee.efficiency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{employee.customerRating.toFixed(1)}</span>
                      <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
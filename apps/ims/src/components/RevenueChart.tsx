import { FC, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface RevenueChartProps {
  period: '7d' | '30d' | '90d' | '1y';
}

interface RevenueData {
  date: string;
  revenue: number;
  sales: number;
}

export const RevenueChart: FC<RevenueChartProps> = ({ period }) => {
  const { data: revenueData, isLoading } = useQuery<RevenueData[]>({
    queryKey: ['revenue-chart', period],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/revenue?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }
      return response.json();
    },
  });

  const chartData = useMemo(() => {
    if (!revenueData) return [];

    return revenueData.map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('en-ZA', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [revenueData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) {
      return `R${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R${(value / 1000).toFixed(0)}K`;
    }
    return `R${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-blue-600">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-green-600">
            Sales: {payload[1]?.value || 0} parts
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v6a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2H11a2 2 0 00-2 2zM13 15V9a2 2 0 012-2h2a2 2 0 012 2v6M17 19v6a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
          </svg>
          <p className="mt-2">No revenue data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-6 text-xs sm:text-sm mb-3">
        <div className="flex items-center justify-center">
          <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
          <span className="text-gray-600">Revenue (ZAR)</span>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-3 h-0.5 bg-green-600 mr-2" style={{ borderStyle: 'dashed' }}></div>
          <span className="text-gray-600">Sales (Parts)</span>
        </div>
      </div>

      <div className="h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 5,
              left: -5,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="formattedDate"
              stroke="#6b7280"
              fontSize={9}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={50}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="revenue"
              orientation="left"
              stroke="#6b7280"
              fontSize={9}
              tickLine={false}
              tickFormatter={formatCurrencyShort}
              width={40}
            />
            <YAxis
              yAxisId="sales"
              orientation="right"
              stroke="#6b7280"
              fontSize={9}
              tickLine={false}
              width={30}
              hide={typeof window !== 'undefined' && window.innerWidth < 640}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#2563eb', strokeWidth: 2 }}
            />
            <Line
              yAxisId="sales"
              type="monotone"
              dataKey="sales"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
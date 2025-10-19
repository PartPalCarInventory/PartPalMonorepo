import { FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface PartsInventoryChartProps {
  period: '7d' | '30d' | '90d' | '1y';
}

interface InventoryData {
  status: string;
  count: number;
  percentage: number;
}

export const PartsInventoryChart: FC<PartsInventoryChartProps> = ({ period }) => {
  const { data: inventoryData, isLoading } = useQuery<InventoryData[]>({
    queryKey: ['inventory-chart', period],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/inventory?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data');
      }
      return response.json();
    },
  });

  const statusColors = {
    'AVAILABLE': '#10b981',     // Green
    'RESERVED': '#f59e0b',      // Amber
    'SOLD': '#6b7280',          // Gray
    'LISTED': '#3b82f6',        // Blue
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'RESERVED':
        return 'Reserved';
      case 'SOLD':
        return 'Sold';
      case 'LISTED':
        return 'Listed on Marketplace';
      default:
        return status;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{formatStatusLabel(label)}</p>
          <p className="text-blue-600">
            Count: {data.count.toLocaleString()} parts
          </p>
          <p className="text-gray-600">
            {data.percentage.toFixed(1)}% of total inventory
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

  if (!inventoryData || inventoryData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="mt-2">No inventory data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3 mb-3">
        {inventoryData.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-1.5 sm:p-2 bg-gray-50 rounded">
            <div className="flex items-center min-w-0">
              <div
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded mr-1.5 sm:mr-2 flex-shrink-0"
                style={{ backgroundColor: statusColors[item.status as keyof typeof statusColors] || '#6b7280' }}
              ></div>
              <span className="text-xs text-gray-700 truncate">{formatStatusLabel(item.status)}</span>
            </div>
            <span className="text-xs font-semibold text-gray-900 ml-1">
              {item.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="h-56 lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={inventoryData}
            margin={{
              top: 5,
              right: 5,
              left: -5,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="status"
              stroke="#6b7280"
              fontSize={9}
              tickLine={false}
              tickFormatter={formatStatusLabel}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={9}
              tickLine={false}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {inventoryData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={statusColors[entry.status as keyof typeof statusColors] || '#6b7280'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
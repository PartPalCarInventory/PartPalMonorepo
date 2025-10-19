import { FC } from 'react';
import { DashboardStats } from '@partpal/shared-types';

interface StatsOverviewProps {
  stats?: DashboardStats;
}

export const StatsOverview: FC<StatsOverviewProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats?.totalVehicles || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      changeType: 'increase' as const,
      changeValue: '+12%',
    },
    {
      title: 'Total Parts',
      value: stats?.totalParts || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      changeType: 'increase' as const,
      changeValue: '+8%',
    },
    {
      title: 'Recent Sales',
      value: stats?.recentSales || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      changeType: 'increase' as const,
      changeValue: '+23%',
    },
    {
      title: 'Monthly Revenue',
      value: stats?.monthlyRevenue || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      changeType: 'increase' as const,
      changeValue: '+18%',
      prefix: 'R',
    },
  ];

  const formatValue = (value: number, prefix?: string) => {
    if (prefix) {
      return `${prefix}${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-md ${card.bgColor}`}>
              <div className={card.color}>
                {card.icon}
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {card.title}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatValue(card.value, card.prefix)}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.changeType === 'increase' ? (
                      <svg className="self-center flex-shrink-0 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="self-center flex-shrink-0 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="sr-only">
                      {card.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                    </span>
                    {card.changeValue}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
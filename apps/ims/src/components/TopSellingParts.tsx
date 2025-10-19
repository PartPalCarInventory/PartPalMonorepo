import { FC } from 'react';
import { Part } from '@partpal/shared-types';

interface TopSellingPartsProps {
  parts: { part: Part; salesCount: number }[];
}

export const TopSellingParts: FC<TopSellingPartsProps> = ({ parts }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCondition = (condition: string) => {
    const conditionMap = {
      'NEW': 'New',
      'EXCELLENT': 'Excellent',
      'GOOD': 'Good',
      'FAIR': 'Fair',
      'POOR': 'Poor',
    };
    return conditionMap[condition as keyof typeof conditionMap] || condition;
  };

  const getConditionColor = (condition: string) => {
    const colorMap = {
      'NEW': 'bg-green-100 text-green-800',
      'EXCELLENT': 'bg-blue-100 text-blue-800',
      'GOOD': 'bg-yellow-100 text-yellow-800',
      'FAIR': 'bg-orange-100 text-orange-800',
      'POOR': 'bg-red-100 text-red-800',
    };
    return colorMap[condition as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  if (!parts || parts.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No sales data</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by listing some parts for sale.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {parts.map((item, index) => (
        <div
          key={item.part.id}
          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {/* Mobile & Tablet Layout */}
          <div className="flex lg:hidden items-start gap-3">
            {/* Rank Badge */}
            <div className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${index === 0 ? 'bg-yellow-400 text-yellow-900' : ''}
              ${index === 1 ? 'bg-gray-300 text-gray-800' : ''}
              ${index === 2 ? 'bg-orange-400 text-orange-900' : ''}
              ${index > 2 ? 'bg-blue-100 text-blue-800' : ''}
            `}>
              {index + 1}
            </div>

            {/* Part Image */}
            <div className="flex-shrink-0">
              {item.part.images && item.part.images.length > 0 ? (
                <img
                  src={item.part.images[0]}
                  alt={item.part.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
            </div>

            {/* Part Details and Sales Info */}
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {item.part.name}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {item.part.partNumber && (
                    <span className="text-xs text-gray-500">
                      #{item.part.partNumber}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getConditionColor(item.part.condition)}`}>
                    {formatCondition(item.part.condition)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Price</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.part.price)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Sold</div>
                  <div className="text-sm font-medium text-gray-900">
                    {item.salesCount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Revenue</div>
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(item.part.price * item.salesCount)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Rank Badge */}
            <div className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${index === 0 ? 'bg-yellow-400 text-yellow-900' : ''}
              ${index === 1 ? 'bg-gray-300 text-gray-800' : ''}
              ${index === 2 ? 'bg-orange-400 text-orange-900' : ''}
              ${index > 2 ? 'bg-blue-100 text-blue-800' : ''}
            `}>
              {index + 1}
            </div>

            {/* Part Image */}
            <div className="flex-shrink-0">
              {item.part.images && item.part.images.length > 0 ? (
                <img
                  src={item.part.images[0]}
                  alt={item.part.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
            </div>

            {/* Part Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {item.part.name}
              </h4>
              <div className="flex items-center gap-2">
                {item.part.partNumber && (
                  <span className="text-xs text-gray-500">
                    #{item.part.partNumber}
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getConditionColor(item.part.condition)}`}>
                  {formatCondition(item.part.condition)}
                </span>
              </div>
            </div>

            {/* Sales Metrics - Desktop Horizontal */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Price</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.part.price)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Sold</div>
                <div className="text-sm font-medium text-gray-900">
                  {item.salesCount}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Revenue</div>
                <div className="text-sm font-semibold text-green-600">
                  {formatCurrency(item.part.price * item.salesCount)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* View All Button */}
      <div className="pt-4 border-t border-gray-200">
        <a
          href="/reports"
          className="block w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded transition-colors"
        >
          View All Sales Reports
        </a>
      </div>
    </div>
  );
};
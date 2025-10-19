import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Part } from '@partpal/shared-types';
import Link from 'next/link';

interface VehiclePartsListProps {
  vehicleId: string;
}

export const VehiclePartsList: FC<VehiclePartsListProps> = ({ vehicleId }) => {
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'price_asc'>('newest');

  // Fetch parts for this vehicle
  const { data: partsData, isLoading, error } = useQuery({
    queryKey: ['vehicle-parts', vehicleId, sortBy],
    queryFn: async () => {
      const response = await fetch(`/api/parts?vehicleId=${vehicleId}&sortBy=${sortBy}&pageSize=100`);
      if (!response.ok) {
        throw new Error('Failed to fetch parts');
      }
      return response.json();
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'AVAILABLE': 'bg-green-100 text-green-800',
      'RESERVED': 'bg-yellow-100 text-yellow-800',
      'SOLD': 'bg-red-100 text-red-800',
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
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

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">Loading parts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading parts</h3>
        <p className="mt-1 text-sm text-gray-500">Please try again later.</p>
      </div>
    );
  }

  const parts = partsData?.parts || [];

  if (parts.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No parts found</h3>
        <p className="mt-1 text-sm text-gray-500">
          This vehicle has no parts in the inventory yet.
        </p>
        <div className="mt-4">
          <Link
            href="/parts"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Parts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with sort */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="text-sm text-gray-700">
          <span className="font-semibold">{parts.length}</span> part{parts.length !== 1 ? 's' : ''} found
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="name">Name A-Z</option>
          <option value="price_asc">Price: Low to High</option>
        </select>
      </div>

      {/* Parts List */}
      <div className="space-y-3">
        {parts.map((part: Part) => (
          <div
            key={part.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {/* Part Image */}
                <div className="flex-shrink-0">
                  {part.images && part.images.length > 0 ? (
                    <img
                      src={part.images[0]}
                      alt={part.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Part Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {part.name}
                  </h4>
                  {part.partNumber && (
                    <p className="text-xs text-gray-500 mb-2">
                      Part #{part.partNumber}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(part.status)}`}>
                      {part.status.toLowerCase()}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getConditionColor(part.condition)}`}>
                      {part.condition.toLowerCase()}
                    </span>
                    {part.isListedOnMarketplace && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        On Marketplace
                      </span>
                    )}
                  </div>
                  {part.location && (
                    <p className="text-xs text-gray-500 mt-2">
                      Location: {part.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Price and Actions */}
              <div className="text-right ml-4 flex-shrink-0">
                <div className="text-lg font-bold text-gray-900 mb-2">
                  {formatCurrency(part.price)}
                </div>
                <Link
                  href={`/parts?id=${part.id}`}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <Link
          href="/parts"
          className="block w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded transition-colors"
        >
          View All Parts
        </Link>
      </div>
    </div>
  );
};

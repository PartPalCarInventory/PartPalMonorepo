import { FC, useState } from 'react';
import { Part } from '@partpal/shared-types';

interface PartsSearchFilters {
  search?: string;
  categoryId?: string;
  vehicleId?: string;
  status?: Part['status'][];
  condition?: Part['condition'][];
  priceMin?: number;
  priceMax?: number;
  isListedOnMarketplace?: boolean;
  sortBy?: 'newest' | 'oldest' | 'name' | 'price_asc' | 'price_desc';
}

interface PartsFiltersProps {
  filters: PartsSearchFilters;
  onFiltersChange: (filters: PartsSearchFilters) => void;
}

export const PartsFilters: FC<PartsFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = [
    { id: 'engine', name: 'Engine Components' },
    { id: 'transmission', name: 'Transmission' },
    { id: 'suspension', name: 'Suspension & Steering' },
    { id: 'brakes', name: 'Brake System' },
    { id: 'electrical', name: 'Electrical Components' },
    { id: 'exterior', name: 'Body & Exterior' },
    { id: 'interior', name: 'Interior Components' },
    { id: 'lighting', name: 'Lighting' },
    { id: 'cooling', name: 'Cooling System' },
    { id: 'exhaust', name: 'Exhaust System' },
  ];

  const statuses: Part['status'][] = ['AVAILABLE', 'RESERVED', 'SOLD'];
  const conditions: Part['condition'][] = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
  ];

  const handleFilterChange = (key: keyof PartsSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: 'newest',
    });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'sortBy' && value !== undefined && value !== '' &&
    (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Parts
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, part number, description..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filters.categoryId || ''}
            onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy || 'newest'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Advanced Toggle */}
        <div className="flex items-end">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
              showAdvanced || activeFilterCount > 0
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Vehicle Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle
              </label>
              <input
                type="text"
                placeholder="Enter vehicle ID or VIN"
                value={filters.vehicleId || ''}
                onChange={(e) => handleFilterChange('vehicleId', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price (ZAR)
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.priceMin || ''}
                onChange={(e) => handleFilterChange('priceMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price (ZAR)
              </label>
              <input
                type="number"
                placeholder="999999"
                value={filters.priceMax || ''}
                onChange={(e) => handleFilterChange('priceMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => {
                const isSelected = filters.status?.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => {
                      const currentStatuses = filters.status || [];
                      const newStatuses = isSelected
                        ? currentStatuses.filter((s) => s !== status)
                        : [...currentStatuses, status];
                      handleFilterChange('status', newStatuses.length > 0 ? newStatuses : undefined);
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition Filters */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition) => {
                const isSelected = filters.condition?.includes(condition);
                return (
                  <button
                    key={condition}
                    onClick={() => {
                      const currentConditions = filters.condition || [];
                      const newConditions = isSelected
                        ? currentConditions.filter((c) => c !== condition)
                        : [...currentConditions, condition];
                      handleFilterChange('condition', newConditions.length > 0 ? newConditions : undefined);
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {condition.charAt(0) + condition.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Marketplace Toggle */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isListedOnMarketplace || false}
                onChange={(e) => handleFilterChange('isListedOnMarketplace', e.target.checked || undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Only show parts listed on marketplace
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
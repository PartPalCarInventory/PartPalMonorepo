import { FC, useState } from 'react';
import { Vehicle } from '@partpal/shared-types';

interface VehicleSearchFilters {
  search?: string;
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  condition?: Vehicle['condition'][];
  sortBy?: 'newest' | 'oldest' | 'make' | 'model' | 'year';
}

interface VehicleFiltersProps {
  filters: VehicleSearchFilters;
  onFiltersChange: (filters: VehicleSearchFilters) => void;
}

export const VehicleFilters: FC<VehicleFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const makes = [
    'Audi', 'BMW', 'Chevrolet', 'Ford', 'Honda', 'Hyundai', 'Kia',
    'Mercedes-Benz', 'Nissan', 'Toyota', 'Volkswagen', 'Volvo'
  ];

  const conditions: Vehicle['condition'][] = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'make', label: 'Make A-Z' },
    { value: 'model', label: 'Model A-Z' },
    { value: 'year', label: 'Year' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const handleFilterChange = (key: keyof VehicleSearchFilters, value: any) => {
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Vehicles
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by VIN, make, model..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Make */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make
              </label>
              <select
                value={filters.make || ''}
                onChange={(e) => handleFilterChange('make', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Makes</option>
                {makes.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                placeholder="Enter model"
                value={filters.model || ''}
                onChange={(e) => handleFilterChange('model', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Year From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year From
              </label>
              <select
                value={filters.yearFrom || ''}
                onChange={(e) => handleFilterChange('yearFrom', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Year To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year To
              </label>
              <select
                value={filters.yearTo || ''}
                onChange={(e) => handleFilterChange('yearTo', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
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

          {/* Condition Filters */}
          <div className="mt-4">
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {condition.charAt(0) + condition.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Vehicle } from '@partpal/shared-types';
import { analytics } from '../utils/analytics';
import { VehicleHeader } from '../components/VehicleHeader';
import { VehicleList } from '../components/VehicleList';
import { VehicleFilters } from '../components/VehicleFilters';
import { VehicleModal } from '../components/VehicleModal';
import { MobileLayout, MobileCard, MobileButton } from '../components/MobileLayout';

interface VehicleSearchFilters {
  search?: string;
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  condition?: Vehicle['condition'][];
  sortBy?: 'newest' | 'oldest' | 'make' | 'model' | 'year';
}

const Vehicles: React.FC = () => {
  const [filters, setFilters] = useState<VehicleSearchFilters>({
    sortBy: 'newest',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch vehicles with filters
  const { data: vehiclesData, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicles', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        ),
      });

      const response = await fetch(`/api/vehicles?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      return response.json();
    },
  });

  useEffect(() => {
    analytics.trackPageView('/vehicles');
    analytics.trackUserEngagement('vehicle_management_view', {
      filters,
      timestamp: new Date().toISOString(),
    });
  }, [filters]);

  const handleAddVehicle = () => {
    setShowAddModal(true);
    analytics.trackUserEngagement('vehicle_add_initiated');
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    analytics.trackUserEngagement('vehicle_view', {
      vehicleId: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
    });
  };

  const handleVehicleSaved = () => {
    refetch();
    setShowAddModal(false);
    setSelectedVehicle(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Vehicles</h2>
          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
          <button
            onClick={() => refetch()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <VehicleHeader
          totalVehicles={vehiclesData?.totalCount || 0}
          onAddVehicle={handleAddVehicle}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="mb-6">
            <VehicleFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Vehicle List */}
          <VehicleList
            vehicles={vehiclesData?.vehicles || []}
            isLoading={isLoading}
            onVehicleSelect={handleVehicleSelect}
            page={page}
            totalPages={vehiclesData?.totalPages || 1}
            onPageChange={setPage}
          />
        </main>
      </div>

      {/* Mobile Layout */}
      <MobileLayout title="Vehicles" className="lg:hidden">
        <div className="p-4 space-y-4">
          {/* Mobile Summary */}
          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Vehicle Inventory</h3>
                <p className="text-sm text-gray-600">{vehiclesData?.totalCount || 0} vehicles total</p>
              </div>
              <MobileButton onClick={handleAddVehicle} size="sm">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add
              </MobileButton>
            </div>
          </MobileCard>

          {/* Mobile Search */}
          <MobileCard>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search vehicles..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex space-x-2">
                <select
                  value={filters.make || ''}
                  onChange={(e) => setFilters({ ...filters, make: e.target.value || undefined })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Makes</option>
                  <option value="BMW">BMW</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Honda">Honda</option>
                </select>
                <select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="make">Make</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </div>
          </MobileCard>

          {/* Mobile Vehicle List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <MobileCard key={i}>
                  <div className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </MobileCard>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(vehiclesData?.vehicles || []).map((vehicle: Vehicle) => (
                <MobileCard key={vehicle.id} className="cursor-pointer" onClick={() => handleVehicleSelect(vehicle)}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <img
                          src={vehicle.images[0]}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      {vehicle.variant && (
                        <p className="text-sm text-gray-600">{vehicle.variant}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          vehicle.condition === 'EXCELLENT' ? 'bg-green-100 text-green-800' :
                          vehicle.condition === 'GOOD' ? 'bg-yellow-100 text-yellow-800' :
                          vehicle.condition === 'FAIR' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.condition.toLowerCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {vehicle.totalParts || 0} parts
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </MobileCard>
              ))}
            </div>
          )}

          {/* Mobile Pagination */}
          {(vehiclesData?.totalPages || 1) > 1 && (
            <MobileCard>
              <div className="flex items-center justify-between">
                <MobileButton
                  variant="secondary"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </MobileButton>
                <span className="text-sm text-gray-600">
                  Page {page} of {vehiclesData?.totalPages || 1}
                </span>
                <MobileButton
                  variant="secondary"
                  onClick={() => setPage(Math.min(vehiclesData?.totalPages || 1, page + 1))}
                  disabled={page === (vehiclesData?.totalPages || 1)}
                >
                  Next
                </MobileButton>
              </div>
            </MobileCard>
          )}
        </div>
      </MobileLayout>

      {/* Add/Edit Vehicle Modal */}
      {showAddModal && (
        <VehicleModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleVehicleSaved}
        />
      )}

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <VehicleModal
          isOpen={!!selectedVehicle}
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onSave={handleVehicleSaved}
        />
      )}
    </>
  );
};

export default Vehicles;
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Part } from '@partpal/shared-types';
import { analytics } from '../utils/analytics';
import { PartsHeader } from '../components/PartsHeader';
import { PartsList } from '../components/PartsList';
import { PartsFilters } from '../components/PartsFilters';
import { PartModal } from '../components/PartModal';
import { PartDetailsModal } from '../components/PartDetailsModal';
import { MobileLayout, MobileCard, MobileButton } from '../components/MobileLayout';

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

const Parts: React.FC = () => {
  const [filters, setFilters] = useState<PartsSearchFilters>({
    sortBy: 'newest',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 24;

  // Fetch parts with filters
  const { data: partsData, isLoading, error, refetch } = useQuery({
    queryKey: ['parts', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        ),
      });

      const response = await fetch(`/api/parts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch parts');
      }
      return response.json();
    },
  });

  useEffect(() => {
    analytics.trackPageView('/parts');
    analytics.trackUserEngagement('parts_inventory_view', {
      filters,
      timestamp: new Date().toISOString(),
    });
  }, [filters]);

  const handleAddPart = () => {
    setShowAddModal(true);
    analytics.trackUserEngagement('part_add_initiated');
  };

  const handlePartSelect = (part: Part) => {
    setSelectedPart(part);
    analytics.trackUserEngagement('part_view', {
      partId: part.id,
      partName: part.name,
      vehicleId: part.vehicleId,
    });
  };

  const handlePartSaved = () => {
    refetch();
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedPart(null);
    setEditingPart(null);
  };

  const handleEdit = () => {
    if (selectedPart) {
      setEditingPart(selectedPart);
      setShowEditModal(true);
      setSelectedPart(null);
      analytics.trackUserEngagement('part_edit_initiated', {
        partId: selectedPart.id,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPart) return;

    try {
      const response = await fetch(`/api/parts/${selectedPart.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete part');
      }

      analytics.trackUserEngagement('part_deleted', {
        partId: selectedPart.id,
        partName: selectedPart.name,
      });

      setSelectedPart(null);
      refetch();
    } catch (error) {
      console.error('Error deleting part:', error);
      alert('Failed to delete part. Please try again.');
    }
  };

  const handleToggleMarketplace = async () => {
    if (!selectedPart) return;

    try {
      const response = await fetch(`/api/parts/${selectedPart.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedPart,
          isListedOnMarketplace: !selectedPart.isListedOnMarketplace,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update marketplace status');
      }

      const updatedPart = await response.json();
      setSelectedPart(updatedPart);
      refetch();
    } catch (error) {
      console.error('Error toggling marketplace status:', error);
      alert('Failed to update marketplace status. Please try again.');
    }
  };

  const handleStatusChange = async (newStatus: Part['status']) => {
    if (!selectedPart) return;

    try {
      const response = await fetch(`/api/parts/${selectedPart.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedPart,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update part status');
      }

      const updatedPart = await response.json();
      setSelectedPart(updatedPart);
      refetch();
    } catch (error) {
      console.error('Error updating part status:', error);
      alert('Failed to update part status. Please try again.');
    }
  };

  const handleBulkAction = (action: string, partIds: string[]) => {
    analytics.trackUserEngagement('parts_bulk_action', {
      action,
      partCount: partIds.length,
    });
    // Implement bulk actions (reserve, publish to marketplace, etc.)
    console.log(`Bulk action: ${action} on parts:`, partIds);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Parts</h2>
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
        <PartsHeader
          totalParts={partsData?.totalCount || 0}
          onAddPart={handleAddPart}
          onBulkAction={handleBulkAction}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="mb-6">
            <PartsFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Parts List */}
          <PartsList
            parts={partsData?.parts || []}
            isLoading={isLoading}
            onPartSelect={handlePartSelect}
            onBulkAction={handleBulkAction}
            page={page}
            totalPages={partsData?.totalPages || 1}
            onPageChange={setPage}
          />
        </main>
      </div>

      {/* Mobile Layout */}
      <MobileLayout title="Parts" className="lg:hidden">
        <div className="p-4 space-y-4">
          {/* Mobile Summary */}
          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Parts Inventory</h3>
                <p className="text-sm text-gray-600">{partsData?.totalCount || 0} parts total</p>
              </div>
              <MobileButton onClick={handleAddPart} size="sm">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add
              </MobileButton>
            </div>
          </MobileCard>

          {/* Mobile Search & Filters */}
          <MobileCard>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search parts..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.categoryId || ''}
                  onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="engine">Engine</option>
                  <option value="transmission">Transmission</option>
                  <option value="brakes">Brakes</option>
                  <option value="electrical">Electrical</option>
                  <option value="exterior">Exterior</option>
                  <option value="interior">Interior</option>
                </select>
                <select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </MobileCard>

          {/* Mobile Parts List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <MobileCard key={i}>
                  <div className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </MobileCard>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(partsData?.parts || []).map((part: Part) => (
                <MobileCard key={part.id} className="cursor-pointer" onClick={() => handlePartSelect(part)}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {part.images && part.images.length > 0 ? (
                        <img
                          src={part.images[0]}
                          alt={part.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{part.name}</h3>
                          {part.partNumber && (
                            <p className="text-sm text-gray-600">#{part.partNumber}</p>
                          )}
                        </div>
                        <div className="text-right ml-2">
                          <div className="font-semibold text-gray-900">
                            R{part.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            part.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                            part.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {part.status.toLowerCase()}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            part.condition === 'NEW' ? 'bg-green-100 text-green-800' :
                            part.condition === 'EXCELLENT' ? 'bg-blue-100 text-blue-800' :
                            part.condition === 'GOOD' ? 'bg-yellow-100 text-yellow-800' :
                            part.condition === 'FAIR' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {part.condition.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {part.isListedOnMarketplace && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" title="Listed on marketplace"></div>
                          )}
                          <span className="text-xs text-gray-500">{part.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </MobileCard>
              ))}
            </div>
          )}

          {/* Mobile Pagination */}
          {(partsData?.totalPages || 1) > 1 && (
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
                  Page {page} of {partsData?.totalPages || 1}
                </span>
                <MobileButton
                  variant="secondary"
                  onClick={() => setPage(Math.min(partsData?.totalPages || 1, page + 1))}
                  disabled={page === (partsData?.totalPages || 1)}
                >
                  Next
                </MobileButton>
              </div>
            </MobileCard>
          )}
        </div>
      </MobileLayout>

      {/* Add Part Modal */}
      {showAddModal && (
        <PartModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handlePartSaved}
        />
      )}

      {/* Edit Part Modal */}
      {showEditModal && editingPart && (
        <PartModal
          isOpen={showEditModal}
          part={editingPart}
          onClose={() => {
            setShowEditModal(false);
            setEditingPart(null);
          }}
          onSave={handlePartSaved}
        />
      )}

      {/* Part Details Modal */}
      {selectedPart && (
        <PartDetailsModal
          isOpen={!!selectedPart}
          part={selectedPart}
          onClose={() => setSelectedPart(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleMarketplace={handleToggleMarketplace}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
};

export default Parts;
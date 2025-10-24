import { FC, useState } from 'react';
import { Part } from '@partpal/shared-types';
import { analytics } from '../utils/analytics';

interface PartDetailsModalProps {
  part: Part;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleMarketplace: () => void;
  onStatusChange: (status: Part['status']) => void;
}

export const PartDetailsModal: FC<PartDetailsModalProps> = ({
  part,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleMarketplace,
  onStatusChange,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  const handleMarketplaceToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggleMarketplace();
      analytics.trackUserEngagement('part_marketplace_toggle', {
        partId: part.id,
        newState: !part.isListedOnMarketplace,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: Part['status']) => {
    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
      analytics.trackUserEngagement('part_status_change', {
        partId: part.id,
        oldStatus: part.status,
        newStatus,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-2xl leading-6 font-bold text-gray-900">
                  {part.name}
                </h3>
                {part.partNumber && (
                  <p className="mt-1 text-sm text-gray-500">
                    Part Number: {part.partNumber}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onClose}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onEdit}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>

              <button
                onClick={handleMarketplaceToggle}
                disabled={isUpdating}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md ${
                  part.isListedOnMarketplace
                    ? 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                    : 'text-white bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
                {part.isListedOnMarketplace ? 'Remove from Marketplace' : 'Publish to Marketplace'}
              </button>

              <div className="flex-1"></div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-700">
                    Are you sure you want to delete this part? This action cannot be undone.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-white px-4 py-5 sm:px-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Price and Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="text-3xl font-bold text-gray-900">{formatCurrency(part.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <select
                        value={part.status}
                        onChange={(e) => handleStatusChange(e.target.value as Part['status'])}
                        disabled={isUpdating}
                        className="text-sm font-medium border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="RESERVED">Reserved</option>
                        <option value="SOLD">Sold</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Condition</p>
                      <p className="font-medium text-gray-900">{part.condition}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{part.location}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700">{part.description}</p>
                </div>

                {/* Additional Details */}
                {(part.weight || part.warranty || part.dimensions) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Specifications</h4>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {part.weight && (
                        <>
                          <dt className="text-gray-500">Weight</dt>
                          <dd className="text-gray-900">{part.weight} kg</dd>
                        </>
                      )}
                      {part.warranty && (
                        <>
                          <dt className="text-gray-500">Warranty</dt>
                          <dd className="text-gray-900">{part.warranty} months</dd>
                        </>
                      )}
                      {part.dimensions && (
                        <>
                          <dt className="text-gray-500">Dimensions</dt>
                          <dd className="text-gray-900">
                            {part.dimensions.length} × {part.dimensions.width} × {part.dimensions.height} cm
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                )}

                {/* Installation Notes */}
                {part.installationNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Installation Notes</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{part.installationNotes}</p>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Images */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Images</h4>
                  {part.images && part.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {part.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${part.name} - ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Marketplace Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">Marketplace</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {part.isListedOnMarketplace
                          ? 'This part is currently listed on the marketplace'
                          : 'This part is not listed on the marketplace'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Part ID</dt>
                      <dd className="text-gray-900 font-mono">{part.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Category</dt>
                      <dd className="text-gray-900">{part.categoryId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Created</dt>
                      <dd className="text-gray-900">{new Date(part.createdAt).toLocaleDateString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Last Updated</dt>
                      <dd className="text-gray-900">{new Date(part.updatedAt).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

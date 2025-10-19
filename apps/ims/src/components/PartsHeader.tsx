import { FC, useState } from 'react';
import { UserMenu } from './UserMenu';

interface PartsHeaderProps {
  totalParts: number;
  onAddPart: () => void;
  onBulkAction: (action: string, partIds: string[]) => void;
}

export const PartsHeader: FC<PartsHeaderProps> = ({
  totalParts,
  onAddPart,
  onBulkAction,
}) => {
  const [showBulkActions, setShowBulkActions] = useState(false);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parts Inventory</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your parts inventory and marketplace listings
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {totalParts.toLocaleString()} parts in inventory
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Bulk Actions Toggle */}
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className={`btn-secondary ${showBulkActions ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bulk Actions
            </button>

            {/* Export Button */}
            <button
              onClick={() => window.print()}
              className="btn-secondary"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            {/* Add Part Button */}
            <button
              onClick={onAddPart}
              className="btn-primary"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Part
            </button>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="border-t border-gray-200 pt-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">{totalParts}</div>
              <div className="text-sm text-gray-500">Total Parts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">Available</div>
              <div className="text-sm text-gray-500">Ready to Sell</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-yellow-600">Reserved</div>
              <div className="text-sm text-gray-500">Customer Hold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">Listed</div>
              <div className="text-sm text-gray-500">On Marketplace</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-600">Sold</div>
              <div className="text-sm text-gray-500">Completed Sales</div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Select parts to perform bulk actions
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => onBulkAction('reserve', [])}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                >
                  Reserve Selected
                </button>
                <button
                  onClick={() => onBulkAction('publish', [])}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  Publish to Marketplace
                </button>
                <button
                  onClick={() => onBulkAction('updatePrice', [])}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
                >
                  Update Prices
                </button>
                <button
                  onClick={() => onBulkAction('delete', [])}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
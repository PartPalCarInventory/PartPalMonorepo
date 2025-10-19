import { FC } from 'react';
import { UserMenu } from './UserMenu';

interface VehicleHeaderProps {
  totalVehicles: number;
  onAddVehicle: () => void;
}

export const VehicleHeader: FC<VehicleHeaderProps> = ({
  totalVehicles,
  onAddVehicle,
}) => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Inventory</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your vehicle inventory and parts breakdown
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {totalVehicles.toLocaleString()} vehicles in inventory
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <button
              onClick={() => window.print()}
              className="btn-secondary"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Export
            </button>

            {/* Add Vehicle Button */}
            <button
              onClick={onAddVehicle}
              className="btn-primary"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Vehicle
            </button>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="border-t border-gray-200 pt-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">{totalVehicles}</div>
              <div className="text-sm text-gray-500">Total Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">Active</div>
              <div className="text-sm text-gray-500">Being Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">Parts</div>
              <div className="text-sm text-gray-500">Being Extracted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-orange-600">Complete</div>
              <div className="text-sm text-gray-500">Fully Processed</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
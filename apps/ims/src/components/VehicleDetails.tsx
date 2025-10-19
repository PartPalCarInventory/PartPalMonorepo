import { FC } from 'react';
import { Vehicle } from '@partpal/shared-types';
import { formatDistanceToNow } from 'date-fns';

interface VehicleDetailsProps {
  vehicle: Vehicle;
}

export const VehicleDetails: FC<VehicleDetailsProps> = ({ vehicle }) => {
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

  const formatCondition = (condition: string) => {
    return condition.charAt(0) + condition.slice(1).toLowerCase();
  };

  const detailItems = [
    { label: 'VIN', value: vehicle.vin },
    { label: 'Year', value: vehicle.year },
    { label: 'Make', value: vehicle.make },
    { label: 'Model', value: vehicle.model },
    { label: 'Variant', value: vehicle.variant || 'N/A' },
    { label: 'Engine Size', value: vehicle.engineSize || 'N/A' },
    { label: 'Fuel Type', value: vehicle.fuelType || 'N/A' },
    { label: 'Transmission', value: vehicle.transmission || 'N/A' },
    { label: 'Color', value: vehicle.color || 'N/A' },
    { label: 'Mileage', value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A' },
    { label: 'Yard Location', value: vehicle.location || 'Not specified' },
  ];

  return (
    <div className="space-y-6">
      {/* Vehicle Images */}
      {vehicle.images && vehicle.images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Vehicle Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {vehicle.images.map((image, index) => (
              <div key={index} className="aspect-w-3 aspect-h-2">
                <img
                  src={image}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Image ${index + 1}`}
                  className="object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Information */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Vehicle Information</h4>
        <div className="bg-white border border-gray-200 rounded-lg">
          <dl className="divide-y divide-gray-200">
            {detailItems.map((item, index) => (
              <div key={index} className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-900">{item.label}</dt>
                <dd className="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">
                  {item.value}
                </dd>
              </div>
            ))}
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-900">Condition</dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(vehicle.condition)}`}>
                  {formatCondition(vehicle.condition)}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Description */}
      {vehicle.description && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Description</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {vehicle.description}
            </p>
          </div>
        </div>
      )}

      {/* Parts Summary */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Parts Summary</h4>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">
                {vehicle.totalParts || 0}
              </div>
              <div className="text-sm text-gray-500">Total Parts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">
                {vehicle.availableParts || 0}
              </div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-600">
                {(vehicle.totalParts || 0) - (vehicle.availableParts || 0)}
              </div>
              <div className="text-sm text-gray-500">Sold/Reserved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">
                  Vehicle acquired on {new Date(vehicle.acquisitionDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(vehicle.acquisitionDate), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">
                  Added to inventory on {new Date(vehicle.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(vehicle.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            {vehicle.updatedAt && vehicle.updatedAt !== vehicle.createdAt && (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">
                    Last updated on {new Date(vehicle.updatedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(vehicle.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
import { FC, useState, useEffect } from 'react';
import { Vehicle, VehicleFormData } from '@partpal/shared-types';
import { VehicleForm } from './VehicleForm';
import { VehicleDetails } from './VehicleDetails';
import { VehiclePartsList } from './VehiclePartsList';

interface VehicleModalProps {
  isOpen: boolean;
  vehicle?: Vehicle; // If provided, this is edit mode
  onClose: () => void;
  onSave: () => void;
}

export const VehicleModal: FC<VehicleModalProps> = ({
  isOpen,
  vehicle,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'edit' | 'parts'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset tab when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(vehicle ? 'details' : 'edit');
    }
  }, [isOpen, vehicle]);

  const handleSave = async (formData: VehicleFormData) => {
    setIsSubmitting(true);
    try {
      const url = vehicle ? `/api/vehicles/${vehicle.id}` : '/api/vehicles';
      const method = vehicle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${vehicle ? 'update' : 'create'} vehicle`);
      }

      onSave();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert(`Failed to ${vehicle ? 'update' : 'create'} vehicle. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete this vehicle? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete vehicle');
      }

      onSave(); // Trigger refresh and close modal
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to delete vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

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
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {vehicle ? (
                    `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                  ) : (
                    'Add New Vehicle'
                  )}
                </h3>
                {vehicle && (
                  <p className="mt-1 text-sm text-gray-500">
                    VIN: {vehicle.vin}
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

            {/* Tabs */}
            {vehicle && (
              <div className="mt-4">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Vehicle Details
                  </button>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'edit'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Edit Vehicle
                  </button>
                  <button
                    onClick={() => setActiveTab('parts')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'parts'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Parts ({vehicle.totalParts || 0})
                  </button>
                </nav>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-gray-50 px-4 py-5 sm:px-6">
            <div className="max-h-96 overflow-y-auto">
              {activeTab === 'details' && vehicle && (
                <VehicleDetails vehicle={vehicle} />
              )}

              {activeTab === 'edit' && (
                <VehicleForm
                  vehicle={vehicle}
                  onSave={handleSave}
                  onCancel={onClose}
                  isSubmitting={isSubmitting}
                />
              )}

              {activeTab === 'parts' && vehicle && (
                <VehiclePartsList vehicleId={vehicle.id} />
              )}
            </div>
          </div>

          {/* Footer */}
          {vehicle && activeTab === 'details' && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Edit Vehicle
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
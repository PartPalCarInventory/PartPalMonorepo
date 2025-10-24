import { FC, useState } from 'react';
import { Part, PartFormData } from '@partpal/shared-types';
import { PartForm } from './PartForm';
import { analytics } from '../utils/analytics';

interface PartModalProps {
  isOpen: boolean;
  part?: Part;
  onClose: () => void;
  onSave: () => void;
}

export const PartModal: FC<PartModalProps> = ({
  isOpen,
  part,
  onClose,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSave = async (data: PartFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = part ? `/api/parts/${part.id}` : '/api/parts';
      const method = part ? 'PUT' : 'POST';

      analytics.trackUserEngagement(part ? 'part_update_attempt' : 'part_create_attempt', {
        partName: data.name,
        category: data.categoryId,
        price: data.price,
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          currency: 'ZAR',
          status: 'AVAILABLE',
          isListedOnMarketplace: false,
          images: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save part');
      }

      const savedPart = await response.json();

      analytics.trackUserEngagement(part ? 'part_updated' : 'part_created', {
        partId: savedPart.id,
        partName: savedPart.name,
        category: savedPart.categoryId,
        price: savedPart.price,
      });

      onSave();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the part';
      setError(errorMessage);
      console.error('Failed to save part:', err);

      analytics.trackUserEngagement('part_save_error', {
        error: errorMessage,
        partName: data.name,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleCancel}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {part ? part.name : 'Add New Part'}
                </h3>
                {part && (
                  <p className="mt-1 text-sm text-gray-500">
                    Part #{part.partNumber || part.id}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content - Part Form */}
          <div className="bg-white px-4 py-5 sm:px-6 max-h-[70vh] overflow-y-auto">
            <PartForm
              part={part}
              onSave={handleSave}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
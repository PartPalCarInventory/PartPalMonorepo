import { FC, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Part, PartFormData, Vehicle, Category } from '@partpal/shared-types';

interface PartFormProps {
  part?: Part;
  onSave: (data: PartFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const PartForm: FC<PartFormProps> = ({
  part,
  onSave,
  onCancel,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<PartFormData>({
    vehicleId: '',
    name: '',
    partNumber: '',
    description: '',
    condition: 'GOOD',
    price: 0,
    location: '',
    categoryId: '',
    weight: undefined,
    dimensions: undefined,
    compatibility: [],
    warranty: undefined,
    installationNotes: '',
    images: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PartFormData, string>>>({});

  // Fetch vehicles for dropdown
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-dropdown'],
    queryFn: async () => {
      const response = await fetch('/api/vehicles?pageSize=1000&status=active');
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      return response.json();
    },
  });

  // Populate form when editing existing part
  useEffect(() => {
    if (part) {
      setFormData({
        vehicleId: part.vehicleId,
        name: part.name,
        partNumber: part.partNumber || '',
        description: part.description,
        condition: part.condition,
        price: part.price,
        location: part.location,
        categoryId: part.categoryId,
        weight: part.weight,
        dimensions: part.dimensions,
        compatibility: part.compatibility || [],
        warranty: part.warranty,
        installationNotes: part.installationNotes || '',
      });
    }
  }, [part]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PartFormData, string>> = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Vehicle is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Part name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    // Location is optional - no validation required

    if (formData.weight && formData.weight < 0) {
      newErrors.weight = 'Weight cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: keyof PartFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const categories = [
    { id: 'engine', name: 'Engine & Drivetrain' },
    { id: 'transmission', name: 'Transmission' },
    { id: 'brakes', name: 'Brakes & Suspension' },
    { id: 'electrical', name: 'Electrical & Electronics' },
    { id: 'exterior', name: 'Exterior Body Parts' },
    { id: 'interior', name: 'Interior Parts' },
    { id: 'wheels', name: 'Wheels & Tires' },
    { id: 'lighting', name: 'Lighting' },
    { id: 'cooling', name: 'Cooling System' },
    { id: 'exhaust', name: 'Exhaust System' },
  ];

  const conditions: Part['condition'][] = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle *
          </label>
          <select
            value={formData.vehicleId}
            onChange={(e) => handleInputChange('vehicleId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.vehicleId ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={!!part}
          >
            <option value="">Select Vehicle</option>
            {(vehiclesData?.vehicles || []).map((vehicle: Vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.vin})
              </option>
            ))}
          </select>
          {errors.vehicleId && <p className="mt-1 text-sm text-red-600">{errors.vehicleId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.categoryId ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Part Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Front Bumper, Alternator"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Part Number
          </label>
          <input
            type="text"
            value={formData.partNumber}
            onChange={(e) => handleInputChange('partNumber', e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="OEM or aftermarket part number"
          />
        </div>
      </div>

      {/* Pricing and Condition */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (R) *
          </label>
          <input
            type="number"
            value={formData.price || ''}
            onChange={(e) => handleInputChange('price', e.target.value ? parseFloat(e.target.value) : 0)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.price ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition *
          </label>
          <select
            value={formData.condition}
            onChange={(e) => handleInputChange('condition', e.target.value as Part['condition'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {condition.charAt(0) + condition.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Shelf A3, Bay 12 (optional)"
          />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Detailed description of the part, including condition notes, compatibility, etc."
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Additional Details */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Additional Information (Optional)</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              value={formData.weight || ''}
              onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Weight in kilograms"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warranty (months)
            </label>
            <input
              type="number"
              value={formData.warranty || ''}
              onChange={(e) => handleInputChange('warranty', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Warranty period in months"
              min="0"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Installation Notes
          </label>
          <textarea
            value={formData.installationNotes}
            onChange={(e) => handleInputChange('installationNotes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Special installation requirements or notes for mechanics"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dimensions (L × W × H cm)
          </label>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              value={formData.dimensions?.length || ''}
              onChange={(e) => handleInputChange('dimensions', {
                ...formData.dimensions,
                length: e.target.value ? parseFloat(e.target.value) : 0,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Length"
              min="0"
              step="0.1"
            />
            <input
              type="number"
              value={formData.dimensions?.width || ''}
              onChange={(e) => handleInputChange('dimensions', {
                ...formData.dimensions,
                width: e.target.value ? parseFloat(e.target.value) : 0,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Width"
              min="0"
              step="0.1"
            />
            <input
              type="number"
              value={formData.dimensions?.height || ''}
              onChange={(e) => handleInputChange('dimensions', {
                ...formData.dimensions,
                height: e.target.value ? parseFloat(e.target.value) : 0,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Height"
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {part ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            part ? 'Update Part' : 'Add Part'
          )}
        </button>
      </div>
    </form>
  );
};

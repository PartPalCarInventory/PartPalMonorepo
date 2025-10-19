import { FC, useState, useEffect } from 'react';
import { Vehicle, VehicleFormData } from '@partpal/shared-types';

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSave: (data: VehicleFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const VehicleForm: FC<VehicleFormProps> = ({
  vehicle,
  onSave,
  onCancel,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<VehicleFormData>({
    vin: '',
    year: new Date().getFullYear(),
    make: '',
    model: '',
    variant: '',
    engineSize: '',
    fuelType: '',
    transmission: '',
    color: '',
    mileage: 0,
    condition: 'GOOD',
    acquisitionDate: new Date(),
    description: '',
    location: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing existing vehicle
  useEffect(() => {
    if (vehicle) {
      setFormData({
        vin: vehicle.vin,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        variant: vehicle.variant || '',
        engineSize: vehicle.engineSize || '',
        fuelType: vehicle.fuelType || '',
        transmission: vehicle.transmission || '',
        color: vehicle.color || '',
        mileage: vehicle.mileage || 0,
        condition: vehicle.condition,
        acquisitionDate: new Date(vehicle.acquisitionDate),
        description: vehicle.description || '',
        location: vehicle.location || '',
      });
    }
  }, [vehicle]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vin.trim()) {
      newErrors.vin = 'VIN is required';
    } else if (formData.vin.length !== 17) {
      newErrors.vin = 'VIN must be exactly 17 characters';
    }

    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Please enter a valid year';
    }

    if (formData.mileage && formData.mileage < 0) {
      newErrors.mileage = 'Mileage cannot be negative';
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

  const handleInputChange = (field: keyof VehicleFormData, value: any) => {
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

  const makes = [
    'Audi', 'BMW', 'Chevrolet', 'Ford', 'Honda', 'Hyundai', 'Kia',
    'Mercedes-Benz', 'Nissan', 'Toyota', 'Volkswagen', 'Volvo'
  ];

  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'LPG', 'Other'];
  const transmissionTypes = ['Manual', 'Automatic', 'CVT', 'Semi-Automatic'];
  const conditions: Vehicle['condition'][] = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN *
          </label>
          <input
            type="text"
            value={formData.vin}
            onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
            maxLength={17}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.vin ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter 17-character VIN"
          />
          {errors.vin && <p className="mt-1 text-sm text-red-600">{errors.vin}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year *
          </label>
          <select
            value={formData.year}
            onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.year ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Make *
          </label>
          <select
            value={formData.make}
            onChange={(e) => handleInputChange('make', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.make ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select Make</option>
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
          {errors.make && <p className="mt-1 text-sm text-red-600">{errors.make}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model *
          </label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => handleInputChange('model', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.model ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter model"
          />
          {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Variant
          </label>
          <input
            type="text"
            value={formData.variant}
            onChange={(e) => handleInputChange('variant', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., GTI, M3, RS"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Engine Size
          </label>
          <input
            type="text"
            value={formData.engineSize}
            onChange={(e) => handleInputChange('engineSize', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 2.0L, 3.5L V6"
          />
        </div>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fuel Type
          </label>
          <select
            value={formData.fuelType}
            onChange={(e) => handleInputChange('fuelType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Fuel Type</option>
            {fuelTypes.map((fuel) => (
              <option key={fuel} value={fuel}>
                {fuel}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transmission
          </label>
          <select
            value={formData.transmission}
            onChange={(e) => handleInputChange('transmission', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Transmission</option>
            {transmissionTypes.map((trans) => (
              <option key={trans} value={trans}>
                {trans}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => handleInputChange('color', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Black, White, Silver"
          />
        </div>
      </div>

      {/* Condition and Other Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition *
          </label>
          <select
            value={formData.condition}
            onChange={(e) => handleInputChange('condition', e.target.value as Vehicle['condition'])}
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
            Mileage (km)
          </label>
          <input
            type="number"
            value={formData.mileage || ''}
            onChange={(e) => handleInputChange('mileage', e.target.value ? parseInt(e.target.value) : undefined)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.mileage ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter mileage"
            min="0"
          />
          {errors.mileage && <p className="mt-1 text-sm text-red-600">{errors.mileage}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Yard Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Section A, Row 3"
          />
        </div>
      </div>

      {/* Acquisition Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Acquisition Date *
        </label>
        <input
          type="date"
          value={formData.acquisitionDate.toISOString().split('T')[0]}
          onChange={(e) => handleInputChange('acquisitionDate', new Date(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Additional notes about the vehicle condition, damage, etc."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
              {vehicle ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            vehicle ? 'Update Vehicle' : 'Add Vehicle'
          )}
        </button>
      </div>
    </form>
  );
};
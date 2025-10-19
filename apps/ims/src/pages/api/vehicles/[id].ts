import type { NextApiRequest, NextApiResponse } from 'next';
import { Vehicle, VehicleFormData } from '@partpal/shared-types';

// This would normally come from a shared store or database
// For now, we'll simulate it (in a real app, this would be properly managed)
let mockVehicles: Vehicle[] = [];

// Initialize with basic vehicles if empty (this is a limitation of the mock approach)
const initializeMockData = () => {
  if (mockVehicles.length === 0) {
    mockVehicles = [
      {
        id: '1',
        vin: '1HGCM82633A123456',
        year: 2018,
        make: 'BMW',
        model: '3 Series',
        variant: '320i',
        engineSize: '2.0L Turbo',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        color: 'Black',
        mileage: 85000,
        condition: 'GOOD',
        acquisitionDate: new Date('2024-01-15'),
        sellerId: 's1',
        images: ['/api/placeholder/bmw-3series-1.jpg'],
        description: 'Well-maintained vehicle with minor exterior scratches.',
        location: 'Section A, Row 3',
        totalParts: 45,
        availableParts: 32,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: '2',
        vin: '1FTSW21P16EA12345',
        year: 2020,
        make: 'Mercedes-Benz',
        model: 'C-Class',
        variant: 'C200',
        engineSize: '1.5L Turbo',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        color: 'Silver',
        mileage: 42000,
        condition: 'EXCELLENT',
        acquisitionDate: new Date('2024-02-10'),
        sellerId: 's1',
        description: 'Low mileage vehicle in excellent condition.',
        location: 'Section B, Row 1',
        totalParts: 52,
        availableParts: 48,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-12'),
      },
    ];
  }
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  initializeMockData();

  const { id } = req.query;
  const vehicleId = id as string;

  if (req.method === 'GET') {
    // Get single vehicle
    const vehicle = mockVehicles.find(v => v.id === vehicleId);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    setTimeout(() => {
      res.status(200).json(vehicle);
    }, 200);

  } else if (req.method === 'PUT') {
    // Update vehicle
    const updateData: VehicleFormData = req.body;
    const vehicleIndex = mockVehicles.findIndex(v => v.id === vehicleId);

    if (vehicleIndex === -1) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if VIN is being changed and if it conflicts with another vehicle
    if (updateData.vin !== mockVehicles[vehicleIndex].vin) {
      const vinExists = mockVehicles.some(v => v.id !== vehicleId && v.vin === updateData.vin);
      if (vinExists) {
        return res.status(400).json({ error: 'Vehicle with this VIN already exists' });
      }
    }

    // Update the vehicle
    const updatedVehicle: Vehicle = {
      ...mockVehicles[vehicleIndex],
      ...updateData,
      updatedAt: new Date(),
    };

    mockVehicles[vehicleIndex] = updatedVehicle;

    setTimeout(() => {
      res.status(200).json(updatedVehicle);
    }, 400);

  } else if (req.method === 'DELETE') {
    // Delete vehicle
    const vehicleIndex = mockVehicles.findIndex(v => v.id === vehicleId);

    if (vehicleIndex === -1) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // In a real application, you'd want to check if the vehicle has associated parts
    // and handle that relationship appropriately
    const deletedVehicle = mockVehicles[vehicleIndex];
    mockVehicles.splice(vehicleIndex, 1);

    setTimeout(() => {
      res.status(200).json({
        message: 'Vehicle deleted successfully',
        deletedVehicle: {
          id: deletedVehicle.id,
          vin: deletedVehicle.vin,
          make: deletedVehicle.make,
          model: deletedVehicle.model,
        }
      });
    }, 300);

  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
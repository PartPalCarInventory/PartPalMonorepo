import type { NextApiRequest, NextApiResponse } from 'next';
import { Vehicle } from '@partpal/shared-types';

// Mock vehicles data for development
const mockVehicles: Vehicle[] = [
  {
    id: 'veh-1',
    vin: '1HGBH41JXMN109186',
    year: 2020,
    make: 'Toyota',
    model: 'Corolla',
    variant: 'XSE',
    engineSize: '2.0L',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Silver',
    mileage: 45000,
    condition: 'GOOD',
    acquisitionDate: new Date('2023-01-15'),
    sellerId: 'seller-1',
    description: 'Good condition, minor front bumper damage',
    location: 'Section A, Row 3',
    totalParts: 120,
    availableParts: 98,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
  },
  {
    id: 'veh-2',
    vin: '5XYKT3A63CG123456',
    year: 2018,
    make: 'BMW',
    model: '3 Series',
    variant: '320i',
    engineSize: '2.0L',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Black',
    mileage: 78000,
    condition: 'EXCELLENT',
    acquisitionDate: new Date('2023-02-20'),
    sellerId: 'seller-1',
    description: 'Excellent condition, complete vehicle',
    location: 'Section B, Row 1',
    totalParts: 150,
    availableParts: 142,
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-02-20'),
  },
  {
    id: 'veh-3',
    vin: '3FA6P0H75DR234567',
    year: 2019,
    make: 'Volkswagen',
    model: 'Golf',
    variant: 'GTI',
    engineSize: '2.0L Turbo',
    fuelType: 'Petrol',
    transmission: 'Manual',
    color: 'Red',
    mileage: 52000,
    condition: 'GOOD',
    acquisitionDate: new Date('2023-03-10'),
    sellerId: 'seller-1',
    description: 'Performance variant, most parts available',
    location: 'Section A, Row 5',
    totalParts: 135,
    availableParts: 125,
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
  },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { pageSize = '24', status = 'active' } = req.query;
    
    res.status(200).json({
      vehicles: mockVehicles,
      totalCount: mockVehicles.length,
      page: 1,
      pageSize: parseInt(String(pageSize)),
      totalPages: 1,
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

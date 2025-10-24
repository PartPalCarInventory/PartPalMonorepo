import type { NextApiRequest, NextApiResponse } from 'next';
import type { Vehicle, VehicleFormData } from '@partpal/shared-types';

// Mock vehicle data store (in a real app this would be a database)
let mockVehicles: Vehicle[] = [
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
    images: ['/api/placeholder/bmw-3series-1.jpg', '/api/placeholder/bmw-3series-2.jpg'],
    description: 'Well-maintained vehicle with minor exterior scratches. Engine runs smoothly.',
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
    images: ['/api/placeholder/mercedes-c-class-1.jpg'],
    description: 'Low mileage vehicle in excellent condition. All parts in working order.',
    location: 'Section B, Row 1',
    totalParts: 52,
    availableParts: 48,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-12'),
  },
  {
    id: '3',
    vin: '2T1BURHE0FC123456',
    year: 2016,
    make: 'Toyota',
    model: 'Corolla',
    variant: 'XLi',
    engineSize: '1.6L',
    fuelType: 'Petrol',
    transmission: 'Manual',
    color: 'White',
    mileage: 120000,
    condition: 'FAIR',
    acquisitionDate: new Date('2024-01-08'),
    sellerId: 's1',
    images: ['/api/placeholder/toyota-corolla-1.jpg', '/api/placeholder/toyota-corolla-2.jpg'],
    description: 'Higher mileage vehicle with some wear. Good for parts extraction.',
    location: 'Section C, Row 2',
    totalParts: 38,
    availableParts: 25,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-25'),
  },
];

const generateMockVehicles = (count: number): Vehicle[] => {
  const makes = ['BMW', 'Mercedes-Benz', 'Toyota', 'Honda', 'Ford', 'Volkswagen', 'Audi', 'Nissan'];
  const models = ['3 Series', 'C-Class', 'Corolla', 'Civic', 'Focus', 'Golf', 'A4', 'Altima'];
  const conditions: Vehicle['condition'][] = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
  const colors = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Gray', 'Green'];
  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
  const transmissions = ['Manual', 'Automatic', 'CVT'];

  const vehicles: Vehicle[] = [];

  for (let i = 4; i <= count + 3; i++) {
    const make = makes[Math.floor(Math.random() * makes.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const year = 2010 + Math.floor(Math.random() * 14);
    const acquisitionDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);

    vehicles.push({
      id: i.toString(),
      vin: `VIN${i.toString().padStart(14, '0')}`,
      year,
      make,
      model,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      acquisitionDate,
      sellerId: 's1',
      color: colors[Math.floor(Math.random() * colors.length)],
      mileage: Math.floor(Math.random() * 200000) + 10000,
      fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
      transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
      location: `Section ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}, Row ${Math.floor(Math.random() * 10) + 1}`,
      totalParts: Math.floor(Math.random() * 50) + 20,
      availableParts: Math.floor(Math.random() * 30) + 10,
      createdAt: acquisitionDate,
      updatedAt: new Date(acquisitionDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  }

  return vehicles;
};

// Initialize with more mock data
if (mockVehicles.length < 20) {
  mockVehicles = [...mockVehicles, ...generateMockVehicles(17)];
}

const filterVehicles = (vehicles: Vehicle[], filters: any) => {
  return vehicles.filter(vehicle => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchFields = [
        vehicle.vin,
        vehicle.make,
        vehicle.model,
        vehicle.variant || '',
        `${vehicle.year}`,
      ].map(field => field.toLowerCase());

      if (!searchFields.some(field => field.includes(searchLower))) {
        return false;
      }
    }

    if (filters.make && vehicle.make !== filters.make) {
      return false;
    }
    if (filters.model && !vehicle.model.toLowerCase().includes(filters.model.toLowerCase())) {
      return false;
    }
    if (filters.yearFrom && vehicle.year < parseInt(filters.yearFrom)) {
      return false;
    }
    if (filters.yearTo && vehicle.year > parseInt(filters.yearTo)) {
      return false;
    }
    if (filters.condition && !filters.condition.includes(vehicle.condition)) {
      return false;
    }

    return true;
  });
};

const sortVehicles = (vehicles: Vehicle[], sortBy: string) => {
  return [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'make':
        return a.make.localeCompare(b.make);
      case 'model':
        return a.model.localeCompare(b.model);
      case 'year':
        return b.year - a.year;
      default:
        return 0;
    }
  });
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const {
      page = '1',
      pageSize = '20',
      sortBy = 'newest',
      ...filters
    } = req.query;

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);

    // Filter and sort vehicles
    let filteredVehicles = filterVehicles(mockVehicles, filters);
    filteredVehicles = sortVehicles(filteredVehicles, sortBy as string);

    // Paginate
    const totalCount = filteredVehicles.length;
    const totalPages = Math.ceil(totalCount / pageSizeNum);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

    // Simulate network delay
    setTimeout(() => {
      res.status(200).json({
        vehicles: paginatedVehicles,
        totalCount,
        totalPages,
        currentPage: pageNum,
        pageSize: pageSizeNum,
      });
    }, 300);
  } else if (req.method === 'POST') {
    // Create new vehicle
    const vehicleData: VehicleFormData = req.body;

    // Check if VIN already exists
    if (mockVehicles.some(v => v.vin === vehicleData.vin)) {
      return res.status(400).json({ error: 'Vehicle with this VIN already exists' });
    }

    const newVehicle: Vehicle = {
      id: (mockVehicles.length + 1).toString(),
      ...vehicleData,
      sellerId: 's1',
      totalParts: 0,
      availableParts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockVehicles.push(newVehicle);

    setTimeout(() => {
      res.status(201).json(newVehicle);
    }, 500);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
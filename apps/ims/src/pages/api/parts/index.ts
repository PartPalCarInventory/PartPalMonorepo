import type { NextApiRequest, NextApiResponse } from 'next';
import type { Part } from '@partpal/shared-types';

// Mock parts data - exported for use in [id].ts
export let mockParts: Part[] = [
  {
    id: '1',
    vehicleId: '1',
    sellerId: 's1',
    name: 'Engine Mount',
    partNumber: 'BMW-EM-001',
    description: 'Original engine mount for BMW 3 Series. Good condition with minimal wear.',
    condition: 'GOOD',
    price: 850,
    currency: 'ZAR',
    status: 'AVAILABLE',
    location: 'A1-B2',
    images: ['/api/placeholder/engine-mount-1.jpg'],
    isListedOnMarketplace: true,
    categoryId: 'engine',
    weight: 2.5,
    warranty: 6,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    vehicleId: '2',
    sellerId: 's1',
    name: 'Door Handle - Left Front',
    partNumber: 'MB-DH-C001',
    description: 'Left front door handle for Mercedes C-Class. Chrome finish in excellent condition.',
    condition: 'EXCELLENT',
    price: 320,
    currency: 'ZAR',
    status: 'AVAILABLE',
    location: 'B3-C1',
    images: ['/api/placeholder/door-handle-1.jpg', '/api/placeholder/door-handle-2.jpg'],
    isListedOnMarketplace: true,
    categoryId: 'exterior',
    weight: 0.8,
    warranty: 3,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    vehicleId: '3',
    sellerId: 's1',
    name: 'Headlight Assembly - Right',
    partNumber: 'TOY-HL-COR',
    description: 'Right headlight assembly for Toyota Corolla. LED type, fully functional.',
    condition: 'EXCELLENT',
    price: 1200,
    currency: 'ZAR',
    status: 'RESERVED',
    location: 'C2-D3',
    images: ['/api/placeholder/headlight-1.jpg'],
    isListedOnMarketplace: false,
    categoryId: 'lighting',
    weight: 3.2,
    warranty: 12,
    reservedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-22'),
  },
];

const generateMockParts = (count: number): Part[] => {
  const partNames = [
    'Brake Disc', 'Air Filter', 'Fuel Pump', 'Alternator', 'Starter Motor',
    'Radiator', 'Bumper', 'Mirror', 'Seat', 'Steering Wheel',
    'Catalytic Converter', 'Exhaust Pipe', 'Shock Absorber', 'Wheel Rim',
    'Battery', 'Transmission', 'ECU', 'Oxygen Sensor', 'Thermostat'
  ];

  const categories = ['engine', 'transmission', 'brakes', 'electrical', 'exterior', 'interior', 'lighting', 'suspension'];
  const conditions: Part['condition'][] = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
  const statuses: Part['status'][] = ['AVAILABLE', 'RESERVED', 'SOLD'];

  const parts: Part[] = [];

  for (let i = 4; i <= count + 3; i++) {
    const name = partNames[Math.floor(Math.random() * partNames.length)];
    const categoryId = categories[Math.floor(Math.random() * categories.length)];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);

    parts.push({
      id: i.toString(),
      vehicleId: Math.floor(Math.random() * 3 + 1).toString(),
      sellerId: 's1',
      name,
      partNumber: `${categoryId.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      description: `${name} in ${condition.toLowerCase()} condition. Suitable for replacement or repair.`,
      condition,
      price: Math.floor(Math.random() * 2000) + 100,
      currency: 'ZAR',
      status,
      location: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 10)}-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 10)}`,
      images: Math.random() > 0.3 ? [`/api/placeholder/${categoryId}-${i}.jpg`] : [],
      isListedOnMarketplace: Math.random() > 0.4,
      categoryId,
      weight: Math.round((Math.random() * 10 + 0.5) * 10) / 10,
      warranty: Math.floor(Math.random() * 12) + 1,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  }

  return parts;
};

// Initialize with more mock data
if (mockParts.length < 50) {
  mockParts = [...mockParts, ...generateMockParts(47)];
}

const filterParts = (parts: Part[], filters: any) => {
  return parts.filter(part => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchFields = [
        part.name,
        part.partNumber || '',
        part.description,
        part.location,
      ].map(field => field.toLowerCase());

      if (!searchFields.some(field => field.includes(searchLower))) {
        return false;
      }
    }

    if (filters.categoryId && part.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.vehicleId && part.vehicleId !== filters.vehicleId) {
      return false;
    }
    if (filters.status && !filters.status.split(',').includes(part.status)) {
      return false;
    }
    if (filters.condition && !filters.condition.split(',').includes(part.condition)) {
      return false;
    }
    if (filters.priceMin && part.price < parseFloat(filters.priceMin)) {
      return false;
    }
    if (filters.priceMax && part.price > parseFloat(filters.priceMax)) {
      return false;
    }
    if (filters.isListedOnMarketplace === 'true' && !part.isListedOnMarketplace) {
      return false;
    }

    return true;
  });
};

const sortParts = (parts: Part[], sortBy: string) => {
  return [...parts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
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
      pageSize = '24',
      sortBy = 'newest',
      ...filters
    } = req.query;

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);

    // Filter and sort parts
    let filteredParts = filterParts(mockParts, filters);
    filteredParts = sortParts(filteredParts, sortBy as string);

    // Paginate
    const totalCount = filteredParts.length;
    const totalPages = Math.ceil(totalCount / pageSizeNum);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const paginatedParts = filteredParts.slice(startIndex, endIndex);

    // Simulate network delay
    setTimeout(() => {
      res.status(200).json({
        parts: paginatedParts,
        totalCount,
        totalPages,
        currentPage: pageNum,
        pageSize: pageSizeNum,
      });
    }, 200);

  } else if (req.method === 'POST') {
    try {
      const data = req.body as Partial<Part>;

      // Validate required fields
      if (!data.vehicleId || !data.name || !data.description || !data.categoryId || !data.price || !data.location) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      // Create new part
      const newPart: Part = {
        id: `part-${mockParts.length + 1}`,
        sellerId: 'seller-1',
        vehicleId: data.vehicleId,
        name: data.name,
        partNumber: data.partNumber,
        description: data.description,
        condition: data.condition || 'GOOD',
        price: data.price,
        currency: data.currency || 'ZAR',
        status: data.status || 'AVAILABLE',
        location: data.location || 'Not Specified',
        images: data.images || [],
        isListedOnMarketplace: data.isListedOnMarketplace || false,
        categoryId: data.categoryId,
        weight: data.weight,
        dimensions: data.dimensions,
        compatibility: data.compatibility,
        warranty: data.warranty,
        installationNotes: data.installationNotes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockParts.push(newPart);

      return res.status(201).json({
        success: true,
        ...newPart,
      });
    } catch (error) {
      console.error('Error creating part:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create part',
      });
    }

  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
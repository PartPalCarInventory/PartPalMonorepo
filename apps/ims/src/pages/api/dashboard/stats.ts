import type { NextApiRequest, NextApiResponse } from 'next';
import { DashboardStats } from '@partpal/shared-types';

// Mock data generator
const generateMockStats = (period: string): DashboardStats => {
  const baseStats = {
    totalVehicles: 147,
    totalParts: 1823,
    recentSales: 34,
    monthlyRevenue: 156780,
  };

  // Adjust stats based on period
  const multiplier = period === '7d' ? 0.25 : period === '30d' ? 1 : period === '90d' ? 3 : 12;

  return {
    totalVehicles: Math.round(baseStats.totalVehicles * multiplier),
    totalParts: Math.round(baseStats.totalParts * multiplier),
    recentSales: Math.round(baseStats.recentSales * multiplier),
    monthlyRevenue: Math.round(baseStats.monthlyRevenue * multiplier),
    topSellingParts: [
      {
        part: {
          id: '1',
          vehicleId: 'v1',
          sellerId: 's1',
          name: 'Engine Mount',
          partNumber: 'BMW-EM-001',
          description: 'Original engine mount for BMW 3 Series',
          condition: 'EXCELLENT',
          price: 850,
          currency: 'ZAR',
          status: 'SOLD',
          location: 'A1-B2',
          images: ['/api/placeholder/part1.jpg'],
          isListedOnMarketplace: true,
          categoryId: 'engine',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
        },
        salesCount: 12,
      },
      {
        part: {
          id: '2',
          vehicleId: 'v2',
          sellerId: 's1',
          name: 'Door Handle - Left Front',
          partNumber: 'MB-DH-C001',
          description: 'Left front door handle for Mercedes C-Class',
          condition: 'GOOD',
          price: 320,
          currency: 'ZAR',
          status: 'SOLD',
          location: 'B3-C1',
          images: ['/api/placeholder/part2.jpg'],
          isListedOnMarketplace: true,
          categoryId: 'exterior',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
        },
        salesCount: 8,
      },
      {
        part: {
          id: '3',
          vehicleId: 'v3',
          sellerId: 's1',
          name: 'Headlight Assembly - Right',
          partNumber: 'TOY-HL-COR',
          description: 'Right headlight assembly for Toyota Corolla',
          condition: 'NEW',
          price: 1200,
          currency: 'ZAR',
          status: 'SOLD',
          location: 'C2-D3',
          images: ['/api/placeholder/part3.jpg'],
          isListedOnMarketplace: true,
          categoryId: 'lighting',
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-22'),
        },
        salesCount: 6,
      },
    ],
    recentActivity: [
      {
        id: 'a1',
        type: 'part_sold',
        description: 'Engine Mount sold for R850',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        userId: 'u1',
      },
      {
        id: 'a2',
        type: 'marketplace_listing',
        description: 'Headlight Assembly listed on marketplace',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        userId: 'u1',
      },
      {
        id: 'a3',
        type: 'vehicle_added',
        description: 'Added 2018 Volkswagen Golf to inventory',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        userId: 'u1',
      },
      {
        id: 'a4',
        type: 'part_listed',
        description: 'Door Handle listed for R320',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        userId: 'u1',
      },
      {
        id: 'a5',
        type: 'part_sold',
        description: 'Brake Disc sold for R450',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        userId: 'u1',
      },
    ],
  };
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardStats>
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { period = '30d' } = req.query;
  const stats = generateMockStats(period as string);

  // Simulate network delay
  setTimeout(() => {
    res.status(200).json(stats);
  }, 500);
}
import type { NextApiRequest, NextApiResponse } from 'next';

interface InventoryData {
  status: string;
  count: number;
  percentage: number;
}

const generateMockInventoryData = (period: string): InventoryData[] => {
  // Base inventory numbers
  const totalParts = period === '7d' ? 456 : period === '30d' ? 1823 : period === '90d' ? 5469 : 21876;

  const available = Math.round(totalParts * 0.65);
  const reserved = Math.round(totalParts * 0.15);
  const sold = Math.round(totalParts * 0.15);
  const listed = Math.round(totalParts * 0.05);

  const data = [
    { status: 'AVAILABLE', count: available },
    { status: 'RESERVED', count: reserved },
    { status: 'SOLD', count: sold },
    { status: 'LISTED', count: listed },
  ];

  // Calculate percentages
  return data.map(item => ({
    ...item,
    percentage: (item.count / totalParts) * 100,
  }));
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<InventoryData[]>
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { period = '30d' } = req.query;
  const inventoryData = generateMockInventoryData(period as string);

  // Simulate network delay
  setTimeout(() => {
    res.status(200).json(inventoryData);
  }, 400);
}
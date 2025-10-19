import type { NextApiRequest, NextApiResponse } from 'next';

interface RevenueData {
  date: string;
  revenue: number;
  sales: number;
}

const generateMockRevenueData = (period: string): RevenueData[] => {
  const now = new Date();
  const data: RevenueData[] = [];

  let days: number;
  switch (period) {
    case '7d':
      days = 7;
      break;
    case '30d':
      days = 30;
      break;
    case '90d':
      days = 90;
      break;
    case '1y':
      days = 365;
      break;
    default:
      days = 30;
  }

  const interval = days > 90 ? 7 : 1; // Weekly for yearly, daily for others

  for (let i = days; i >= 0; i -= interval) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Generate realistic revenue data with some randomness
    const baseRevenue = 3000 + Math.random() * 2000;
    const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.6 : 1;
    const revenue = Math.round(baseRevenue * weekendMultiplier);
    const sales = Math.round(revenue / 400); // Average part price around R400

    data.push({
      date: date.toISOString().split('T')[0],
      revenue,
      sales,
    });
  }

  return data;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<RevenueData[]>
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { period = '30d' } = req.query;
  const revenueData = generateMockRevenueData(period as string);

  // Simulate network delay
  setTimeout(() => {
    res.status(200).json(revenueData);
  }, 300);
}
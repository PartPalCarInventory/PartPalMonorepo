import { NextApiRequest, NextApiResponse } from 'next';

// Generate mock date range
const generateDateRange = (days: number) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Generate mock data with realistic patterns
const generateMockReportsData = (filters: any) => {
  const dateRange = generateDateRange(30);

  return {
    inventory: {
      totalParts: 15420,
      partsByStatus: [
        { status: 'AVAILABLE', count: 8450, percentage: 54.8 },
        { status: 'RESERVED', count: 2340, percentage: 15.2 },
        { status: 'SOLD', count: 3120, percentage: 20.2 },
        { status: 'LISTED', count: 1510, percentage: 9.8 },
      ],
      partsByCategory: [
        { category: 'Engine', count: 3840, averagePrice: 2500 },
        { category: 'Transmission', count: 2150, averagePrice: 4200 },
        { category: 'Brakes', count: 2890, averagePrice: 850 },
        { category: 'Electrical', count: 3210, averagePrice: 320 },
        { category: 'Exterior', count: 2130, averagePrice: 650 },
        { category: 'Interior', count: 1200, averagePrice: 180 },
      ],
      inventoryTrend: dateRange.map((date, index) => ({
        date,
        inStock: 8450 + Math.floor(Math.sin(index * 0.2) * 200),
        sold: 120 + Math.floor(Math.random() * 50),
        reserved: 2340 + Math.floor(Math.cos(index * 0.15) * 100),
      })),
      topSellingCategories: [
        { category: 'Engine', sales: 340, revenue: 850000 },
        { category: 'Brakes', sales: 280, revenue: 238000 },
        { category: 'Transmission', sales: 150, revenue: 630000 },
        { category: 'Electrical', sales: 420, revenue: 134400 },
      ],
      lowStockAlerts: [
        { partId: 'P001', partName: 'BMW E46 Headlight Assembly', currentStock: 2, minimumStock: 5 },
        { partId: 'P002', partName: 'Mercedes C-Class Door Handle', currentStock: 1, minimumStock: 3 },
        { partId: 'P003', partName: 'Toyota Camry Brake Pads', currentStock: 3, minimumStock: 8 },
      ],
      averageInventoryValue: 1250,
      inventoryTurnoverRate: 4.2,
    },
    financial: {
      totalRevenue: 4250000,
      totalProfit: 1105000,
      profitMargin: 26.0,
      revenueGrowth: 12.5,
      revenueTrend: dateRange.map((date, index) => ({
        date,
        revenue: 140000 + Math.floor(Math.sin(index * 0.1) * 20000) + Math.random() * 10000,
        profit: 36400 + Math.floor(Math.sin(index * 0.1) * 5200) + Math.random() * 2600,
        costs: 103600 + Math.floor(Math.sin(index * 0.1) * 14800) + Math.random() * 7400,
      })),
      revenueByCategory: [
        { category: 'Engine', revenue: 1530000, profit: 459000, margin: 30.0 },
        { category: 'Transmission', revenue: 945000, profit: 236250, margin: 25.0 },
        { category: 'Brakes', revenue: 680000, profit: 163200, margin: 24.0 },
        { category: 'Electrical', revenue: 520000, profit: 114400, margin: 22.0 },
        { category: 'Exterior', revenue: 385000, profit: 92400, margin: 24.0 },
        { category: 'Interior', revenue: 190000, profit: 39900, margin: 21.0 },
      ],
      monthlyBreakdown: [
        { month: 'Jan', revenue: 1420000, expenses: 1036000, profit: 384000 },
        { month: 'Feb', revenue: 1380000, expenses: 1014000, profit: 366000 },
        { month: 'Mar', revenue: 1450000, expenses: 1058000, profit: 392000 },
      ],
      topRevenueVehicles: [
        { vehicleId: 'V001', make: 'BMW', model: '3 Series', year: 2018, revenue: 125000, partsSold: 45 },
        { vehicleId: 'V002', make: 'Mercedes-Benz', model: 'C-Class', year: 2019, revenue: 98000, partsSold: 32 },
        { vehicleId: 'V003', make: 'Toyota', model: 'Camry', year: 2017, revenue: 76000, partsSold: 58 },
        { vehicleId: 'V004', make: 'Honda', model: 'Accord', year: 2016, revenue: 65000, partsSold: 41 },
      ],
      cashFlow: dateRange.slice(-14).map((date, index) => ({
        date,
        inflow: 45000 + Math.random() * 15000,
        outflow: 32000 + Math.random() * 8000,
        netFlow: 13000 + Math.random() * 7000,
      })),
    },
    performance: {
      kpis: {
        inventoryTurnover: 4.2,
        averageSaleTime: 12.5,
        customerSatisfaction: 87.3,
        operationalEfficiency: 82.1,
        marketShare: 15.8,
        returnRate: 2.1,
      },
      performanceTrends: dateRange.map((date, index) => ({
        date,
        efficiency: 82 + Math.sin(index * 0.1) * 5 + Math.random() * 3,
        quality: 85 + Math.cos(index * 0.12) * 4 + Math.random() * 2,
        speed: 78 + Math.sin(index * 0.08) * 6 + Math.random() * 4,
        satisfaction: 87 + Math.cos(index * 0.15) * 3 + Math.random() * 2,
      })),
      categoryPerformance: [
        { category: 'Engine', turnoverRate: 85.2, profitability: 92.1, demand: 88.5, avgSaleTime: 8.2 },
        { category: 'Transmission', turnoverRate: 78.9, profitability: 89.3, demand: 75.2, avgSaleTime: 15.4 },
        { category: 'Brakes', turnoverRate: 91.4, profitability: 76.8, demand: 94.1, avgSaleTime: 6.1 },
        { category: 'Electrical', turnoverRate: 88.7, profitability: 71.2, demand: 92.3, avgSaleTime: 9.8 },
      ],
      employeeMetrics: [
        { employeeId: 'E001', name: 'John Smith', salesCount: 145, revenue: 325000, efficiency: 92.1, customerRating: 4.8 },
        { employeeId: 'E002', name: 'Sarah Johnson', salesCount: 132, revenue: 298000, efficiency: 88.5, customerRating: 4.6 },
        { employeeId: 'E003', name: 'Mike Chen', salesCount: 118, revenue: 267000, efficiency: 85.2, customerRating: 4.7 },
        { employeeId: 'E004', name: 'Lisa Wong', salesCount: 106, revenue: 245000, efficiency: 83.1, customerRating: 4.5 },
      ],
      processingTimes: [
        { process: 'Part Cataloging', averageTime: 2.3, targetTime: 2.0, efficiency: 87.0 },
        { process: 'Quality Inspection', averageTime: 1.8, targetTime: 2.0, efficiency: 111.1 },
        { process: 'Photography', averageTime: 0.8, targetTime: 1.0, efficiency: 125.0 },
        { process: 'Listing Creation', averageTime: 1.2, targetTime: 1.5, efficiency: 125.0 },
        { process: 'Order Processing', averageTime: 4.2, targetTime: 4.0, efficiency: 95.2 },
      ],
      qualityMetrics: {
        defectRate: 1.8,
        returnRate: 2.1,
        customerComplaints: 12,
        qualityScore: 92.5,
      },
    },
    sales: {
      totalSales: 8450,
      totalRevenue: 4250000,
      averageOrderValue: 503,
      conversionRate: 24.3,
      salesTrend: dateRange.map((date, index) => ({
        date,
        sales: 280 + Math.floor(Math.sin(index * 0.1) * 50) + Math.random() * 30,
        revenue: 140000 + Math.floor(Math.sin(index * 0.1) * 20000) + Math.random() * 10000,
        orders: 95 + Math.floor(Math.sin(index * 0.1) * 20) + Math.random() * 15,
      })),
      salesByChannel: [
        { channel: 'Direct Sales', sales: 3380, revenue: 1700000, percentage: 40.0 },
        { channel: 'Online Marketplace', sales: 2535, revenue: 1275000, percentage: 30.0 },
        { channel: 'B2B Partners', sales: 1690, revenue: 850000, percentage: 20.0 },
        { channel: 'Wholesale', sales: 845, revenue: 425000, percentage: 10.0 },
      ],
      topSellingParts: [
        { partId: 'P101', partName: 'BMW E46 Brake Disc', partNumber: 'BM-BD-001', category: 'Brakes', unitsSold: 145, revenue: 87000, profit: 26100 },
        { partId: 'P102', partName: 'Mercedes W204 Headlight', partNumber: 'MB-HL-204', category: 'Electrical', unitsSold: 89, revenue: 125300, profit: 50120 },
        { partId: 'P103', partName: 'Toyota Camry Door Handle', partNumber: 'TY-DH-CAM', category: 'Exterior', unitsSold: 156, revenue: 31200, profit: 12480 },
        { partId: 'P104', partName: 'Honda Accord Radiator', partNumber: 'HD-RAD-ACC', category: 'Engine', unitsSold: 67, revenue: 100500, profit: 35175 },
      ],
      customerSegments: [
        { segment: 'Individual Buyers', customers: 1250, revenue: 1912500, averageOrderValue: 425, frequency: 2.1 },
        { segment: 'Small Workshops', customers: 340, revenue: 1020000, averageOrderValue: 850, frequency: 4.2 },
        { segment: 'Large Dealers', customers: 85, revenue: 1190000, averageOrderValue: 2850, frequency: 6.8 },
        { segment: 'Insurance Companies', customers: 45, revenue: 127500, averageOrderValue: 1250, frequency: 1.8 },
      ],
      salesFunnel: [
        { stage: 'Inquiries', count: 2840, conversionRate: 100 },
        { stage: 'Quotes Sent', count: 1988, conversionRate: 70 },
        { stage: 'Negotiations', count: 1420, conversionRate: 50 },
        { stage: 'Orders Placed', count: 852, conversionRate: 30 },
        { stage: 'Completed Sales', count: 710, conversionRate: 25 },
      ],
      geographicSales: [
        { region: 'Gauteng', sales: 3380, revenue: 1700000, growth: 15.2 },
        { region: 'Western Cape', sales: 2028, revenue: 1020000, growth: 8.7 },
        { region: 'KwaZulu-Natal', sales: 1352, revenue: 680000, growth: 12.1 },
        { region: 'Eastern Cape', sales: 845, revenue: 425000, growth: -2.3 },
        { region: 'Other Provinces', sales: 845, revenue: 425000, growth: 5.8 },
      ],
      salesPerformance: {
        target: 4000000,
        actual: 4250000,
        achievement: 106.3,
        forecast: 4500000,
      },
    },
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const filters = req.query;
    const mockData = generateMockReportsData(filters);

    res.status(200).json(mockData);
  } catch (error) {
    console.error('Reports API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
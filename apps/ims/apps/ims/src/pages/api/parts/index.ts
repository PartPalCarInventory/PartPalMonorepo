import type { NextApiRequest, NextApiResponse } from 'next';
import { Part, PartFormData } from '@partpal/shared-types';

// In-memory storage for development
// In production, this would connect to a database
let parts: Part[] = [];
let nextId = 1;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle GET - List parts with filters and pagination
  if (req.method === 'GET') {
    const {
      page = '1',
      pageSize = '24',
      search,
      categoryId,
      vehicleId,
      status,
      condition,
      priceMin,
      priceMax,
      isListedOnMarketplace,
      sortBy = 'newest',
    } = req.query;

    let filteredParts = [...parts];

    // Apply filters
    if (search) {
      const searchLower = String(search).toLowerCase();
      filteredParts = filteredParts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.partNumber?.toLowerCase().includes(searchLower)
      );
    }

    if (categoryId) {
      filteredParts = filteredParts.filter((p) => p.categoryId === categoryId);
    }

    if (vehicleId) {
      filteredParts = filteredParts.filter((p) => p.vehicleId === vehicleId);
    }

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filteredParts = filteredParts.filter((p) => statuses.includes(p.status));
    }

    if (condition) {
      const conditions = Array.isArray(condition) ? condition : [condition];
      filteredParts = filteredParts.filter((p) => conditions.includes(p.condition));
    }

    if (priceMin) {
      filteredParts = filteredParts.filter((p) => p.price >= parseFloat(String(priceMin)));
    }

    if (priceMax) {
      filteredParts = filteredParts.filter((p) => p.price <= parseFloat(String(priceMax)));
    }

    if (isListedOnMarketplace !== undefined) {
      const isListed = isListedOnMarketplace === 'true';
      filteredParts = filteredParts.filter((p) => p.isListedOnMarketplace === isListed);
    }

    // Apply sorting
    filteredParts.sort((a, b) => {
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

    // Apply pagination
    const pageNum = parseInt(String(page));
    const pageSizeNum = parseInt(String(pageSize));
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;

    const paginatedParts = filteredParts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredParts.length / pageSizeNum);

    res.status(200).json({
      parts: paginatedParts,
      totalCount: filteredParts.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
    });
  }

  // Handle POST - Create new part
  else if (req.method === 'POST') {
    try {
      const data: PartFormData & { currency: string; status: Part['status']; isListedOnMarketplace: boolean; images: string[] } = req.body;

      // Validate required fields
      if (!data.vehicleId || !data.name || !data.description || !data.categoryId || !data.price || !data.location) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      // Create new part
      const newPart: Part = {
        id: `part-${nextId++}`,
        sellerId: 'seller-1', // In production, get from auth session
        vehicleId: data.vehicleId,
        name: data.name,
        partNumber: data.partNumber,
        description: data.description,
        condition: data.condition,
        price: data.price,
        currency: data.currency || 'ZAR',
        status: data.status || 'AVAILABLE',
        location: data.location,
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

      parts.push(newPart);

      res.status(201).json({
        success: true,
        ...newPart,
      });
    } catch (error) {
      console.error('Error creating part:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create part',
      });
    }
  }

  // Handle unsupported methods
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

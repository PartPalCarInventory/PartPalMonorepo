import express from 'express';
import { prisma } from '@partpal/database';
import { ApiResponse, Category } from '@partpal/shared-types';
import { authenticateToken, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
});

const updateCategorySchema = createCategorySchema.partial();

// Get all categories (public endpoint)
router.get('/', async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const parentId = req.query.parentId as string;

    let whereClause: any = {};

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    if (parentId !== undefined) {
      whereClause.parentId = parentId || null;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                parts: {
                  where: {
                    isListedOnMarketplace: true,
                    status: 'AVAILABLE',
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            parts: {
              where: {
                isListedOnMarketplace: true,
                status: 'AVAILABLE',
              },
            },
          },
        },
      },
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' },
      ],
    });

    const response: ApiResponse<(Category & {
      parent?: { id: string; name: string };
      children?: any[];
      partsCount: number;
    })[]> = {
      success: true,
      data: categories.map(category => ({
        ...category,
        partsCount: category._count.parts,
      })) as any,
      message: 'Categories retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get category tree (hierarchical structure)
router.get('/tree', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      include: {
        children: {
          where: {
            isActive: true,
          },
          include: {
            _count: {
              select: {
                parts: {
                  where: {
                    isListedOnMarketplace: true,
                    status: 'AVAILABLE',
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            parts: {
              where: {
                isListedOnMarketplace: true,
                status: 'AVAILABLE',
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build tree structure (root categories with their children)
    const rootCategories = categories
      .filter(cat => !cat.parentId)
      .map(category => ({
        ...category,
        partsCount: category._count.parts,
        children: category.children.map(child => ({
          ...child,
          partsCount: child._count.parts,
        })),
      }));

    const response: ApiResponse<typeof rootCategories> = {
      success: true,
      data: rootCategories,
      message: 'Category tree retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get category by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                parts: {
                  where: {
                    isListedOnMarketplace: true,
                    status: 'AVAILABLE',
                  },
                },
              },
            },
          },
        },
        parts: {
          where: {
            isListedOnMarketplace: true,
            status: 'AVAILABLE',
          },
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            condition: true,
            images: true,
            vehicle: {
              select: {
                year: true,
                make: true,
                model: true,
                variant: true,
              },
            },
            seller: {
              select: {
                businessName: true,
                city: true,
                province: true,
                isVerified: true,
              },
            },
          },
          take: 20,
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            parts: {
              where: {
                isListedOnMarketplace: true,
                status: 'AVAILABLE',
              },
            },
          },
        },
      },
    });

    if (!category) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category not found',
        message: 'Category with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Category & {
      parent?: { id: string; name: string };
      children?: any[];
      parts?: any[];
      partsCount: number;
    }> = {
      success: true,
      data: {
        ...category,
        partsCount: category._count.parts,
      } as any,
      message: 'Category retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Create category (admin only)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);

    // Check if parent category exists if specified
    if (validatedData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentCategory) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Parent category not found',
          message: 'Specified parent category does not exist',
        };
        return res.status(400).json(response);
      }
    }

    // Check for duplicate names within the same parent
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: validatedData.name,
        parentId: validatedData.parentId || null,
      },
    });

    if (existingCategory) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category name already exists',
        message: 'A category with this name already exists in the specified parent',
      };
      return res.status(409).json(response);
    }

    const category = await prisma.category.create({
      data: validatedData as any,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const response: ApiResponse<Category> = {
      success: true,
      data: category as any,
      message: 'Category created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Update category (admin only)
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category not found',
        message: 'Category with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    // Check if parent category exists if specified
    if (validatedData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentCategory) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Parent category not found',
          message: 'Specified parent category does not exist',
        };
        return res.status(400).json(response);
      }

      // Prevent setting self as parent or creating circular references
      if (validatedData.parentId === id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid parent',
          message: 'Category cannot be its own parent',
        };
        return res.status(400).json(response);
      }
    }

    // Check for duplicate names if name is being changed
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: validatedData.name,
          parentId: validatedData.parentId !== undefined ? validatedData.parentId : existingCategory.parentId,
          id: { not: id },
        },
      });

      if (duplicateCategory) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Category name already exists',
          message: 'A category with this name already exists in the specified parent',
        };
        return res.status(409).json(response);
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: validatedData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const response: ApiResponse<Category> = {
      success: true,
      data: updatedCategory as any,
      message: 'Category updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: {
            parts: true,
          },
        },
      },
    });

    if (!existingCategory) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category not found',
        message: 'Category with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    // Check if category has children
    if (existingCategory.children.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Cannot delete category',
        message: 'Category has subcategories. Please delete subcategories first.',
      };
      return res.status(400).json(response);
    }

    // Check if category has parts
    if (existingCategory._count.parts > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Cannot delete category',
        message: 'Category has associated parts. Please reassign parts first.',
      };
      return res.status(400).json(response);
    }

    await prisma.category.delete({
      where: { id },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Category deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
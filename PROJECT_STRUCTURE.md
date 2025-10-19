# PartPal Project Structure

## Overview
PartPal consists of two interconnected applications:
1. **PartPal IMS** - B2B Inventory Management System for scrap yards
2. **PartPal Marketplace** - Public marketplace for auto parts discovery

## Monorepo Structure

```
PartPalv2/
├── apps/
│   ├── ims/                    # PartPal IMS Application
│   └── marketplace/            # PartPal Marketplace Application
├── packages/
│   ├── shared-ui/              # Shared UI components
│   ├── shared-types/           # TypeScript types and interfaces
│   ├── shared-utils/           # Common utilities and helpers
│   ├── api-client/             # API client library
│   └── database/               # Database schemas and utilities
├── services/
│   ├── api/                    # Backend API service
│   ├── auth/                   # Authentication service
│   └── image-processing/       # Image optimization service
├── docs/                       # Documentation
├── tools/                      # Build tools and scripts
└── infrastructure/             # Deployment configurations
```

## Key Design Principles for AI Development

### 1. Modular Architecture
- Clear separation of concerns
- Reusable components across applications
- Well-defined interfaces between modules

### 2. Component-Based UI
- Atomic design methodology
- Shared component library for consistency
- Mobile-first responsive design

### 3. Type Safety
- Comprehensive TypeScript coverage
- Shared type definitions
- Auto-generated API types

### 4. Developer Experience
- Hot module replacement
- Automated testing
- Clear documentation
- Consistent code formatting

## Application-Specific Features

### PartPal IMS Features
- Dashboard with business overview
- Vehicle check-in with VIN lookup
- Digital dismantling workflow
- Inventory management system
- One-click marketplace publishing
- Sales reporting and analytics

### PartPal Marketplace Features
- Advanced part search (Vehicle, Part Name, Part Number)
- Location-based filtering
- Seller verification system
- Part listing pages with rich media
- Seller profiles and galleries
- Contact facilitation system
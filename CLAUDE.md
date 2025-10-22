# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PartPal is a dual-application platform for the South African used auto parts industry:
- **PartPal IMS** (port 3001): B2B inventory management system for scrap yards
- **PartPal Marketplace** (port 3000): Public marketplace connecting buyers with sellers

## Architecture

### Monorepo Structure
This is a Turbo-managed monorepo with workspace dependencies:
- `apps/ims/` - Next.js IMS application
- `apps/marketplace/` - Next.js marketplace application
- `packages/shared-ui/` - Shared component library with Tailwind CSS
- `packages/shared-types/` - TypeScript interfaces for all entities (User, Vehicle, Part, Seller, etc.)
- `packages/shared-utils/` - Common utilities including analytics tracking
- `services/api/` - Express.js backend API
- `infrastructure/` - Docker, Kubernetes, and deployment configs

### Key Data Models
The `@partpal/shared-types` package defines core entities:
- **Vehicle**: VIN-based with make/model/year, linked to sellers
- **Part**: Inventory items with marketplace publishing toggle
- **Seller**: Business profiles with verification status and subscription plans
- **User**: Role-based (admin/seller/buyer) with authentication

### Shared Component System
`@partpal/shared-ui` provides:
- Atomic design components with consistent styling
- Mobile-first responsive design with touch optimization
- Brand colors (primary blue, secondary gray, accent orange)
- Form components with validation support

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev

# Start specific applications
pnpm dev:ims          # IMS on port 3001
pnpm dev:marketplace  # Marketplace on port 3000
pnpm dev:api          # API service on port 3333

# Build all packages
pnpm build

# Type checking across monorepo
pnpm typecheck

# Linting
pnpm lint
```

### Testing
```bash
# Run all tests
pnpm test

# Test specific workspace
pnpm --filter @partpal/shared-utils test
```

### Docker Development
```bash
# Start full stack with Docker
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Rebuild specific service
docker-compose build [service-name]
```

## Agent Communication Guidelines

### Professional Standards
- **NO EMOJI USAGE**: All agents must communicate without emojis
- Use clear, descriptive text instead of visual symbols
- Maintain professional, business-appropriate language
- Focus on technical accuracy and functionality

## Development Patterns

### Workspace Dependencies
All packages use `workspace:*` for internal dependencies. When adding shared functionality:
1. Add to appropriate `packages/` directory
2. Export from package's `src/index.ts`
3. Import using `@partpal/package-name` in consuming apps

### Component Development
1. Build components in `packages/shared-ui/src/components/`
2. Use the established design system (Tailwind classes, brand colors)
3. Export components from package index for consumption by apps
4. Follow mobile-first responsive patterns with touch targets ≥44px

### Type Safety
- All shared types live in `@partpal/shared-types`
- Components should accept properly typed props
- API responses use the `ApiResponse<T>` and `PaginatedResponse<T>` wrapper types

### Feature Development
The system has two distinct user experiences:
- **IMS**: Business dashboard for inventory management, vehicle check-in, parts publishing
- **Marketplace**: Public search interface for part discovery and seller contact

Cross-cutting features should be built as shared utilities or components.

## Environment Setup

Copy `.env.example` to `.env` and configure:
- Database: PostgreSQL connection string
- Redis: Cache and session storage
- Cloudinary: Image storage and optimization
- Analytics: Google Analytics for tracking

## Cloud Deployment

The project includes production-ready configurations:
- Multi-stage Dockerfiles for optimized builds
- Kubernetes manifests with auto-scaling
- Nginx reverse proxy with SSL termination
- Environment-specific configurations for staging/production

## Key Integration Points

### IMS ↔ Marketplace Sync
Parts in IMS have `isListedOnMarketplace` boolean. When toggled:
1. Part data syncs to marketplace database
2. Images and metadata become publicly searchable
3. Automatic removal when marked as sold

### Search & Discovery
Marketplace implements multi-criteria search:
- Vehicle-based (Year/Make/Model)
- Part name (fuzzy search)
- Part number (exact match)
- Location-based filtering (via seller location)

### Mobile Optimization
Both applications are PWA-enabled with:
- App manifests for installation
- Service workers for offline capability
- Touch-optimized interfaces
- Safe area support for mobile devices
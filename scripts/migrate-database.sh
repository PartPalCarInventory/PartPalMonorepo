#!/bin/bash

# Migration script for PartPal database updates
# This script handles the database migration for new analytics tables

set -e  # Exit on error

echo "=========================================="
echo "PartPal Database Migration Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking database package${NC}"
cd packages/database

if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}Error: Prisma schema not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prisma schema found${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing dependencies${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Creating migration${NC}"
echo "This will create a new migration for analytics tables..."
pnpm prisma migrate dev --name add-analytics-and-activity-logging

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration created successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Generating Prisma Client${NC}"
pnpm prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${RED}✗ Prisma Client generation failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 5: Verifying migration${NC}"
pnpm prisma migrate status

echo ""
echo -e "${GREEN}=========================================="
echo "Migration completed successfully!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your API server: cd services/api && pnpm dev:api"
echo "2. Test the new endpoints using the examples in BACKEND_FIXES_SUMMARY.md"
echo ""
echo "New tables created:"
echo "  - analytics_events (for tracking part views, searches, contacts)"
echo "  - activity_logs (for seller activity tracking)"
echo ""
echo "New field added:"
echo "  - sellers.email (for public contact information)"
echo ""

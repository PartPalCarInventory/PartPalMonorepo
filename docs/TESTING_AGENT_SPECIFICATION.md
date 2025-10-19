# Testing Agent Specification for PartPal

## Agent Overview
The Testing Agent is responsible for ensuring the quality, reliability, and production readiness of the PartPal platform through comprehensive testing strategies.

## Dependencies
- **Backend API Agent** (needs API endpoints to test)
- **IMS Frontend Agent** (needs IMS application to test)
- **Marketplace Frontend Agent** (needs Marketplace to test)
- **Shared UI Agent** (needs components to test)
- **Database Agent** (needs database schemas to test)

## Testing Agent Tasks

### Task 1: `unit-testing`
**Description**: Implement comprehensive unit testing across all components and services

#### Subtasks:
1. **Shared UI Component Tests**
   ```typescript
   // packages/shared-ui/src/components/ui/__tests__/
   - Button.test.tsx          // Test all variants, accessibility
   - Input.test.tsx           // Test validation, error states
   - Card.test.tsx            // Test layout, responsive behavior
   - Modal.test.tsx           // Test focus management, escape handling
   - Table.test.tsx           // Test sorting, pagination, accessibility
   ```

2. **Database Layer Tests**
   ```typescript
   // packages/database/src/__tests__/
   - search-service.test.ts   // Test search functionality, performance
   - prisma-client.test.ts    // Test database operations
   - migrations.test.ts       // Test schema migrations
   - performance.test.ts      // Test query optimization
   ```

3. **Backend API Tests**
   ```typescript
   // services/api/src/__tests__/
   - auth.test.ts             // Test JWT, role-based access
   - users.test.ts            // Test user management endpoints
   - vehicles.test.ts         // Test vehicle CRUD operations
   - parts.test.ts            // Test parts inventory and search
   - sellers.test.ts          // Test seller management
   ```

4. **Frontend Application Tests**
   ```typescript
   // apps/ims/src/__tests__/ and apps/marketplace/src/__tests__/
   - Dashboard.test.tsx       // Test dashboard components
   - VehicleForm.test.tsx     // Test vehicle check-in forms
   - PartsList.test.tsx       // Test inventory management
   - SearchForm.test.tsx      // Test search functionality
   - SellerProfile.test.tsx   // Test seller profiles
   ```

### Task 2: `integration-testing`
**Description**: Test interactions between different system components

#### Subtasks:
1. **API Integration Tests**
   ```typescript
   // tests/integration/api/
   - auth-flow.test.ts        // Complete authentication flow
   - vehicle-to-parts.test.ts // Vehicle check-in to parts listing
   - marketplace-sync.test.ts // IMS to Marketplace synchronization
   - search-integration.test.ts // Search functionality end-to-end
   ```

2. **Database Integration Tests**
   ```typescript
   // tests/integration/database/
   - prisma-integration.test.ts // Database operations with real DB
   - search-performance.test.ts // Search performance with large datasets
   - data-integrity.test.ts     // Foreign key constraints, cascades
   ```

3. **Frontend-API Integration**
   ```typescript
   // tests/integration/frontend/
   - ims-api-integration.test.ts         // IMS app with API
   - marketplace-api-integration.test.ts // Marketplace with API
   - shared-ui-integration.test.ts       // Shared components integration
   ```

### Task 3: `e2e-testing`
**Description**: End-to-end user journey testing using Playwright

#### Subtasks:
1. **PartPal IMS User Journeys**
   ```typescript
   // tests/e2e/ims/
   - seller-onboarding.spec.ts    // Complete seller registration
   - vehicle-checkin.spec.ts      // VIN entry to dismantling
   - inventory-management.spec.ts // Add, edit, manage parts
   - marketplace-publish.spec.ts  // Publish parts to marketplace
   - sales-reporting.spec.ts      // Generate and view reports
   ```

2. **PartPal Marketplace User Journeys**
   ```typescript
   // tests/e2e/marketplace/
   - part-search.spec.ts          // Search by vehicle, part, location
   - part-discovery.spec.ts       // Browse categories, filters
   - seller-contact.spec.ts       // Contact sellers, inquiries
   - mobile-experience.spec.ts    // Mobile responsive behavior
   ```

3. **Cross-Platform Testing**
   ```typescript
   // tests/e2e/cross-platform/
   - desktop-workflows.spec.ts    // Desktop browser testing
   - tablet-workflows.spec.ts     // iPad/tablet specific testing
   - mobile-workflows.spec.ts     // Mobile phone testing
   - pwa-functionality.spec.ts    // Progressive web app features
   ```

### Task 4: `quality-assurance`
**Description**: Comprehensive quality checks including accessibility, performance, and security

#### Subtasks:
1. **Accessibility Testing**
   ```typescript
   // tests/accessibility/
   - wcag-compliance.test.ts      // WCAG 2.1 AA compliance
   - keyboard-navigation.test.ts  // Full keyboard accessibility
   - screen-reader.test.ts        // Screen reader compatibility
   - color-contrast.test.ts       // Color contrast validation
   - focus-management.test.ts     // Focus trap and management
   ```

2. **Performance Testing**
   ```typescript
   // tests/performance/
   - load-testing.spec.ts         // Load testing with k6
   - core-web-vitals.spec.ts      // LCP, FID, CLS measurements
   - api-performance.spec.ts      // API response time testing
   - search-performance.spec.ts   // Search query performance
   - image-optimization.spec.ts   // Image loading and optimization
   ```

3. **Security Testing**
   ```typescript
   // tests/security/
   - authentication.test.ts       // JWT security, session management
   - authorization.test.ts        // Role-based access control
   - input-validation.test.ts     // SQL injection, XSS prevention
   - data-protection.test.ts      // PII handling, GDPR compliance
   - api-security.test.ts         // Rate limiting, API security
   ```

4. **Browser Compatibility**
   ```typescript
   // tests/compatibility/
   - browser-support.spec.ts      // Chrome, Firefox, Safari, Edge
   - mobile-browsers.spec.ts      // Mobile browser compatibility
   - legacy-support.spec.ts       // Older browser versions
   - feature-detection.spec.ts    // Progressive enhancement
   ```

### Task 5: `testing-infrastructure`
**Description**: Set up testing infrastructure, CI/CD integration, and reporting

#### Subtasks:
1. **Test Configuration Setup**
   ```typescript
   // Configure testing tools and environments
   - jest.config.js               // Jest configuration for unit tests
   - playwright.config.ts         // Playwright E2E configuration
   - vitest.config.ts            // Vitest configuration for fast unit tests
   - testing-library.config.ts   // React Testing Library setup
   ```

2. **CI/CD Integration**
   ```yaml
   # .github/workflows/
   - unit-tests.yml              // Run unit tests on PR
   - integration-tests.yml       // Run integration tests
   - e2e-tests.yml              // Run E2E tests in different browsers
   - accessibility-tests.yml     // Run accessibility audits
   - performance-tests.yml       // Run performance benchmarks
   ```

3. **Test Data Management**
   ```typescript
   // tests/fixtures/
   - test-data.ts                // Shared test data and factories
   - database-seeds.ts           // Test database seeding
   - mock-api-responses.ts       // API response mocks
   - test-images.ts              // Test image assets
   ```

4. **Reporting and Monitoring**
   ```typescript
   // tests/reporting/
   - coverage-reporter.ts        // Code coverage reporting
   - performance-reporter.ts     // Performance metrics collection
   - accessibility-reporter.ts   // Accessibility audit results
   - visual-regression.ts        // Visual regression testing
   ```

## PartPal-Specific Testing Requirements

### Critical User Flows to Test
1. **Seller Journey**: Registration → Verification → Vehicle Check-in → Parts Listing → Marketplace Publishing
2. **Buyer Journey**: Search → Filter → Part Discovery → Seller Contact → Inquiry
3. **Business Operations**: Inventory Management → Sales Tracking → Reporting → Analytics

### South African Context Testing
1. **Localization**: Test Afrikaans language support, ZAR currency
2. **Geographic Data**: Test South African provinces, cities, postal codes
3. **Mobile Experience**: Test on common SA mobile devices and networks
4. **Connectivity**: Test offline functionality for poor connectivity areas

### Performance Benchmarks
- **Search Response**: < 200ms for part searches
- **Page Load**: < 2s for initial page load
- **Image Loading**: < 1s for part images
- **API Response**: < 100ms for CRUD operations
- **Database Queries**: < 50ms for optimized searches

### Accessibility Standards
- **WCAG 2.1 AA**: Full compliance for both applications
- **Screen Readers**: NVDA, JAWS, VoiceOver compatibility
- **Keyboard Navigation**: Complete keyboard accessibility
- **Mobile Accessibility**: Touch target sizes, contrast ratios

### Security Testing Focus
- **Authentication**: JWT token security, session management
- **Authorization**: Role-based access (admin/seller/buyer)
- **Data Protection**: PII encryption, GDPR compliance
- **API Security**: Rate limiting, input validation, SQL injection prevention

## Testing Tools Stack

### Unit Testing
- **Jest**: JavaScript testing framework
- **React Testing Library**: Component testing
- **Vitest**: Fast unit test runner
- **MSW**: API mocking

### Integration Testing
- **Supertest**: API integration testing
- **Testcontainers**: Database integration testing
- **Playwright**: Browser integration testing

### E2E Testing
- **Playwright**: Cross-browser E2E testing
- **Percy**: Visual regression testing
- **Lighthouse CI**: Performance and accessibility auditing

### Quality Assurance
- **axe-core**: Accessibility testing
- **Pa11y**: Accessibility CLI testing
- **k6**: Load and performance testing
- **ESLint/Prettier**: Code quality

## Quality Gates

Each task must meet these criteria before completion:

### Unit Testing
- ✅ 90%+ code coverage for critical paths
- ✅ All shared UI components tested
- ✅ All API endpoints tested
- ✅ All database operations tested

### Integration Testing
- ✅ All major user flows tested
- ✅ Database integrity verified
- ✅ API contracts validated
- ✅ Component integration verified

### E2E Testing
- ✅ Critical user journeys pass
- ✅ Cross-browser compatibility verified
- ✅ Mobile responsiveness validated
- ✅ PWA functionality tested

### Quality Assurance
- ✅ WCAG 2.1 AA compliance achieved
- ✅ Performance benchmarks met
- ✅ Security standards validated
- ✅ Browser compatibility confirmed

### Testing Infrastructure
- ✅ CI/CD pipeline configured
- ✅ Test reporting automated
- ✅ Test data management setup
- ✅ Performance monitoring active

This comprehensive testing strategy ensures the PartPal platform meets production quality standards for reliability, accessibility, performance, and security.
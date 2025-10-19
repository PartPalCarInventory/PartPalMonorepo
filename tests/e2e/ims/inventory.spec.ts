import { test, expect } from '@playwright/test';

test.describe('IMS Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as seller user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'seller@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for redirect to IMS dashboard
    await page.waitForURL('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard overview correctly', async ({ page }) => {
    // Check dashboard cards are present
    await expect(page.locator('[data-testid="total-vehicles-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-parts-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-sales-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="monthly-revenue-card"]')).toBeVisible();

    // Verify ZAR currency formatting in revenue card
    const revenueCard = page.locator('[data-testid="monthly-revenue-card"]');
    const revenueText = await revenueCard.textContent();
    expect(revenueText).toMatch(/R\s*[\d,]+\.?\d*/);

    // Check quick action buttons
    await expect(page.locator('[data-testid="add-vehicle-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-part-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-inventory-btn"]')).toBeVisible();
  });

  test('should add a new vehicle successfully', async ({ page }) => {
    // Navigate to add vehicle
    await page.click('[data-testid="add-vehicle-btn"]');
    await expect(page.locator('[data-testid="vehicle-form"]')).toBeVisible();

    // Fill vehicle form
    await page.fill('[data-testid="vin-input"]', '1HGCM82633A123456');
    await page.selectOption('[data-testid="year-select"]', '2018');
    await page.selectOption('[data-testid="make-select"]', 'Toyota');

    // Wait for model options to load
    await page.waitForSelector('[data-testid="model-select"]:not([disabled])');
    await page.selectOption('[data-testid="model-select"]', 'Corolla');

    await page.fill('[data-testid="variant-input"]', '1.6L Manual');
    await page.selectOption('[data-testid="fuel-type-select"]', 'Petrol');
    await page.selectOption('[data-testid="transmission-select"]', 'Manual');
    await page.fill('[data-testid="color-input"]', 'White');
    await page.fill('[data-testid="mileage-input"]', '120000');
    await page.selectOption('[data-testid="condition-select"]', 'GOOD');

    // Set acquisition date
    await page.fill('[data-testid="acquisition-date-input"]', '2024-01-15');

    // Submit form
    await page.click('[data-testid="save-vehicle-btn"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(/vehicle.*added/i);

    // Verify vehicle appears in inventory
    await page.goto('/inventory/vehicles');
    await expect(page.locator('[data-testid="vehicle-list"]')).toContainText('1HGCM82633A123456');
  });

  test('should validate VIN format correctly', async ({ page }) => {
    await page.click('[data-testid="add-vehicle-btn"]');

    // Enter invalid VIN
    await page.fill('[data-testid="vin-input"]', 'INVALID_VIN');
    await page.click('[data-testid="save-vehicle-btn"]');

    // Verify validation error
    await expect(page.locator('[data-testid="vin-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="vin-error"]')).toContainText(/17.*character/i);

    // Enter valid VIN
    await page.fill('[data-testid="vin-input"]', '1HGCM82633A123456');
    await expect(page.locator('[data-testid="vin-error"]')).not.toBeVisible();
  });

  test('should add parts to vehicle', async ({ page }) => {
    // Assume vehicle exists, go to vehicle details
    await page.goto('/inventory/vehicles');
    await page.click('[data-testid="vehicle-row"]');

    // Add new part
    await page.click('[data-testid="add-part-btn"]');
    await expect(page.locator('[data-testid="part-form"]')).toBeVisible();

    // Fill part form
    await page.fill('[data-testid="part-name-input"]', 'Alternator');
    await page.fill('[data-testid="part-number-input"]', 'ALT-12V-90A');
    await page.fill('[data-testid="description-textarea"]', 'High-quality alternator in excellent condition. Tested and guaranteed to work.');
    await page.selectOption('[data-testid="condition-select"]', 'EXCELLENT');
    await page.fill('[data-testid="price-input"]', '850');
    await page.fill('[data-testid="location-input"]', 'A1-B2');
    await page.selectOption('[data-testid="category-select"]', 'Engine Components');

    // Upload part images (mock file upload)
    const fileInput = page.locator('[data-testid="image-upload"]');
    await fileInput.setInputFiles([{
      name: 'alternator.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('mock image data')
    }]);

    // Save part
    await page.click('[data-testid="save-part-btn"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(/part.*added/i);

    // Verify part appears in vehicle parts list
    await expect(page.locator('[data-testid="parts-list"]')).toContainText('Alternator');
    await expect(page.locator('[data-testid="parts-list"]')).toContainText('R 850');
  });

  test('should validate ZAR pricing', async ({ page }) => {
    await page.goto('/inventory/vehicles');
    await page.click('[data-testid="vehicle-row"]');
    await page.click('[data-testid="add-part-btn"]');

    // Test negative price
    await page.fill('[data-testid="price-input"]', '-100');
    await page.click('[data-testid="save-part-btn"]');

    await expect(page.locator('[data-testid="price-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-error"]')).toContainText(/positive/i);

    // Test very high price (should work but show warning)
    await page.fill('[data-testid="price-input"]', '100000');
    const warningMessage = page.locator('[data-testid="price-warning"]');
    if (await warningMessage.isVisible()) {
      await expect(warningMessage).toContainText(/high.*price/i);
    }

    // Test valid price
    await page.fill('[data-testid="price-input"]', '1500');
    await expect(page.locator('[data-testid="price-error"]')).not.toBeVisible();
  });

  test('should toggle marketplace listing', async ({ page }) => {
    // Go to parts management
    await page.goto('/inventory/parts');
    await page.waitForSelector('[data-testid="parts-table"]');

    // Find a part and toggle marketplace listing
    const firstPartRow = page.locator('[data-testid="part-row"]').first();
    const marketplaceToggle = firstPartRow.locator('[data-testid="marketplace-toggle"]');

    // Get initial state
    const initialState = await marketplaceToggle.isChecked();

    // Toggle the switch
    await marketplaceToggle.click();

    // Verify state changed
    const newState = await marketplaceToggle.isChecked();
    expect(newState).toBe(!initialState);

    // Verify confirmation message
    const statusMessage = firstPartRow.locator('[data-testid="listing-status"]');
    if (newState) {
      await expect(statusMessage).toContainText(/listed.*marketplace/i);
    } else {
      await expect(statusMessage).toContainText(/not.*listed/i);
    }
  });

  test('should manage part inventory status', async ({ page }) => {
    await page.goto('/inventory/parts');
    await page.click('[data-testid="part-row"]');

    // Test status updates
    const statusSelect = page.locator('[data-testid="status-select"]');
    await statusSelect.selectOption('RESERVED');

    // Verify status change
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('RESERVED');

    // Mark as sold
    await statusSelect.selectOption('SOLD');
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('SOLD');

    // Verify sold part behavior
    const marketplaceToggle = page.locator('[data-testid="marketplace-toggle"]');
    await expect(marketplaceToggle).toBeDisabled(); // Can't list sold parts
  });

  test('should generate and view reports', async ({ page }) => {
    await page.goto('/reports');

    // Select date range
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-12-31');

    // Generate sales report
    await page.click('[data-testid="generate-sales-report"]');
    await page.waitForSelector('[data-testid="sales-report-table"]');

    // Verify report contains expected columns
    await expect(page.locator('[data-testid="report-header"]')).toContainText('Date');
    await expect(page.locator('[data-testid="report-header"]')).toContainText('Part');
    await expect(page.locator('[data-testid="report-header"]')).toContainText('Price');
    await expect(page.locator('[data-testid="report-header"]')).toContainText('Buyer');

    // Verify ZAR formatting in report
    const priceCell = page.locator('[data-testid="price-cell"]').first();
    if (await priceCell.isVisible()) {
      const priceText = await priceCell.textContent();
      expect(priceText).toMatch(/R\s*[\d,]+\.?\d*/);
    }

    // Test export functionality
    await page.click('[data-testid="export-csv-btn"]');
    // Note: File download testing would require additional setup
  });

  test('should handle bulk operations', async ({ page }) => {
    await page.goto('/inventory/parts');

    // Select multiple parts
    await page.check('[data-testid="select-all-parts"]');

    // Verify bulk actions become available
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();

    // Test bulk marketplace listing
    await page.click('[data-testid="bulk-list-marketplace"]');
    await expect(page.locator('[data-testid="confirmation-modal"]')).toBeVisible();
    await page.click('[data-testid="confirm-bulk-action"]');

    // Verify success message
    await expect(page.locator('[data-testid="bulk-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="bulk-success"]')).toContainText(/parts.*listed/i);
  });

  test('should search and filter inventory', async ({ page }) => {
    await page.goto('/inventory/parts');

    // Test search functionality
    await page.fill('[data-testid="inventory-search"]', 'alternator');
    await page.click('[data-testid="search-btn"]');

    // Verify filtered results
    const partRows = page.locator('[data-testid="part-row"]');
    const rowCount = await partRows.count();

    for (let i = 0; i < Math.min(rowCount, 3); i++) {
      const row = partRows.nth(i);
      const partName = await row.locator('[data-testid="part-name"]').textContent();
      expect(partName?.toLowerCase()).toContain('alternator');
    }

    // Test condition filter
    await page.selectOption('[data-testid="condition-filter"]', 'EXCELLENT');
    await page.click('[data-testid="apply-filters"]');

    // Verify condition filtering
    const conditionBadges = page.locator('[data-testid="condition-badge"]');
    const badgeCount = await conditionBadges.count();

    for (let i = 0; i < badgeCount; i++) {
      const badge = conditionBadges.nth(i);
      const conditionText = await badge.textContent();
      expect(conditionText?.trim()).toBe('EXCELLENT');
    }
  });

  test('should handle mobile layout correctly', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.setViewportSize({ width: 768, height: 1024 }); // Tablet size
    }

    await page.goto('/dashboard');

    // Verify mobile navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu-toggle"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
    }

    // Check responsive dashboard layout
    const dashboardCards = page.locator('[data-testid="dashboard-card"]');
    const cardCount = await dashboardCards.count();

    // On mobile, cards should stack vertically
    if (isMobile && cardCount > 1) {
      const firstCard = dashboardCards.first();
      const secondCard = dashboardCards.nth(1);

      const firstCardBox = await firstCard.boundingBox();
      const secondCardBox = await secondCard.boundingBox();

      if (firstCardBox && secondCardBox) {
        // Second card should be below first card (higher Y position)
        expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 20);
      }
    }

    // Test mobile inventory table
    await page.goto('/inventory/parts');

    // On mobile, table might be horizontally scrollable or use cards
    const inventoryContainer = page.locator('[data-testid="inventory-container"]');
    await expect(inventoryContainer).toBeVisible();

    // Check touch targets are large enough
    const actionButtons = page.locator('[data-testid="part-action-btn"]');
    const buttonCount = await actionButtons.count();

    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = actionButtons.nth(i);
      const buttonBox = await button.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44); // Minimum touch target
      }
    }
  });

  test('should handle offline functionality', async ({ page }) => {
    // Go online first to load the page
    await page.goto('/inventory/parts');
    await page.waitForLoadState('networkidle');

    // Go offline
    await page.context().setOffline(true);

    // Try to add a part while offline
    await page.click('[data-testid="add-part-btn"]');

    // Verify offline indicator appears
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText(/offline/i);

    // Try to save part (should queue for later)
    await page.fill('[data-testid="part-name-input"]', 'Offline Part');
    await page.click('[data-testid="save-part-btn"]');

    // Verify queued message
    await expect(page.locator('[data-testid="queued-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="queued-message"]')).toContainText(/queued.*sync/i);

    // Go back online
    await page.context().setOffline(false);

    // Verify sync happens
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  });

  test('should display business analytics', async ({ page }) => {
    await page.goto('/analytics');

    // Verify analytics dashboard
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();

    // Check key metrics
    await expect(page.locator('[data-testid="total-revenue-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="avg-part-price-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-selling-parts-metric"]')).toBeVisible();

    // Verify charts are rendered
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="sales-trend-chart"]')).toBeVisible();

    // Test date range selector
    await page.selectOption('[data-testid="date-range-select"]', 'last-30-days');
    await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden' });

    // Verify charts update with new data
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();

    // Check ZAR formatting in analytics
    const revenueMetric = page.locator('[data-testid="total-revenue-metric"]');
    const revenueText = await revenueMetric.textContent();
    expect(revenueText).toMatch(/R\s*[\d,]+\.?\d*/);
  });
});
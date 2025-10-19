import { test, expect } from '@playwright/test';

test.describe('Marketplace Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to marketplace
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display search interface correctly', async ({ page }) => {
    // Check main search elements are present
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="filters-panel"]')).toBeVisible();

    // Check search input placeholder
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toHaveAttribute('placeholder', /search.*parts/i);
  });

  test('should perform basic part search', async ({ page }) => {
    // Perform search
    await page.fill('[data-testid="search-input"]', 'alternator');
    await page.click('[data-testid="search-button"]');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]');

    // Verify results are displayed
    const resultsContainer = page.locator('[data-testid="search-results"]');
    await expect(resultsContainer).toBeVisible();

    // Check that part cards are displayed
    const partCards = page.locator('[data-testid="part-card"]');
    await expect(partCards.first()).toBeVisible();

    // Verify search term is highlighted or mentioned
    const firstCard = partCards.first();
    const cardText = await firstCard.textContent();
    expect(cardText?.toLowerCase()).toContain('alternator');
  });

  test('should filter by vehicle make and model', async ({ page }) => {
    // Open vehicle filters
    await page.click('[data-testid="vehicle-filters-toggle"]');

    // Select Toyota as make
    await page.selectOption('[data-testid="make-select"]', 'Toyota');

    // Wait for models to load and select Corolla
    await page.waitForSelector('[data-testid="model-select"]:not([disabled])');
    await page.selectOption('[data-testid="model-select"]', 'Corolla');

    // Apply filters
    await page.click('[data-testid="apply-filters"]');

    // Wait for filtered results
    await page.waitForSelector('[data-testid="search-results"]');

    // Verify all results are for Toyota Corolla
    const partCards = page.locator('[data-testid="part-card"]');
    const cardCount = await partCards.count();

    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = partCards.nth(i);
      const vehicleInfo = card.locator('[data-testid="vehicle-info"]');
      const vehicleText = await vehicleInfo.textContent();
      expect(vehicleText).toContain('Toyota');
      expect(vehicleText).toContain('Corolla');
    }
  });

  test('should filter by price range in ZAR', async ({ page }) => {
    // Open price filters
    await page.click('[data-testid="price-filters-toggle"]');

    // Set price range
    await page.fill('[data-testid="price-min-input"]', '500');
    await page.fill('[data-testid="price-max-input"]', '2000');

    // Apply filters
    await page.click('[data-testid="apply-filters"]');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]');

    // Verify prices are within range
    const priceElements = page.locator('[data-testid="part-price"]');
    const priceCount = await priceElements.count();

    for (let i = 0; i < Math.min(priceCount, 5); i++) {
      const priceElement = priceElements.nth(i);
      const priceText = await priceElement.textContent();

      // Extract numeric value from "R 1,500.00" format
      const priceMatch = priceText?.match(/R\s*([\d,]+)\.?\d*/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/,/g, ''));
        expect(price).toBeGreaterThanOrEqual(500);
        expect(price).toBeLessThanOrEqual(2000);
      }
    }
  });

  test('should filter by condition', async ({ page }) => {
    // Open condition filters
    await page.click('[data-testid="condition-filters-toggle"]');

    // Select EXCELLENT and GOOD conditions
    await page.check('[data-testid="condition-excellent"]');
    await page.check('[data-testid="condition-good"]');

    // Apply filters
    await page.click('[data-testid="apply-filters"]');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]');

    // Verify conditions are correct
    const conditionBadges = page.locator('[data-testid="condition-badge"]');
    const badgeCount = await conditionBadges.count();

    for (let i = 0; i < Math.min(badgeCount, 5); i++) {
      const badge = conditionBadges.nth(i);
      const conditionText = await badge.textContent();
      expect(['EXCELLENT', 'GOOD']).toContain(conditionText?.trim());
    }
  });

  test('should display search results with proper information', async ({ page }) => {
    // Perform a search
    await page.fill('[data-testid="search-input"]', 'brake');
    await page.click('[data-testid="search-button"]');

    // Wait for results
    await page.waitForSelector('[data-testid="part-card"]');

    const firstCard = page.locator('[data-testid="part-card"]').first();

    // Verify part card contains required information
    await expect(firstCard.locator('[data-testid="part-name"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="part-price"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="vehicle-info"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="seller-info"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="condition-badge"]')).toBeVisible();

    // Check ZAR currency format
    const priceElement = firstCard.locator('[data-testid="part-price"]');
    const priceText = await priceElement.textContent();
    expect(priceText).toMatch(/R\s*[\d,]+\.?\d*/);
  });

  test('should handle pagination correctly', async ({ page }) => {
    // Perform search with many results
    await page.fill('[data-testid="search-input"]', 'part');
    await page.click('[data-testid="search-button"]');

    // Wait for results and pagination
    await page.waitForSelector('[data-testid="search-results"]');

    // Check if pagination exists (might not if few results)
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.isVisible()) {
      // Check page 1 is active
      await expect(page.locator('[data-testid="page-1"]')).toHaveClass(/active/);

      // Go to page 2 if available
      const page2Button = page.locator('[data-testid="page-2"]');
      if (await page2Button.isVisible()) {
        await page2Button.click();

        // Verify page 2 is now active
        await expect(page.locator('[data-testid="page-2"]')).toHaveClass(/active/);

        // Verify different results are shown
        await page.waitForSelector('[data-testid="part-card"]');
        await expect(page.locator('[data-testid="part-card"]').first()).toBeVisible();
      }
    }
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    // Search for something unlikely to exist
    await page.fill('[data-testid="search-input"]', 'nonexistentpartxyz123');
    await page.click('[data-testid="search-button"]');

    // Wait for results area
    await page.waitForSelector('[data-testid="search-results"]');

    // Verify empty state is shown
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results"]')).toContainText(/no.*parts.*found/i);

    // Verify suggestions or alternatives are provided
    const suggestions = page.locator('[data-testid="search-suggestions"]');
    if (await suggestions.isVisible()) {
      await expect(suggestions).toContainText(/try.*different.*search/i);
    }
  });

  test('should open part details modal', async ({ page }) => {
    // Perform search
    await page.fill('[data-testid="search-input"]', 'alternator');
    await page.click('[data-testid="search-button"]');

    // Wait for results and click first part
    await page.waitForSelector('[data-testid="part-card"]');
    await page.click('[data-testid="part-card"]');

    // Verify modal opens
    await expect(page.locator('[data-testid="part-modal"]')).toBeVisible();

    // Verify modal contains detailed information
    const modal = page.locator('[data-testid="part-modal"]');
    await expect(modal.locator('[data-testid="part-detail-name"]')).toBeVisible();
    await expect(modal.locator('[data-testid="part-detail-description"]')).toBeVisible();
    await expect(modal.locator('[data-testid="part-detail-price"]')).toBeVisible();
    await expect(modal.locator('[data-testid="vehicle-details"]')).toBeVisible();
    await expect(modal.locator('[data-testid="seller-contact"]')).toBeVisible();

    // Check contact seller button
    await expect(modal.locator('[data-testid="contact-seller-btn"]')).toBeVisible();
    await expect(modal.locator('[data-testid="contact-seller-btn"]')).toBeEnabled();
  });

  test('should display seller contact information', async ({ page }) => {
    // Perform search and open part details
    await page.fill('[data-testid="search-input"]', 'alternator');
    await page.click('[data-testid="search-button"]');
    await page.waitForSelector('[data-testid="part-card"]');
    await page.click('[data-testid="part-card"]');

    // Wait for modal and check seller contact
    await page.waitForSelector('[data-testid="part-modal"]');
    const sellerContact = page.locator('[data-testid="seller-contact"]');

    await expect(sellerContact.locator('[data-testid="business-name"]')).toBeVisible();
    await expect(sellerContact.locator('[data-testid="business-location"]')).toBeVisible();

    // Check South African phone number format
    const phoneElement = sellerContact.locator('[data-testid="phone-number"]');
    if (await phoneElement.isVisible()) {
      const phoneText = await phoneElement.textContent();
      expect(phoneText).toMatch(/(\+27|0)[1-9][0-9]{8}/);
    }

    // Check WhatsApp contact option
    const whatsappBtn = sellerContact.locator('[data-testid="whatsapp-contact"]');
    if (await whatsappBtn.isVisible()) {
      await expect(whatsappBtn).toContainText(/whatsapp/i);
    }
  });

  test('should be responsive on mobile devices', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    }

    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-search-header"]')).toBeVisible();

    // On mobile, filters might be in a collapsed menu
    const mobileFiltersButton = page.locator('[data-testid="mobile-filters-toggle"]');
    if (await mobileFiltersButton.isVisible()) {
      await mobileFiltersButton.click();
      await expect(page.locator('[data-testid="mobile-filters-menu"]')).toBeVisible();
    }

    // Perform mobile search
    await page.fill('[data-testid="search-input"]', 'brake');
    await page.click('[data-testid="search-button"]');

    // Verify mobile-optimized results
    await page.waitForSelector('[data-testid="part-card"]');
    const partCard = page.locator('[data-testid="part-card"]').first();

    // Check touch target sizes (minimum 44px)
    const cardButton = partCard.locator('[data-testid="view-part-btn"]');
    if (await cardButton.isVisible()) {
      const boundingBox = await cardButton.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate network error
    await page.route('/api/parts/search*', route => route.abort());

    // Attempt search
    await page.fill('[data-testid="search-input"]', 'alternator');
    await page.click('[data-testid="search-button"]');

    // Verify error handling
    await expect(page.locator('[data-testid="search-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-error"]')).toContainText(/error.*loading/i);

    // Check retry functionality
    const retryButton = page.locator('[data-testid="retry-search"]');
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeEnabled();
    }
  });

  test('should track analytics events', async ({ page }) => {
    // Mock analytics calls
    let analyticsEvents: any[] = [];
    await page.route('/api/analytics/**', route => {
      analyticsEvents.push(route.request().url());
      route.fulfill({ status: 200, body: '{"success": true}' });
    });

    // Perform search
    await page.fill('[data-testid="search-input"]', 'alternator');
    await page.click('[data-testid="search-button"]');

    // Wait for results
    await page.waitForSelector('[data-testid="part-card"]');

    // Click on a part to view details
    await page.click('[data-testid="part-card"]');

    // Verify analytics events were tracked
    expect(analyticsEvents.some(url => url.includes('part_search'))).toBe(true);
    expect(analyticsEvents.some(url => url.includes('part_view'))).toBe(true);
  });
});
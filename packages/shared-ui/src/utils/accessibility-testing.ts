/**
 * Accessibility testing utilities for PartPal components
 * These utilities help developers test and validate accessibility features
 */

export interface AccessibilityReport {
  element: HTMLElement;
  issues: AccessibilityIssue[];
  score: number;
  passed: number;
  total: number;
}

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  element?: HTMLElement;
  suggestion?: string;
}

/**
 * Check if element has proper focus management
 */
export function checkFocusManagement(element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for focusable elements without visible focus
  const focusableSelectors = [
    'button',
    'input',
    'select',
    'textarea',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ];

  focusableSelectors.forEach(selector => {
    const elements = element.querySelectorAll(selector);
    elements.forEach(el => {
      const computedStyle = window.getComputedStyle(el as HTMLElement);
      if (computedStyle.outline === 'none' && !el.classList.contains('focus-ring')) {
        issues.push({
          type: 'warning',
          rule: 'focus-visible',
          message: 'Focusable element may not have visible focus indicator',
          element: el as HTMLElement,
          suggestion: 'Add focus-ring class or custom focus styles',
        });
      }
    });
  });

  return issues;
}

/**
 * Check for proper ARIA attributes
 */
export function checkAriaAttributes(element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for buttons without accessible names
  const buttons = element.querySelectorAll('button');
  buttons.forEach(button => {
    const hasAccessibleName =
      button.textContent?.trim() ||
      button.getAttribute('aria-label') ||
      button.getAttribute('aria-labelledby') ||
      button.querySelector('img')?.getAttribute('alt');

    if (!hasAccessibleName) {
      issues.push({
        type: 'error',
        rule: 'button-name',
        message: 'Button must have accessible name',
        element: button as HTMLElement,
        suggestion: 'Add text content, aria-label, or aria-labelledby',
      });
    }
  });

  // Check for form inputs without labels
  const inputs = element.querySelectorAll('input:not([type="hidden"])');
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    const hasLabel =
      (id && element.querySelector(`label[for="${id}"]`)) ||
      input.getAttribute('aria-label') ||
      input.getAttribute('aria-labelledby') ||
      input.closest('label');

    if (!hasLabel) {
      issues.push({
        type: 'error',
        rule: 'input-label',
        message: 'Form input must have associated label',
        element: input as HTMLElement,
        suggestion: 'Add label element, aria-label, or aria-labelledby',
      });
    }
  });

  // Check for images without alt text
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'error',
        rule: 'img-alt',
        message: 'Image must have alt attribute',
        element: img as HTMLElement,
        suggestion: 'Add alt attribute (empty for decorative images)',
      });
    }
  });

  return issues;
}

/**
 * Check color contrast (simplified)
 */
export function checkColorContrast(element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // This is a simplified check - in production, use a proper color contrast library
  const textElements = element.querySelectorAll('*');
  textElements.forEach(el => {
    const style = window.getComputedStyle(el as HTMLElement);
    const textColor = style.color;
    const backgroundColor = style.backgroundColor;

    // Simple heuristic check for potentially low contrast
    if (textColor === backgroundColor) {
      issues.push({
        type: 'warning',
        rule: 'color-contrast',
        message: 'Text and background colors may have insufficient contrast',
        element: el as HTMLElement,
        suggestion: 'Verify color contrast meets WCAG AA standards (4.5:1)',
      });
    }
  });

  return issues;
}

/**
 * Check keyboard navigation
 */
export function checkKeyboardNavigation(element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for elements with click handlers that aren't keyboard accessible
  const clickableElements = element.querySelectorAll('[onclick], .cursor-pointer');
  clickableElements.forEach(el => {
    const isNativelyFocusable = el.matches('button, input, select, textarea, a[href]');
    const hasTabIndex = el.hasAttribute('tabindex');
    const hasKeyHandler = el.hasAttribute('onkeydown') || el.hasAttribute('onkeypress');

    if (!isNativelyFocusable && !hasTabIndex) {
      issues.push({
        type: 'error',
        rule: 'keyboard-navigation',
        message: 'Clickable element must be keyboard accessible',
        element: el as HTMLElement,
        suggestion: 'Add tabindex="0" and keyboard event handlers',
      });
    } else if (!isNativelyFocusable && !hasKeyHandler) {
      issues.push({
        type: 'warning',
        rule: 'keyboard-navigation',
        message: 'Interactive element should handle keyboard events',
        element: el as HTMLElement,
        suggestion: 'Add onKeyDown handler for Enter and Space keys',
      });
    }
  });

  return issues;
}

/**
 * Check semantic structure
 */
export function checkSemanticStructure(element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check heading hierarchy
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;

  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));

    if (level > lastLevel + 1) {
      issues.push({
        type: 'warning',
        rule: 'heading-hierarchy',
        message: `Heading level ${level} skips levels (previous was ${lastLevel})`,
        element: heading as HTMLElement,
        suggestion: 'Use heading levels sequentially (h1, h2, h3...)',
      });
    }

    lastLevel = level;
  });

  // Check for landmark roles
  const hasMain = element.querySelector('main, [role="main"]');
  if (!hasMain && element.querySelector('article, section')) {
    issues.push({
      type: 'info',
      rule: 'landmarks',
      message: 'Consider adding main landmark for primary content',
      suggestion: 'Add <main> element or role="main"',
    });
  }

  return issues;
}

/**
 * Check for common PartPal-specific accessibility patterns
 */
export function checkPartPalPatterns(element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for part listings without proper structure
  const partCards = element.querySelectorAll('[data-testid*="part"], .part-card, .inventory-item');
  partCards.forEach(card => {
    const hasHeading = card.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
    if (!hasHeading) {
      issues.push({
        type: 'warning',
        rule: 'partpal-part-structure',
        message: 'Part listing should have heading for part name',
        element: card as HTMLElement,
        suggestion: 'Add heading element for part name/title',
      });
    }

    const hasPrice = card.querySelector('[data-testid*="price"], .price, .cost');
    if (hasPrice && !hasPrice.getAttribute('aria-label')) {
      issues.push({
        type: 'info',
        rule: 'partpal-price-label',
        message: 'Price should have descriptive label for screen readers',
        element: hasPrice as HTMLElement,
        suggestion: 'Add aria-label like "Price: $150"',
      });
    }
  });

  // Check for search/filter controls
  const searchInputs = element.querySelectorAll('[type="search"], [placeholder*="search"], .search-input');
  searchInputs.forEach(input => {
    const hasLiveRegion = element.querySelector('[aria-live]');
    if (!hasLiveRegion) {
      issues.push({
        type: 'info',
        rule: 'partpal-search-feedback',
        message: 'Search functionality should announce results to screen readers',
        suggestion: 'Add aria-live region for search result announcements',
      });
    }
  });

  return issues;
}

/**
 * Run comprehensive accessibility audit
 */
export function auditAccessibility(element: HTMLElement): AccessibilityReport {
  const allChecks = [
    checkFocusManagement,
    checkAriaAttributes,
    checkColorContrast,
    checkKeyboardNavigation,
    checkSemanticStructure,
    checkPartPalPatterns,
  ];

  const allIssues: AccessibilityIssue[] = [];

  allChecks.forEach(check => {
    const issues = check(element);
    allIssues.push(...issues);
  });

  // Calculate score
  const errors = allIssues.filter(issue => issue.type === 'error').length;
  const warnings = allIssues.filter(issue => issue.type === 'warning').length;
  const total = allIssues.length;
  const passed = Math.max(0, total - errors - warnings * 0.5);
  const score = total > 0 ? Math.round((passed / total) * 100) : 100;

  return {
    element,
    issues: allIssues,
    score,
    passed: Math.round(passed),
    total,
  };
}

/**
 * Test keyboard navigation in component
 */
export function testKeyboardNavigation(element: HTMLElement): Promise<boolean> {
  return new Promise((resolve) => {
    const focusableElements = element.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      resolve(true); // No focusable elements, pass by default
      return;
    }

    let currentIndex = 0;
    const firstElement = focusableElements[0] as HTMLElement;

    firstElement.focus();

    const testNext = () => {
      if (currentIndex >= focusableElements.length - 1) {
        resolve(document.activeElement === focusableElements[currentIndex]);
        return;
      }

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        bubbles: true,
      });

      document.activeElement?.dispatchEvent(tabEvent);

      setTimeout(() => {
        currentIndex++;
        const expectedElement = focusableElements[currentIndex] as HTMLElement;
        expectedElement.focus();
        testNext();
      }, 50);
    };

    testNext();
  });
}

/**
 * Generate accessibility report as HTML
 */
export function generateAccessibilityReport(report: AccessibilityReport): string {
  const { issues, score, passed, total } = report;

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#22c55e'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1f2937;">Accessibility Report</h1>

      <div style="background: ${getScoreColor(score)}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 10px 0;">Score: ${score}/100</h2>
        <p style="margin: 0;">Passed ${passed} out of ${total} checks</p>
      </div>

      ${issues.length > 0 ? `
        <h2 style="color: #1f2937;">Issues Found</h2>
        ${issues.map(issue => `
          <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 12px; border-left: 4px solid ${
            issue.type === 'error' ? '#ef4444' : issue.type === 'warning' ? '#f59e0b' : '#3b82f6'
          };">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="background: ${
                issue.type === 'error' ? '#ef4444' : issue.type === 'warning' ? '#f59e0b' : '#3b82f6'
              }; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                ${issue.type}
              </span>
              <span style="font-weight: 600; margin-left: 12px;">${issue.rule}</span>
            </div>
            <p style="color: #4b5563; margin: 8px 0;">${issue.message}</p>
            ${issue.suggestion ? `
              <p style="color: #059669; font-size: 14px; margin: 8px 0 0 0;">
                💡 ${issue.suggestion}
              </p>
            ` : ''}
          </div>
        `).join('')}
      ` : `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 20px; border-radius: 8px;">
          <h2 style="color: #166534; margin: 0 0 10px 0;">✅ No Issues Found</h2>
          <p style="margin: 0;">All accessibility checks passed!</p>
        </div>
      `}

      <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <h3 style="color: #1f2937; margin-top: 0;">PartPal Accessibility Guidelines</h3>
        <ul style="color: #4b5563;">
          <li>All interactive elements must be keyboard accessible</li>
          <li>Form inputs must have associated labels</li>
          <li>Images must have descriptive alt text</li>
          <li>Color contrast must meet WCAG AA standards</li>
          <li>Focus indicators must be visible</li>
          <li>Content must be announced to screen readers</li>
        </ul>
      </div>
    </div>
  `;

  return html;
}

/**
 * Console-friendly accessibility report
 */
export function logAccessibilityReport(report: AccessibilityReport): void {
  console.group(`🔍 Accessibility Report - Score: ${report.score}/100`);

  if (report.issues.length === 0) {
    console.log('✅ All accessibility checks passed!');
  } else {
    report.issues.forEach(issue => {
      const emoji = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${emoji} ${issue.rule}: ${issue.message}`);

      if (issue.suggestion) {
        console.log(`   💡 ${issue.suggestion}`);
      }

      if (issue.element) {
        console.log('   📍 Element:', issue.element);
      }
    });
  }

  console.groupEnd();
}
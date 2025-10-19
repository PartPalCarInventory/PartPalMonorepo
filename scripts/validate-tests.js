#!/usr/bin/env node

/**
 * Simple test setup validation for PartPal
 */

const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substring(11, 19);
  const prefix = `[${timestamp}]`;

  switch (type) {
    case 'success':
      console.log(`${prefix} ✓ ${message}`);
      break;
    case 'error':
      console.log(`${prefix} ✗ ${message}`);
      break;
    case 'warning':
      console.log(`${prefix} ⚠ ${message}`);
      break;
    default:
      console.log(`${prefix} ℹ ${message}`);
      break;
  }
}

function validateTestSetup() {
  log('Validating PartPal Test Setup...', 'info');

  const testFiles = [
    // Jest configurations
    'packages/shared-ui/jest.config.js',
    'packages/shared-utils/jest.config.js',
    'packages/shared-types/jest.config.js',
    'packages/database/jest.config.js',
    'apps/ims/jest.config.js',
    'apps/marketplace/jest.config.js',

    // Test files
    'packages/shared-ui/src/components/ui/__tests__/Card.test.tsx',
    'packages/shared-ui/src/components/ui/__tests__/Input.test.tsx',
    'packages/shared-utils/src/__tests__/analytics.test.ts',
    'packages/shared-types/src/__tests__/types.test.ts',
    'packages/database/src/__tests__/cache.test.ts',
    'services/api/src/__tests__/integration/parts.test.ts',

    // E2E tests
    'tests/e2e/marketplace/search.spec.ts',
    'tests/e2e/ims/inventory.spec.ts',
    'tests/playwright.config.ts',

    // Test setup
    'tests/setup/jest.setup.ts',
    'tests/jest.config.base.js',
    'tests/fixtures/test-data.ts',

    // CI/CD
    '.github/workflows/test.yml'
  ];

  let foundFiles = 0;
  let missingFiles = 0;

  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`Found: ${file}`, 'success');
      foundFiles++;
    } else {
      log(`Missing: ${file}`, 'error');
      missingFiles++;
    }
  });

  log('', 'info');
  log('='.repeat(60), 'info');
  log('Test Setup Validation Results', 'info');
  log('='.repeat(60), 'info');
  log(`Total files checked: ${testFiles.length}`, 'info');
  log(`Files found: ${foundFiles}`, 'success');
  log(`Files missing: ${missingFiles}`, missingFiles > 0 ? 'error' : 'success');

  // Check package.json scripts
  log('', 'info');
  log('Checking test scripts in package.json files...', 'info');

  const packages = [
    'packages/shared-ui/package.json',
    'packages/shared-utils/package.json',
    'packages/shared-types/package.json',
    'packages/database/package.json',
    'services/api/package.json',
    'apps/ims/package.json',
    'apps/marketplace/package.json'
  ];

  packages.forEach(pkgPath => {
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.scripts && pkg.scripts.test) {
        log(`✓ Test script found in ${pkgPath}`, 'success');
      } else {
        log(`✗ No test script in ${pkgPath}`, 'warning');
      }
    }
  });

  // Summary
  log('', 'info');
  if (missingFiles === 0) {
    log('🎉 All test files are properly configured!', 'success');
    log('Test infrastructure is ready for PartPal development.', 'success');
  } else {
    log(`⚠ ${missingFiles} files are missing from the test setup.`, 'warning');
  }

  // Instructions
  log('', 'info');
  log('Next steps to run tests:', 'info');
  log('1. Install dependencies: pnpm install', 'info');
  log('2. Run package tests: pnpm --filter @partpal/shared-ui test', 'info');
  log('3. Run API tests: pnpm --filter @partpal/api test', 'info');
  log('4. Run E2E tests: npx playwright test', 'info');
  log('5. Use automated runner: node scripts/test-runner.js', 'info');

  return missingFiles === 0;
}

if (require.main === module) {
  const success = validateTestSetup();
  process.exit(success ? 0 : 1);
}

module.exports = { validateTestSetup };
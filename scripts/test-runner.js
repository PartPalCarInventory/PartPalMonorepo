#!/usr/bin/env node

/**
 * PartPal Test Runner
 * Comprehensive testing automation for the PartPal monorepo
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class TestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      packages: {},
      apps: {},
      services: {},
      e2e: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = `[${timestamp}]`;

    switch (type) {
      case 'success':
        console.log(chalk.green(`${prefix} ✓ ${message}`));
        break;
      case 'error':
        console.log(chalk.red(`${prefix} ✗ ${message}`));
        break;
      case 'warning':
        console.log(chalk.yellow(`${prefix} ⚠ ${message}`));
        break;
      case 'info':
      default:
        console.log(chalk.blue(`${prefix} ℹ ${message}`));
        break;
    }
  }

  async runCommand(command, cwd = process.cwd(), options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('pnpm', ['run', command], {
        cwd,
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      if (options.silent) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout, stderr });
        } else {
          reject({ success: false, code, stdout, stderr });
        }
      });

      child.on('error', (error) => {
        reject({ success: false, error: error.message });
      });
    });
  }

  async checkTestScripts() {
    this.log('Checking test script availability...', 'info');

    const workspaces = [
      { path: 'packages/shared-ui', name: '@partpal/shared-ui' },
      { path: 'packages/shared-utils', name: '@partpal/shared-utils' },
      { path: 'packages/shared-types', name: '@partpal/shared-types' },
      { path: 'packages/database', name: '@partpal/database' },
      { path: 'services/api', name: '@partpal/api' },
      { path: 'apps/ims', name: '@partpal/ims' },
      { path: 'apps/marketplace', name: '@partpal/marketplace' }
    ];

    for (const workspace of workspaces) {
      const packageJsonPath = path.join(workspace.path, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.scripts && packageJson.scripts.test) {
          this.log(`✓ Test script found for ${workspace.name}`, 'success');
        } else {
          this.log(`✗ No test script for ${workspace.name}`, 'warning');
        }
      }
    }
  }

  async runPackageTests() {
    this.log('Running package tests...', 'info');

    const packages = [
      { path: 'packages/shared-ui', name: 'shared-ui' },
      { path: 'packages/shared-utils', name: 'shared-utils' },
      { path: 'packages/shared-types', name: 'shared-types' },
      { path: 'packages/database', name: 'database' }
    ];

    for (const pkg of packages) {
      this.log(`Testing ${pkg.name}...`, 'info');
      try {
        const result = await this.runCommand('test:coverage', pkg.path, { silent: true });
        this.results.packages[pkg.name] = { success: true, ...result };
        this.log(`✓ ${pkg.name} tests passed`, 'success');
        this.results.summary.passed++;
      } catch (error) {
        this.results.packages[pkg.name] = { success: false, ...error };
        this.log(`✗ ${pkg.name} tests failed: ${error.error || error.stderr}`, 'error');
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    }
  }

  async runServiceTests() {
    this.log('Running service tests...', 'info');

    const service = { path: 'services/api', name: 'api' };
    this.log(`Testing ${service.name}...`, 'info');

    try {
      const result = await this.runCommand('test', service.path, { silent: true });
      this.results.services[service.name] = { success: true, ...result };
      this.log(`✓ ${service.name} tests passed`, 'success');
      this.results.summary.passed++;
    } catch (error) {
      this.results.services[service.name] = { success: false, ...error };
      this.log(`✗ ${service.name} tests failed: ${error.error || error.stderr}`, 'error');
      this.results.summary.failed++;
    }
    this.results.summary.total++;
  }

  async runAppTests() {
    this.log('Running application tests...', 'info');

    const apps = [
      { path: 'apps/ims', name: 'ims' },
      { path: 'apps/marketplace', name: 'marketplace' }
    ];

    for (const app of apps) {
      this.log(`Testing ${app.name}...`, 'info');
      try {
        const result = await this.runCommand('test', app.path, { silent: true });
        this.results.apps[app.name] = { success: true, ...result };
        this.log(`✓ ${app.name} tests passed`, 'success');
        this.results.summary.passed++;
      } catch (error) {
        this.results.apps[app.name] = { success: false, ...error };
        this.log(`✗ ${app.name} tests failed: ${error.error || error.stderr}`, 'error');
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    }
  }

  async runE2ETests() {
    this.log('Running E2E tests...', 'info');

    try {
      // Start services in background
      this.log('Starting development servers...', 'info');

      const apiServer = spawn('pnpm', ['run', 'dev:api'], {
        stdio: 'pipe',
        shell: true
      });

      const imsServer = spawn('pnpm', ['run', 'dev:ims'], {
        stdio: 'pipe',
        shell: true
      });

      const marketplaceServer = spawn('pnpm', ['run', 'dev:marketplace'], {
        stdio: 'pipe',
        shell: true
      });

      // Wait for servers to start
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Run Playwright tests
      const result = await this.runCommand('test:e2e', 'tests', { silent: true });
      this.results.e2e = { success: true, ...result };
      this.log('✓ E2E tests passed', 'success');
      this.results.summary.passed++;

      // Cleanup
      apiServer.kill();
      imsServer.kill();
      marketplaceServer.kill();

    } catch (error) {
      this.results.e2e = { success: false, ...error };
      this.log(`✗ E2E tests failed: ${error.error || error.stderr}`, 'error');
      this.results.summary.failed++;
    }
    this.results.summary.total++;
  }

  async runLinting() {
    this.log('Running linting checks...', 'info');

    try {
      await this.runCommand('lint', '.', { silent: true });
      this.log('✓ Linting passed', 'success');
    } catch (error) {
      this.log(`✗ Linting failed: ${error.stderr}`, 'error');
    }
  }

  async runTypeChecking() {
    this.log('Running type checking...', 'info');

    try {
      await this.runCommand('typecheck', '.', { silent: true });
      this.log('✓ Type checking passed', 'success');
    } catch (error) {
      this.log(`✗ Type checking failed: ${error.stderr}`, 'error');
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.blue('PartPal Test Results Summary'));
    console.log('='.repeat(60));

    console.log(`\n${chalk.bold('Duration:')} ${durationSeconds}s`);
    console.log(`${chalk.bold('Total Tests:')} ${this.results.summary.total}`);
    console.log(`${chalk.green('✓ Passed:')} ${this.results.summary.passed}`);
    console.log(`${chalk.red('✗ Failed:')} ${this.results.summary.failed}`);
    console.log(`${chalk.yellow('◦ Skipped:')} ${this.results.summary.skipped}`);

    // Detailed results
    console.log(`\n${chalk.bold('Package Tests:')}`);
    Object.entries(this.results.packages).forEach(([name, result]) => {
      const status = result.success ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} ${name}`);
    });

    console.log(`\n${chalk.bold('Service Tests:')}`);
    Object.entries(this.results.services).forEach(([name, result]) => {
      const status = result.success ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} ${name}`);
    });

    console.log(`\n${chalk.bold('App Tests:')}`);
    Object.entries(this.results.apps).forEach(([name, result]) => {
      const status = result.success ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} ${name}`);
    });

    console.log(`\n${chalk.bold('E2E Tests:')}`);
    const e2eStatus = this.results.e2e.success ? chalk.green('✓') : chalk.red('✗');
    console.log(`  ${e2eStatus} End-to-End`);

    // Coverage summary
    console.log(`\n${chalk.bold('Coverage Summary:')}`);
    console.log('  Run individual package coverage reports for detailed information');
    console.log('  - pnpm --filter @partpal/shared-ui test:coverage');
    console.log('  - pnpm --filter @partpal/shared-utils test:coverage');
    console.log('  - pnpm --filter @partpal/shared-types test:coverage');
    console.log('  - pnpm --filter @partpal/database test:coverage');

    // Save results to file
    const reportPath = path.join(__dirname, '../test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n${chalk.blue('ℹ')} Detailed results saved to: ${reportPath}`);

    console.log('\n' + '='.repeat(60));

    return this.results.summary.failed === 0;
  }

  async run(options = {}) {
    this.log('Starting PartPal test suite...', 'info');

    try {
      // Pre-flight checks
      await this.checkTestScripts();

      // Run different test suites based on options
      if (!options.skipPackages) {
        await this.runPackageTests();
      }

      if (!options.skipServices) {
        await this.runServiceTests();
      }

      if (!options.skipApps) {
        await this.runAppTests();
      }

      if (!options.skipLinting) {
        await this.runLinting();
      }

      if (!options.skipTypeCheck) {
        await this.runTypeChecking();
      }

      if (!options.skipE2E && !process.env.CI) {
        this.log('E2E tests skipped in development. Use --e2e flag to run.', 'warning');
      } else if (options.e2e) {
        await this.runE2ETests();
      }

      // Generate final report
      const success = this.generateReport();
      process.exit(success ? 0 : 1);

    } catch (error) {
      this.log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (const arg of args) {
    switch (arg) {
      case '--skip-packages':
        options.skipPackages = true;
        break;
      case '--skip-services':
        options.skipServices = true;
        break;
      case '--skip-apps':
        options.skipApps = true;
        break;
      case '--skip-lint':
        options.skipLinting = true;
        break;
      case '--skip-typecheck':
        options.skipTypeCheck = true;
        break;
      case '--e2e':
        options.e2e = true;
        break;
      case '--help':
        console.log(`
PartPal Test Runner

Usage: node scripts/test-runner.js [options]

Options:
  --skip-packages    Skip package tests
  --skip-services    Skip service tests
  --skip-apps        Skip application tests
  --skip-lint        Skip linting
  --skip-typecheck   Skip type checking
  --e2e              Run E2E tests
  --help             Show this help message

Examples:
  node scripts/test-runner.js                    # Run all tests except E2E
  node scripts/test-runner.js --e2e              # Run all tests including E2E
  node scripts/test-runner.js --skip-packages    # Skip package tests
  node scripts/test-runner.js --skip-apps --e2e  # Skip app tests but run E2E
        `);
        process.exit(0);
    }
  }

  const runner = new TestRunner();
  runner.run(options);
}

module.exports = TestRunner;
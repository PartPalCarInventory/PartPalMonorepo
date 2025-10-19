#!/usr/bin/env node

/**
 * IMS Test Coverage Strategy & Remediation Agent
 *
 * Current Status: 37.98% coverage (359 passing, 58 failing tests)
 * Target: 70% coverage
 * Gap: 32.02% needed
 *
 * This agent coordinates test remediation and new test creation to reach 70% coverage
 */

const fs = require('fs');
const path = require('path');

class TestCoverageCoordinator {
  constructor() {
    this.stateDir = path.join(__dirname, '../.agent-states/test-coverage');
    this.ensureStateDirectory();
  }

  ensureStateDirectory() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  getAgentDefinitions() {
    return {
      // PHASE 1: Fix Failing Tests (CRITICAL - Blocking coverage accuracy)
      'fix-existing-tests': {
        name: 'Fix Existing Test Failures Agent',
        priority: 'CRITICAL',
        dependencies: [],
        estimatedHours: 4,
        tasks: [
          'fix-signup-tests',      // 30+ failures
          'fix-login-tests',       // 20+ failures
          'fix-api-login-tests',   // 8 failures
          'verify-all-tests-pass'
        ],
        blockers: [
          '58 failing tests across 3 test files',
          'signup.test.tsx: ~30 failures (mock/auth issues)',
          'login.test.tsx: ~20 failures (mock/auth issues)',
          'pages/api/auth/login.test.ts: ~8 failures (API mocking issues)',
          'These failures are contaminating coverage reports'
        ],
        details: {
          'fix-signup-tests': {
            file: 'src/pages/signup.test.tsx',
            issues: [
              'Mock implementations not matching component expectations',
              'Auth context mocking issues',
              'Router mock configuration problems',
              'Form validation test failures'
            ],
            estimatedTime: '1.5h'
          },
          'fix-login-tests': {
            file: 'src/pages/login.test.tsx',
            issues: [
              'Similar auth context mocking issues as signup',
              'Router navigation mock failures',
              'Login flow test failures'
            ],
            estimatedTime: '1h'
          },
          'fix-api-login-tests': {
            file: 'src/pages/api/auth/login.test.ts',
            issues: [
              'Prisma client mocking issues',
              'bcrypt mocking problems',
              'JWT token generation test failures',
              'API response assertion failures'
            ],
            estimatedTime: '1h'
          }
        }
      },

      // PHASE 2: Test Small High-Value Components (Quick Wins)
      'test-small-components': {
        name: 'Small Component Test Agent',
        priority: 'HIGH',
        dependencies: ['fix-existing-tests'],
        estimatedHours: 3,
        tasks: [
          'test-top-selling-parts',      // 55 lines, 0%
          'test-recent-activity',        // 91 lines, 0%
          'test-revenue-chart',          // 85 lines, 0%
          'test-part-modal',             // 84 lines, 0%
          'verify-small-component-coverage'
        ],
        blockers: [
          '4 small components with 0% coverage',
          'Combined 315 lines of untested code',
          'These are display components - fast to test'
        ],
        expectedCoverageGain: '~3-4%',
        details: {
          'test-top-selling-parts': {
            file: 'src/components/TopSellingParts.tsx',
            lines: 55,
            complexity: 'LOW',
            type: 'Display component with data fetching',
            testScenarios: [
              'Loading state',
              'Empty state',
              'Display top parts list',
              'Price formatting',
              'Quantity display'
            ]
          },
          'test-recent-activity': {
            file: 'src/components/RecentActivity.tsx',
            lines: 91,
            complexity: 'LOW',
            type: 'Activity feed display component',
            testScenarios: [
              'Loading state',
              'Empty activity list',
              'Display activities',
              'Timestamp formatting',
              'Activity type icons'
            ]
          },
          'test-revenue-chart': {
            file: 'src/components/RevenueChart.tsx',
            lines: 85,
            complexity: 'MEDIUM',
            type: 'Chart component',
            testScenarios: [
              'Loading state',
              'Chart rendering with data',
              'Empty data handling',
              'Chart library integration'
            ]
          },
          'test-part-modal': {
            file: 'src/components/PartModal.tsx',
            lines: 84,
            complexity: 'LOW',
            type: 'Modal wrapper component',
            testScenarios: [
              'Open/close modal',
              'Display part form',
              'Modal actions',
              'Form submission'
            ]
          }
        }
      },

      // PHASE 3: Test Medium Components (Balanced ROI)
      'test-medium-components': {
        name: 'Medium Component Test Agent',
        priority: 'HIGH',
        dependencies: ['test-small-components'],
        estimatedHours: 4,
        tasks: [
          'test-mobile-layout',         // 132 lines, 0%
          'test-parts-inventory-chart', // 143 lines, 0%
          'test-mobile-navigation',     // 194 lines, 0%
          'verify-medium-component-coverage'
        ],
        blockers: [
          '3 medium components with 0% coverage',
          'Combined 469 lines of untested code',
          'Mobile-specific functionality needs testing'
        ],
        expectedCoverageGain: '~4-5%',
        details: {
          'test-mobile-layout': {
            file: 'src/components/MobileLayout.tsx',
            lines: 132,
            complexity: 'MEDIUM',
            type: 'Layout wrapper with mobile-specific logic'
          },
          'test-parts-inventory-chart': {
            file: 'src/components/PartsInventoryChart.tsx',
            lines: 143,
            complexity: 'MEDIUM',
            type: 'Chart component with inventory data'
          },
          'test-mobile-navigation': {
            file: 'src/components/MobileNavigation.tsx',
            lines: 194,
            complexity: 'MEDIUM',
            type: 'Mobile menu navigation'
          }
        }
      },

      // PHASE 4: Test Large Complex Components (High Impact)
      'test-large-components': {
        name: 'Large Component Test Agent',
        priority: 'HIGH',
        dependencies: ['test-medium-components'],
        estimatedHours: 8,
        tasks: [
          'test-part-details-modal',  // 269 lines, 0%
          'test-inventory-report',    // 294 lines, 0%
          'test-financial-report',    // 347 lines, 0%
          'test-part-form',           // 364 lines, 0%
          'verify-large-component-coverage'
        ],
        blockers: [
          '4 large components with 0% coverage',
          'Combined 1,274 lines of untested code',
          'Complex forms and reports - time intensive'
        ],
        expectedCoverageGain: '~10-12%',
        details: {
          'test-part-details-modal': {
            file: 'src/components/PartDetailsModal.tsx',
            lines: 269,
            complexity: 'HIGH',
            type: 'Complex modal with part details and actions',
            priority: 'HIGH - frequently used component'
          },
          'test-inventory-report': {
            file: 'src/components/InventoryReport.tsx',
            lines: 294,
            complexity: 'HIGH',
            type: 'Report generation with data aggregation'
          },
          'test-financial-report': {
            file: 'src/components/FinancialReport.tsx',
            lines: 347,
            complexity: 'HIGH',
            type: 'Financial calculations and report display'
          },
          'test-part-form': {
            file: 'src/components/PartForm.tsx',
            lines: 364,
            complexity: 'VERY_HIGH',
            type: 'Complex form with validation, image upload, pricing',
            priority: 'CRITICAL - core business functionality'
          }
        }
      },

      // PHASE 5: Test Report Components (Optional - if time permits)
      'test-report-components': {
        name: 'Report Component Test Agent',
        priority: 'MEDIUM',
        dependencies: ['test-large-components'],
        estimatedHours: 6,
        tasks: [
          'test-performance-report',  // 414 lines, 0%
          'test-sales-report',        // 432 lines, 0%
          'test-export-modal',        // 181 lines, 0%
          'verify-report-coverage'
        ],
        blockers: [
          '3 report components with 0% coverage',
          'Combined 1,027 lines of untested code',
          'Reports are complex but lower priority for MVP'
        ],
        expectedCoverageGain: '~8-10%',
        note: 'May not be needed if 70% reached in Phase 4'
      },

      // PHASE 6: Improve Partial Coverage (Optimization)
      'improve-partial-coverage': {
        name: 'Partial Coverage Improvement Agent',
        priority: 'MEDIUM',
        dependencies: ['test-large-components'],
        estimatedHours: 3,
        tasks: [
          'improve-vehicle-form-coverage',    // 60% → 80%+
          'improve-dashboard-header-coverage', // 71% → 85%+
          'improve-vehicle-modal-coverage',    // 68% → 80%+
          'improve-reports-header-coverage',   // 75% → 85%+
          'verify-improved-coverage'
        ],
        blockers: [
          'VehicleForm.tsx at 60% - missing edge cases',
          'DashboardHeader.tsx at 71% - incomplete branch coverage',
          'VehicleModal.tsx at 68% - missing interaction tests',
          'ReportsHeader.tsx at 75% - incomplete filter tests'
        ],
        expectedCoverageGain: '~2-3%',
        note: 'Focus on getting components from 60-75% to 80%+'
      },

      // PHASE 7: Page Coverage (If needed for 70%)
      'test-page-components': {
        name: 'Page Component Test Agent',
        priority: 'LOW',
        dependencies: ['improve-partial-coverage'],
        estimatedHours: 8,
        tasks: [
          'test-dashboard-page',  // 299 lines, 0%
          'test-vehicles-page',   // 295 lines, 0%
          'test-parts-page',      // 439 lines, 0%
          'test-reports-page',    // 236 lines, 0%
          'test-index-page',      // 29 lines, 0%
          'verify-page-coverage'
        ],
        blockers: [
          '5 page components with 0% coverage',
          'Pages are complex integration tests',
          'Lower priority - components are more important'
        ],
        expectedCoverageGain: '~8-12%',
        note: 'Only if 70% not reached by Phase 6'
      }
    };
  }

  // Calculate expected coverage after each phase
  calculateProjectedCoverage() {
    const phases = [
      { name: 'Current', coverage: 37.98 },
      { name: 'Phase 1: Fix Tests', coverage: 37.98, note: 'No gain, just fixes' },
      { name: 'Phase 2: Small Components', coverage: 41.98, gain: 4 },
      { name: 'Phase 3: Medium Components', coverage: 46.48, gain: 4.5 },
      { name: 'Phase 4: Large Components', coverage: 57.48, gain: 11 },
      { name: 'Phase 5: Reports', coverage: 66.48, gain: 9 },
      { name: 'Phase 6: Improve Partial', coverage: 69.48, gain: 3 },
      { name: 'Phase 7: Pages (if needed)', coverage: 77.48, gain: 8 }
    ];

    return phases;
  }

  // Get recommended path to 70%
  getRecommendedPath() {
    return {
      path: 'FAST_TRACK',
      description: 'Minimum effort to reach 70% coverage',
      phases: [
        'Phase 1: Fix existing tests (MUST DO)',
        'Phase 2: Test small components (~42% coverage)',
        'Phase 3: Test medium components (~46% coverage)',
        'Phase 4: Test large components (~57% coverage)',
        'Phase 6: Improve partial coverage (~69-70% coverage)',
        'NOTE: If Phase 4 reaches 60%+, focus Phase 6 on highest impact partial tests'
      ],
      estimatedHours: 18,
      estimatedDays: 2.25,
      targetCoverage: '70%',
      riskLevel: 'LOW',
      notes: [
        'Skips Phase 5 (Reports) unless needed',
        'Skips Phase 7 (Pages) unless needed',
        'Focuses on component testing over integration testing',
        'Prioritizes business-critical components first'
      ]
    };
  }

  // Get critical blockers
  getCriticalBlockers() {
    return {
      immediate: [
        {
          blocker: '58 failing tests contaminating coverage',
          impact: 'HIGH',
          phase: 'Phase 1',
          estimatedFix: '4 hours'
        }
      ],
      quality: [
        {
          issue: 'Test infrastructure working but auth mocking inconsistent',
          impact: 'MEDIUM',
          recommendation: 'Standardize auth mock patterns across all test files'
        },
        {
          issue: 'Some existing tests have fragile selectors',
          impact: 'LOW',
          recommendation: 'Use data-testid attributes for critical test elements'
        }
      ]
    };
  }

  // Get agent state (similar to production-readiness-agent.js)
  getAgentState(agentId) {
    const stateFile = path.join(this.stateDir, `${agentId}-state.json`);

    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }

    const agentDef = this.getAgentDefinitions()[agentId];
    const defaultState = {
      agentId,
      name: agentDef.name,
      priority: agentDef.priority,
      status: 'ready',
      currentTask: null,
      completedTasks: [],
      blockedOn: [],
      blockers: agentDef.blockers,
      progress: 0,
      totalTasks: agentDef.tasks.length,
      estimatedHours: agentDef.estimatedHours,
      hoursSpent: 0,
      lastUpdated: new Date().toISOString()
    };

    this.saveAgentState(agentId, defaultState);
    return defaultState;
  }

  saveAgentState(agentId, state) {
    const stateFile = path.join(this.stateDir, `${agentId}-state.json`);
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  }

  // Generate report
  generateReport() {
    const definitions = this.getAgentDefinitions();
    const projections = this.calculateProjectedCoverage();
    const path = this.getRecommendedPath();
    const blockers = this.getCriticalBlockers();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║       IMS TEST COVERAGE STRATEGY & REMEDIATION PLAN        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 CURRENT STATUS:');
    console.log('   Coverage: 37.98%');
    console.log('   Target: 70.00%');
    console.log('   Gap: 32.02%');
    console.log('   Tests Passing: 359');
    console.log('   Tests Failing: 58 ⚠️');
    console.log('   Total Test Files: 18\n');

    console.log('🎯 RECOMMENDED PATH TO 70%:');
    console.log(`   Strategy: ${path.path}`);
    console.log(`   Estimated Time: ${path.estimatedHours} hours (~${path.estimatedDays} days)`);
    console.log(`   Risk Level: ${path.riskLevel}\n`);

    console.log('📈 PROJECTED COVERAGE MILESTONES:');
    projections.forEach(phase => {
      const marker = phase.coverage >= 70 ? '✓' : ' ';
      const gain = phase.gain ? ` (+${phase.gain}%)` : '';
      const note = phase.note ? ` - ${phase.note}` : '';
      console.log(`   [${marker}] ${phase.name}: ${phase.coverage}%${gain}${note}`);
    });
    console.log('');

    console.log('🚨 CRITICAL BLOCKERS:');
    blockers.immediate.forEach(b => {
      console.log(`   [${b.impact}] ${b.blocker}`);
      console.log(`          Fix: ${b.estimatedFix} in ${b.phase}`);
    });
    console.log('');

    console.log('📋 EXECUTION PHASES:\n');

    Object.keys(definitions).forEach((agentId, index) => {
      const agent = definitions[agentId];
      const state = this.getAgentState(agentId);
      const status = state.status === 'completed' ? '✅' :
                    state.status === 'in_progress' ? '🔄' :
                    state.status === 'blocked' ? '⛔' : '⏳';

      console.log(`   ${status} PHASE ${index + 1}: ${agent.name.toUpperCase()}`);
      console.log(`      Priority: ${agent.priority} | Time: ${agent.estimatedHours}h | Tasks: ${agent.tasks.length}`);

      if (agent.expectedCoverageGain) {
        console.log(`      Expected Gain: ${agent.expectedCoverageGain}`);
      }

      if (agent.details) {
        console.log(`      Components:`);
        Object.keys(agent.details).forEach(taskId => {
          const detail = agent.details[taskId];
          if (detail.file) {
            const complexity = detail.complexity ? ` [${detail.complexity}]` : '';
            const priority = detail.priority ? ` ⚡${detail.priority}` : '';
            console.log(`         • ${detail.file} (${detail.lines} lines)${complexity}${priority}`);
          }
        });
      }

      console.log(`      Blockers: ${agent.blockers.length}`);
      agent.blockers.slice(0, 2).forEach(b => {
        console.log(`         - ${b}`);
      });

      if (agent.note) {
        console.log(`      Note: ${agent.note}`);
      }
      console.log('');
    });

    console.log('💡 RECOMMENDATIONS:');
    console.log('   1. START with Phase 1: Fix all 58 failing tests first');
    console.log('   2. THEN execute Phases 2-4 sequentially for quick coverage gains');
    console.log('   3. CHECK coverage after Phase 4 - may be close to 70%');
    console.log('   4. If needed, execute Phase 6 to improve partial coverage');
    console.log('   5. AVOID Phase 5 & 7 unless absolutely necessary for 70%\n');

    console.log('🔧 QUICK WINS (Fastest path to gains):');
    console.log('   • TopSellingParts.tsx: 55 lines, low complexity');
    console.log('   • PartModal.tsx: 84 lines, low complexity');
    console.log('   • RecentActivity.tsx: 91 lines, low complexity');
    console.log('   • Total quick wins: ~3-4% coverage gain in ~3 hours\n');

    console.log('⚙️  USAGE:');
    console.log('   node test-coverage-strategy.js status [agentId]');
    console.log('   node test-coverage-strategy.js start <agentId>');
    console.log('   node test-coverage-strategy.js complete <agentId> <taskId> [hours]\n');
  }

  // CLI handler
  handleCommand(command, agentId, taskId, hours) {
    if (!command || command === 'status') {
      if (agentId) {
        return { success: true, state: this.getAgentState(agentId) };
      }
      this.generateReport();
      return { success: true };
    }

    if (command === 'list') {
      return {
        success: true,
        agents: Object.keys(this.getAgentDefinitions()).map(id => ({
          id,
          ...this.getAgentDefinitions()[id]
        }))
      };
    }

    if (command === 'projection') {
      return {
        success: true,
        projections: this.calculateProjectedCoverage(),
        path: this.getRecommendedPath()
      };
    }

    return { success: false, message: `Unknown command: ${command}` };
  }
}

// CLI execution
if (require.main === module) {
  const coordinator = new TestCoverageCoordinator();
  const [command, agentId, taskId, hours] = process.argv.slice(2);

  const result = coordinator.handleCommand(command, agentId, taskId, hours);

  if (!result.success && result.message) {
    console.error(`ERROR: ${result.message}`);
    process.exit(1);
  }

  if (result.projections) {
    console.log('\n📈 COVERAGE PROJECTIONS:\n');
    result.projections.forEach(p => {
      console.log(`${p.name}: ${p.coverage}%${p.gain ? ` (+${p.gain}%)` : ''}`);
    });
    console.log(`\n${result.path.description}`);
    console.log(`Path: ${result.path.phases.join(' → ')}`);
  }
}

module.exports = TestCoverageCoordinator;

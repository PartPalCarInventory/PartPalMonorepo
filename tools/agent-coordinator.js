#!/usr/bin/env node

/**
 * PartPal Agent Coordination System
 * Manages start/pause/continue for specialized AI agents
 */

const fs = require('fs');
const path = require('path');

class AgentCoordinator {
  constructor() {
    this.stateDir = path.join(__dirname, '../.agent-states');
    this.ensureStateDirectory();
  }

  ensureStateDirectory() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  // Agent definitions with dependencies
  getAgentDefinitions() {
    return {
      'shared-ui': {
        name: 'Shared UI Agent',
        dependencies: [],
        tasks: [
          'design-system-foundation',
          'core-components',
          'advanced-components',
          'accessibility-standards',
          'documentation-storybook'
        ]
      },
      'database': {
        name: 'Database Agent',
        dependencies: [],
        tasks: [
          'schema-design',
          'search-optimization',
          'data-management',
          'performance-tuning',
          'security-compliance'
        ]
      },
      'security': {
        name: 'Security Agent',
        dependencies: [],
        tasks: [
          'authentication-authorization',
          'data-protection',
          'api-security',
          'infrastructure-security',
          'compliance-auditing'
        ]
      },
      'backend-api': {
        name: 'Backend API Agent',
        dependencies: ['database', 'security'],
        tasks: [
          'authentication-system',
          'core-api-endpoints',
          'database-integration',
          'external-integrations',
          'performance-monitoring'
        ]
      },
      'ims-frontend': {
        name: 'IMS Frontend Agent',
        dependencies: ['shared-ui', 'backend-api'],
        tasks: [
          'dashboard-analytics',
          'vehicle-management',
          'inventory-system',
          'mobile-optimization',
          'reporting-analytics'
        ]
      },
      'marketplace-frontend': {
        name: 'Marketplace Frontend Agent',
        dependencies: ['shared-ui', 'backend-api'],
        tasks: [
          'search-discovery',
          'part-listings',
          'location-maps',
          'user-experience',
          'communication-hub'
        ]
      },
      'devops': {
        name: 'DevOps Agent',
        dependencies: ['database', 'security'],
        tasks: [
          'cicd-pipeline',
          'infrastructure-as-code',
          'monitoring-observability',
          'scalability-performance',
          'backup-disaster-recovery'
        ]
      },
      'testing': {
        name: 'Testing Agent',
        dependencies: ['backend-api', 'ims-frontend', 'marketplace-frontend'],
        tasks: [
          'unit-testing',
          'integration-testing',
          'e2e-testing',
          'quality-assurance',
          'testing-infrastructure'
        ]
      }
    };
  }

  // Get agent state or create default
  getAgentState(agentId) {
    const stateFile = path.join(this.stateDir, `${agentId}-state.json`);

    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }

    // Create default state
    const agentDef = this.getAgentDefinitions()[agentId];
    const defaultState = {
      agentId,
      name: agentDef.name,
      status: 'ready', // ready, in_progress, paused, completed, blocked
      currentTask: null,
      completedTasks: [],
      blockedOn: [],
      progress: 0,
      totalTasks: agentDef.tasks.length,
      lastUpdated: new Date().toISOString(),
      errors: []
    };

    this.saveAgentState(agentId, defaultState);
    return defaultState;
  }

  // Save agent state
  saveAgentState(agentId, state) {
    const stateFile = path.join(this.stateDir, `${agentId}-state.json`);
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  }

  // Check if agent dependencies are satisfied
  checkDependencies(agentId) {
    const agentDef = this.getAgentDefinitions()[agentId];
    const blockedOn = [];

    for (const depId of agentDef.dependencies) {
      const depState = this.getAgentState(depId);
      if (depState.status !== 'completed') {
        blockedOn.push({
          agentId: depId,
          status: depState.status,
          progress: depState.progress
        });
      }
    }

    return blockedOn;
  }

  // Start agent work
  startAgent(agentId) {
    const state = this.getAgentState(agentId);
    const blockedOn = this.checkDependencies(agentId);

    if (blockedOn.length > 0) {
      state.status = 'blocked';
      state.blockedOn = blockedOn;
      this.saveAgentState(agentId, state);
      return {
        success: false,
        message: `Agent ${agentId} is blocked by dependencies: ${blockedOn.map(b => b.agentId).join(', ')}`
      };
    }

    if (state.status === 'completed') {
      return {
        success: false,
        message: `Agent ${agentId} has already completed all tasks`
      };
    }

    // Start or resume work
    const agentDef = this.getAgentDefinitions()[agentId];
    const nextTask = agentDef.tasks.find(task => !state.completedTasks.includes(task));

    if (!nextTask) {
      state.status = 'completed';
      state.currentTask = null;
      state.progress = 100;
    } else {
      state.status = 'in_progress';
      state.currentTask = nextTask;
      state.blockedOn = [];
    }

    this.saveAgentState(agentId, state);

    return {
      success: true,
      message: `Agent ${agentId} started. Current task: ${state.currentTask || 'All tasks completed'}`,
      state
    };
  }

  // Pause agent work
  pauseAgent(agentId) {
    const state = this.getAgentState(agentId);

    if (state.status !== 'in_progress') {
      return {
        success: false,
        message: `Agent ${agentId} is not currently running (status: ${state.status})`
      };
    }

    state.status = 'paused';
    this.saveAgentState(agentId, state);

    return {
      success: true,
      message: `Agent ${agentId} paused. Current task: ${state.currentTask}`,
      state
    };
  }

  // Continue agent work
  continueAgent(agentId) {
    const state = this.getAgentState(agentId);

    if (state.status !== 'paused') {
      return this.startAgent(agentId); // Delegate to start logic
    }

    state.status = 'in_progress';
    this.saveAgentState(agentId, state);

    return {
      success: true,
      message: `Agent ${agentId} resumed. Current task: ${state.currentTask}`,
      state
    };
  }

  // Complete current task
  completeTask(agentId, taskId) {
    const state = this.getAgentState(agentId);

    if (state.currentTask !== taskId) {
      return {
        success: false,
        message: `Task ${taskId} is not the current task for agent ${agentId}`
      };
    }

    state.completedTasks.push(taskId);
    state.progress = Math.round((state.completedTasks.length / state.totalTasks) * 100);

    // Move to next task or complete agent
    const agentDef = this.getAgentDefinitions()[agentId];
    const nextTask = agentDef.tasks.find(task => !state.completedTasks.includes(task));

    if (nextTask) {
      state.currentTask = nextTask;
    } else {
      state.status = 'completed';
      state.currentTask = null;
      state.progress = 100;
    }

    this.saveAgentState(agentId, state);

    return {
      success: true,
      message: `Task ${taskId} completed for agent ${agentId}. Next: ${state.currentTask || 'All tasks done'}`,
      state
    };
  }

  // Get overall project status
  getProjectStatus() {
    const agents = Object.keys(this.getAgentDefinitions());
    const statuses = agents.map(agentId => {
      const state = this.getAgentState(agentId);
      return {
        agentId,
        name: state.name,
        status: state.status,
        progress: state.progress,
        currentTask: state.currentTask,
        blockedOn: state.blockedOn
      };
    });

    const totalProgress = Math.round(
      statuses.reduce((sum, s) => sum + s.progress, 0) / statuses.length
    );

    const blockedAgents = statuses.filter(s => s.status === 'blocked');
    const completedAgents = statuses.filter(s => s.status === 'completed');

    return {
      totalProgress,
      agentCount: agents.length,
      completedAgents: completedAgents.length,
      blockedAgents: blockedAgents.length,
      agents: statuses,
      productionReady: completedAgents.length === agents.length
    };
  }

  // Reset agent state
  resetAgent(agentId) {
    const stateFile = path.join(this.stateDir, `${agentId}-state.json`);
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }

    return {
      success: true,
      message: `Agent ${agentId} state reset`
    };
  }

  // CLI interface
  handleCommand(command, agentId, taskId) {
    switch (command) {
      case 'start':
        return this.startAgent(agentId);
      case 'pause':
        return this.pauseAgent(agentId);
      case 'continue':
        return this.continueAgent(agentId);
      case 'complete':
        return this.completeTask(agentId, taskId);
      case 'status':
        if (agentId) {
          return { success: true, state: this.getAgentState(agentId) };
        }
        return { success: true, status: this.getProjectStatus() };
      case 'reset':
        return this.resetAgent(agentId);
      case 'list':
        return {
          success: true,
          agents: Object.keys(this.getAgentDefinitions()).map(id => ({
            id,
            ...this.getAgentDefinitions()[id]
          }))
        };
      default:
        return {
          success: false,
          message: `Unknown command: ${command}. Available: start, pause, continue, complete, status, reset, list`
        };
    }
  }
}

// CLI execution
if (require.main === module) {
  const coordinator = new AgentCoordinator();
  const [command, agentId, taskId] = process.argv.slice(2);

  if (!command) {
    console.log(`
PartPal Agent Coordinator

Usage:
  node agent-coordinator.js <command> [agentId] [taskId]

Commands:
  list                    - List all available agents
  status [agentId]        - Show project or agent status
  start <agentId>         - Start agent work
  pause <agentId>         - Pause agent work
  continue <agentId>      - Continue paused agent
  complete <agentId> <taskId> - Mark task as complete
  reset <agentId>         - Reset agent state

Agents:
  shared-ui, database, security, backend-api,
  ims-frontend, marketplace-frontend, devops, testing
    `);
    process.exit(1);
  }

  const result = coordinator.handleCommand(command, agentId, taskId);

  if (result.success) {
    if (result.status) {
      console.log('\nProject Status:');
      console.log(`Overall Progress: ${result.status.totalProgress}%`);
      console.log(`Completed Agents: ${result.status.completedAgents}/${result.status.agentCount}`);
      console.log(`Production Ready: ${result.status.productionReady ? 'YES' : 'NO'}`);
      console.log('\nAgent Status:');
      result.status.agents.forEach(agent => {
        const status = agent.status === 'completed' ? 'DONE' :
                      agent.status === 'blocked' ? 'BLOCKED' :
                      agent.status === 'in_progress' ? 'WORKING' : 'PAUSED';
        console.log(`  [${status}] ${agent.name} (${agent.progress}%) - ${agent.currentTask || 'Idle'}`);
      });
    } else if (result.agents) {
      console.log('\nAvailable Agents:');
      result.agents.forEach(agent => {
        console.log(`  ${agent.id}: ${agent.name}`);
        console.log(`    Dependencies: ${agent.dependencies.join(', ') || 'None'}`);
        console.log(`    Tasks: ${agent.tasks.length}`);
      });
    } else {
      console.log(`SUCCESS: ${result.message}`);
      if (result.state) {
        console.log(`   Status: ${result.state.status}`);
        console.log(`   Progress: ${result.state.progress}%`);
        console.log(`   Current Task: ${result.state.currentTask || 'None'}`);
      }
    }
  } else {
    console.error(`ERROR: ${result.message}`);
    process.exit(1);
  }
}

module.exports = AgentCoordinator;
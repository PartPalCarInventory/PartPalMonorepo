# 🤖 Agent Workflow Guide: How It Actually Works

## 📂 File Structure That Controls Everything

```
PartPalv2/
├── tools/
│   └── agent-coordinator.js          # 🧠 BRAIN: Controls all agents
├── .agent-states/                    # 💾 MEMORY: Stores agent progress
│   ├── shared-ui-state.json         # State of Shared UI Agent
│   ├── database-state.json          # State of Database Agent
│   ├── backend-api-state.json       # State of Backend API Agent
│   └── [other-agent-states].json    # All 8 agent states
├── docs/
│   ├── AGENT_BREAKDOWN.md           # 📋 PLAN: What each agent does
│   └── AGENT_TASK_EXAMPLES.md       # 📖 GUIDE: How to do tasks
└── packages/apps/services/          # 🏗️ CODE: Where agents build
```

## 🔄 How the Workflow Actually Functions

### Step 1: Agent Definitions (The Blueprint)

**File**: `tools/agent-coordinator.js` lines 24-90

This defines **WHAT** each agent does:
```javascript
'shared-ui': {
  name: 'Shared UI Agent',
  dependencies: [],                    // ✅ Can start immediately
  tasks: [
    'design-system-foundation',        // Task 1
    'core-components',                 // Task 2
    'advanced-components',             // Task 3
    'accessibility-standards',         // Task 4
    'documentation-storybook'          // Task 5
  ]
},
'backend-api': {
  name: 'Backend API Agent',
  dependencies: ['database', 'security'], // 🚫 Must wait for these
  tasks: [
    'authentication-system',           // Task 1
    'core-api-endpoints',             // Task 2
    'database-integration',           // Task 3
    'external-integrations',          // Task 4
    'performance-monitoring'          // Task 5
  ]
}
```

### Step 2: State Management (The Memory)

**Files**: `.agent-states/[agent-name]-state.json`

Each agent has a state file tracking:
```json
{
  "agentId": "shared-ui",
  "status": "in_progress",              // ready|in_progress|paused|completed|blocked
  "currentTask": "core-components",     // What task is active now
  "completedTasks": [                   // What's already done
    "design-system-foundation"
  ],
  "blockedOn": [],                      // What's stopping progress
  "progress": 20,                       // Percentage complete (1 of 5 tasks)
  "totalTasks": 5,                      // Total tasks for this agent
  "lastUpdated": "2025-10-04T15:16:26.036Z"
}
```

### Step 3: Command Interface (The Controls)

**File**: `tools/agent-coordinator.js` lines 200-300

You control agents with these commands:
```bash
# List all agents and their tasks
node tools/agent-coordinator.js list

# Check status of all agents
node tools/agent-coordinator.js status

# Check specific agent status
node tools/agent-coordinator.js status shared-ui

# Start an agent (checks dependencies first)
node tools/agent-coordinator.js start shared-ui

# Pause an agent's work
node tools/agent-coordinator.js pause shared-ui

# Continue paused work
node tools/agent-coordinator.js continue shared-ui

# Mark current task as complete
node tools/agent-coordinator.js complete shared-ui design-system-foundation
```

## 🎭 How YOU Work as Different Agents

### Method 1: Ask Claude to Act as Specific Agent

```
💬 YOU: "Claude, act as the Shared UI Agent and work on the core-components task"

🤖 CLAUDE PROCESS:
1. Checks: node tools/agent-coordinator.js status shared-ui
2. Sees: Current task is "core-components"
3. Reads: Existing code in packages/shared-ui/src/
4. Builds: More UI components following established patterns
5. Updates: Agent state when task complete
```

### Method 2: Use Command-Driven Workflow

```bash
# 1. YOU: Check what needs work
node tools/agent-coordinator.js status

# 2. YOU: Start an agent
node tools/agent-coordinator.js start database

# 3. ASK CLAUDE: "Work on the current database task"
# 4. CLAUDE: Reads state, works on "search-optimization"
# 5. CLAUDE: Completes task and updates state

# 6. YOU: Mark task complete
node tools/agent-coordinator.js complete database search-optimization
```

## 🔧 Ensuring Agents Are Used Properly

### A. **Agent Coordination Rules** (Built into agent-coordinator.js)

```javascript
// Dependency checking (lines 95-110)
checkDependencies(agentId) {
  const blockedOn = [];
  for (const depId of agentDef.dependencies) {
    const depState = this.getAgentState(depId);
    if (depState.status !== 'completed') {
      blockedOn.push({ agentId: depId, status: depState.status });
    }
  }
  return blockedOn;
}
```

**This means**: Backend API Agent **CANNOT** start until Database + Security agents are **completed**.

### B. **State Persistence** (Lines 70-85)

```javascript
saveAgentState(agentId, state) {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}
```

**This means**: All progress is saved. Claude can pause/resume exactly where it left off.

### C. **Task Progression** (Lines 165-185)

```javascript
completeTask(agentId, taskId) {
  state.completedTasks.push(taskId);
  state.progress = Math.round((state.completedTasks.length / state.totalTasks) * 100);

  // Move to next task
  const nextTask = agentDef.tasks.find(task => !state.completedTasks.includes(task));
  if (nextTask) {
    state.currentTask = nextTask;
  } else {
    state.status = 'completed';  // Agent finished all tasks
  }
}
```

**This means**: Agents automatically move to next task. No manual tracking needed.

## 🚀 Practical Usage Examples

### Example 1: Starting Fresh
```bash
# Check what can start (no dependencies)
node tools/agent-coordinator.js list

# Start foundation agents
node tools/agent-coordinator.js start shared-ui
node tools/agent-coordinator.js start database
node tools/agent-coordinator.js start security

# Ask Claude to work as each agent
"Claude, act as Shared UI Agent and work on your current task"
"Claude, act as Database Agent and work on your current task"
"Claude, act as Security Agent and work on your current task"
```

### Example 2: Continuing Work
```bash
# See current status
node tools/agent-coordinator.js status

# Resume paused agent
node tools/agent-coordinator.js continue shared-ui

# Ask Claude to continue
"Claude, continue working as the Shared UI Agent from where you left off"
```

### Example 3: Unblocking Dependencies
```bash
# Try to start blocked agent
node tools/agent-coordinator.js start backend-api
# Output: ❌ Agent backend-api is blocked by dependencies: database, security

# Complete blocking agents first
node tools/agent-coordinator.js complete database schema-design
node tools/agent-coordinator.js complete security authentication-authorization

# Now backend can start
node tools/agent-coordinator.js start backend-api
```

## ✅ Files That Ensure Proper Usage

### 1. **Agent Task Definitions**
- `docs/AGENT_BREAKDOWN.md` - What each agent should build
- `docs/AGENT_TASK_EXAMPLES.md` - How to implement tasks

### 2. **Code Structure Guidelines**
- `CLAUDE.md` - Overall project architecture
- `DEVELOPMENT_GUIDE.md` - Development patterns
- `packages/shared-types/src/index.ts` - Data models to follow

### 3. **Quality Gates**
- Each agent must follow TypeScript patterns
- Components must use shared-ui design system
- API must use shared-types interfaces
- All work follows established project structure

## 🎯 The Magic: Systematic Coordination

1. **Agents can't start unless dependencies are met** ✅
2. **Progress is automatically tracked and saved** ✅
3. **Claude builds on previous agent work** ✅
4. **Quality is maintained through shared standards** ✅
5. **Production readiness is measurable** ✅

This creates a **systematic development process** where each piece builds on the previous work, ensuring a cohesive, production-ready application.
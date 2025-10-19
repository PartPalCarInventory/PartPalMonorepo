# 🎯 How to Use the Agent System: Practical Guide

## 🚀 Quick Start: Your First Agent

### Step 1: Check Current Status
```bash
node tools/agent-coordinator.js status
```
This shows which agents are ready, working, or blocked.

### Step 2: Start a Foundation Agent
```bash
node tools/agent-coordinator.js start shared-ui
```
Foundation agents (shared-ui, database, security) have no dependencies.

### Step 3: Ask Claude to Work as That Agent
```
💬 "Claude, act as the Shared UI Agent and work on your current task"
```

## 📋 Complete Workflow Examples

### Example 1: Building the Design System
```bash
# 1. Start the agent
node tools/agent-coordinator.js start shared-ui

# 2. Ask Claude to work
💬 "Claude, you are now the Shared UI Agent. Your current task is 'design-system-foundation'.
   Please build the core design system components following the PartPal brand guidelines."

# 3. Claude builds components in packages/shared-ui/
# 4. Mark task complete when Claude finishes
node tools/agent-coordinator.js complete shared-ui design-system-foundation

# 5. Continue to next task
💬 "Claude, continue as Shared UI Agent with your next task"
```

### Example 2: Building the Database
```bash
# 1. Start database agent
node tools/agent-coordinator.js start database

# 2. Ask Claude to work on current task
💬 "Claude, act as the Database Agent. Work on your current task: 'schema-design'.
   Create the Prisma schema for the PartPal platform."

# 3. Claude creates packages/database/prisma/schema.prisma
# 4. Mark complete and continue
node tools/agent-coordinator.js complete database schema-design
```

## 🔄 Agent Coordination Patterns

### Pattern 1: Sequential Development
Work on agents that have no dependencies first:
```bash
# Week 1: Foundation
node tools/agent-coordinator.js start shared-ui
node tools/agent-coordinator.js start database
node tools/agent-coordinator.js start security

# Week 2: Backend (unlocked after database + security)
node tools/agent-coordinator.js start backend-api

# Week 3: Frontend (unlocked after backend-api + shared-ui)
node tools/agent-coordinator.js start ims-frontend
node tools/agent-coordinator.js start marketplace-frontend
```

### Pattern 2: Parallel Development
Multiple agents can work simultaneously if dependencies allow:
```bash
# Start all foundation agents at once
node tools/agent-coordinator.js start shared-ui
node tools/agent-coordinator.js start database
node tools/agent-coordinator.js start security

# Ask Claude to switch between them:
💬 "Work as Shared UI Agent for 30 minutes"
💬 "Now switch to Database Agent"
💬 "Now work as Security Agent"
```

### Pattern 3: Pause and Resume
Agents maintain state perfectly:
```bash
# Work on shared-ui
node tools/agent-coordinator.js start shared-ui
💬 "Claude, work as Shared UI Agent"

# Pause to work on something urgent
node tools/agent-coordinator.js pause shared-ui

# Later, resume exactly where you left off
node tools/agent-coordinator.js continue shared-ui
💬 "Claude, continue as Shared UI Agent from where you paused"
```

## 🎭 How to Work as Different Agents

### As Shared UI Agent
```
💬 "Claude, you are the Shared UI Agent. Your current task is [check with status command].

   Build React components in packages/shared-ui/src/components/ following:
   - PartPal brand colors (primary blue, secondary gray, accent orange)
   - Mobile-first responsive design
   - Accessibility standards (WCAG 2.1 AA)
   - TypeScript with proper interfaces

   Use the existing Tailwind config and follow atomic design principles."
```

### As Database Agent
```
💬 "Claude, you are the Database Agent. Your current task is [check with status command].

   Work in packages/database/ to:
   - Design Prisma schemas for User, Vehicle, Part, Seller entities
   - Create search optimization functions
   - Set up database migrations and seeding
   - Follow the shared-types interfaces in packages/shared-types/"
```

### As Backend API Agent
```
💬 "Claude, you are the Backend API Agent. Your current task is [check with status command].

   Build Express.js API in services/api/ with:
   - JWT authentication using Security Agent patterns
   - Database integration using Database Agent schemas
   - RESTful endpoints for all entities
   - Proper error handling and validation"
```

### As Frontend Agents (IMS/Marketplace)
```
💬 "Claude, you are the [IMS/Marketplace] Frontend Agent. Your current task is [check with status command].

   Build Next.js application in apps/[ims|marketplace]/ using:
   - Shared UI components from packages/shared-ui/
   - API calls to Backend API endpoints
   - Mobile-first responsive design
   - TypeScript with shared-types interfaces"
```

## 🔧 Essential Commands Reference

### Status and Information
```bash
# Overall project status
node tools/agent-coordinator.js status

# Specific agent status
node tools/agent-coordinator.js status [agent-name]

# List all agents and their dependencies
node tools/agent-coordinator.js list
```

### Agent Control
```bash
# Start agent (checks dependencies)
node tools/agent-coordinator.js start [agent-name]

# Pause agent work
node tools/agent-coordinator.js pause [agent-name]

# Continue paused agent
node tools/agent-coordinator.js continue [agent-name]

# Mark current task complete
node tools/agent-coordinator.js complete [agent-name] [task-name]

# Reset agent (emergency use)
node tools/agent-coordinator.js reset [agent-name]
```

### Agent Names
- `shared-ui` - Design system and components
- `database` - Database schema and optimization
- `security` - Authentication and security
- `backend-api` - Express.js API server
- `ims-frontend` - IMS Next.js application
- `marketplace-frontend` - Marketplace Next.js application
- `devops` - Infrastructure and deployment
- `testing` - Quality assurance and testing

## 🎯 Best Practices

### 1. Always Check Status First
```bash
node tools/agent-coordinator.js status
```
This shows what can be worked on and what's blocked.

### 2. Follow Dependency Order
- Foundation first: shared-ui, database, security
- Then: backend-api (needs database + security)
- Then: frontends (need backend-api + shared-ui)
- Finally: devops, testing (need completed features)

### 3. Use Clear Claude Instructions
```
💬 "Claude, act as the [Agent Name] and work on your current task: [task-name].

   Context: [what this task involves]
   Requirements: [specific requirements]
   Files to work in: [specific directories]"
```

### 4. Mark Tasks Complete
```bash
# After Claude finishes a task
node tools/agent-coordinator.js complete [agent-name] [task-name]
```

### 5. Track Progress
```bash
# Regular progress checks
node tools/agent-coordinator.js status
```

## 🚫 Common Mistakes to Avoid

### ❌ Wrong: Starting Dependent Agents Too Early
```bash
node tools/agent-coordinator.js start backend-api
# ❌ Agent backend-api is blocked by dependencies: database, security
```

### ✅ Right: Check Dependencies First
```bash
node tools/agent-coordinator.js status backend-api
# See what's blocking, complete those first
```

### ❌ Wrong: Vague Claude Instructions
```
💬 "Claude, build the frontend"
```

### ✅ Right: Specific Agent Instructions
```
💬 "Claude, act as the IMS Frontend Agent and work on your current task: dashboard-analytics.
   Build the dashboard in apps/ims/src/pages/dashboard/ using shared-ui components."
```

### ❌ Wrong: Not Marking Tasks Complete
```
# Claude finishes work but you forget to mark it complete
# Agent stays stuck on old task
```

### ✅ Right: Always Mark Tasks Complete
```bash
node tools/agent-coordinator.js complete shared-ui core-components
```

## 🎉 Production Readiness

When all agents show:
```bash
📊 Project Status:
Overall Progress: 100%
Completed Agents: 8/8
Production Ready: ✅
```

Your PartPal platform is ready for production deployment! 🚀

## 🆘 Troubleshooting

### Agent Won't Start
```bash
# Check dependencies
node tools/agent-coordinator.js status [agent-name]
# Complete blocking agents first
```

### Lost Track of Progress
```bash
# Check overall status
node tools/agent-coordinator.js status
# See exactly where each agent is
```

### Need to Start Over
```bash
# Reset specific agent
node tools/agent-coordinator.js reset [agent-name]

# Or reset all (emergency)
rm -rf .agent-states/
```

This system ensures systematic, coordinated development where every piece builds on the previous work, leading to a cohesive, production-ready PartPal platform.
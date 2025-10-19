# Agent Task Examples & Implementation Guide

## 🎯 Task Granularity Examples

### Backend API Agent - Authentication System Task

**Task ID**: `authentication-system`
**Estimated Effort**: 2-3 days

#### Subtasks:
1. **JWT Implementation**
   ```typescript
   // services/api/src/auth/jwt.ts
   - Generate and verify JWT tokens
   - Implement refresh token mechanism
   - Configure token expiration policies
   ```

2. **Middleware Setup**
   ```typescript
   // services/api/src/middleware/auth.ts
   - Request authentication middleware
   - Role-based authorization middleware
   - Route protection implementation
   ```

3. **API Endpoints**
   ```typescript
   // services/api/src/routes/auth.ts
   POST /api/auth/login
   POST /api/auth/register
   POST /api/auth/refresh
   POST /api/auth/logout
   POST /api/auth/forgot-password
   POST /api/auth/reset-password
   ```

**Pause Point**: After middleware implementation
**Continue Point**: From API endpoints
**Completion Criteria**: All endpoints working with tests passing

---

### IMS Frontend Agent - Dashboard Analytics Task

**Task ID**: `dashboard-analytics`
**Estimated Effort**: 3-4 days

#### Subtasks:
1. **Layout Structure**
   ```tsx
   // apps/ims/src/pages/dashboard/index.tsx
   - Responsive grid layout
   - Widget container system
   - Navigation integration
   ```

2. **Metrics Components**
   ```tsx
   // apps/ims/src/components/dashboard/
   - KPI cards (total vehicles, parts, sales)
   - Revenue charts (daily, monthly, yearly)
   - Inventory status indicators
   - Recent activity feed
   ```

3. **Data Integration**
   ```typescript
   // apps/ims/src/hooks/useDashboardData.ts
   - API data fetching
   - Real-time updates
   - Error handling
   - Loading states
   ```

**Pause Point**: After layout and basic components
**Continue Point**: From data integration
**Completion Criteria**: Dashboard displays real metrics with proper responsive behavior

---

### Database Agent - Schema Design Task

**Task ID**: `schema-design`
**Estimated Effort**: 2-3 days

#### Subtasks:
1. **Core Entities**
   ```sql
   -- packages/database/prisma/schema.prisma
   - User model with authentication fields
   - Vehicle model with VIN and specifications
   - Part model with inventory tracking
   - Seller model with business information
   ```

2. **Relationships**
   ```sql
   - User -> Seller (one-to-one for business accounts)
   - Seller -> Vehicle (one-to-many)
   - Vehicle -> Part (one-to-many)
   - Part -> Category (many-to-one)
   ```

3. **Indexes and Constraints**
   ```sql
   - VIN uniqueness constraint
   - Email uniqueness constraint
   - Search indexes on part names
   - Location-based indexes
   ```

**Pause Point**: After core entities definition
**Continue Point**: From relationship setup
**Completion Criteria**: Database schema supports all business requirements with proper constraints

---

## 🔄 Start/Pause/Continue Workflow

### Starting an Agent
```bash
# Check dependencies first
node tools/agent-coordinator.js status backend-api

# Start if dependencies are met
node tools/agent-coordinator.js start backend-api
```

### Pausing for Dependencies
```bash
# Pause when blocked by another agent
node tools/agent-coordinator.js pause backend-api

# Check what's blocking
node tools/agent-coordinator.js status backend-api
```

### Continuing Work
```bash
# Resume when dependencies are resolved
node tools/agent-coordinator.js continue backend-api
```

### Completing Tasks
```bash
# Mark specific task as complete
node tools/agent-coordinator.js complete backend-api authentication-system
```

## 🚀 Production Readiness Checkpoints

### Phase 1: Foundation (Weeks 1-2)
- [ ] Shared UI Agent: Design system and core components
- [ ] Database Agent: Schema design and basic setup
- [ ] Security Agent: Authentication patterns and encryption

### Phase 2: Core Development (Weeks 3-6)
- [ ] Backend API Agent: All endpoints with authentication
- [ ] IMS Frontend Agent: Core inventory management features
- [ ] Marketplace Frontend Agent: Search and listing functionality

### Phase 3: Integration (Weeks 7-8)
- [ ] Testing Agent: Comprehensive test coverage
- [ ] DevOps Agent: CI/CD and deployment automation
- [ ] Cross-agent integration testing

### Phase 4: Production Prep (Weeks 9-10)
- [ ] Security Agent: Full security audit and compliance
- [ ] DevOps Agent: Production infrastructure and monitoring
- [ ] Performance optimization and load testing

## 🔧 Agent Communication Patterns

### Dependency Coordination
```json
{
  "event": "task_completed",
  "agentId": "database",
  "taskId": "schema-design",
  "unblocks": ["backend-api", "testing"],
  "timestamp": "2025-01-04T15:30:00Z"
}
```

### Quality Gates
Each agent must pass these gates before task completion:
1. **Code Quality**: Linting and formatting pass
2. **Type Safety**: TypeScript compilation without errors
3. **Basic Testing**: Unit tests for new functionality
4. **Documentation**: README updates and inline docs
5. **Integration**: No breaking changes to dependent agents

### Communication Channels
- **State Files**: `.agent-states/[agent]-state.json` for coordination
- **Shared Types**: Updates to `@partpal/shared-types` package
- **API Contracts**: OpenAPI specifications for backend changes
- **Component Library**: Storybook updates for UI changes

## 📊 Progress Tracking Example

```bash
$ node tools/agent-coordinator.js status

📊 Project Status:
Overall Progress: 45%
Completed Agents: 2/8
Production Ready: ❌

Agent Status:
  ✅ Shared UI Agent (100%) - All tasks completed
  ✅ Database Agent (100%) - All tasks completed
  🔄 Backend API Agent (60%) - external-integrations
  🔄 Security Agent (80%) - compliance-auditing
  🚫 IMS Frontend Agent (0%) - Blocked by backend-api
  🚫 Marketplace Frontend Agent (0%) - Blocked by backend-api
  ⏸️ DevOps Agent (20%) - Paused on cicd-pipeline
  ⏸️ Testing Agent (0%) - Waiting for components
```

This structure ensures systematic development with clear deliverables, proper coordination, and measurable progress toward production readiness.
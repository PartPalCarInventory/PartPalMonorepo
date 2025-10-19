# PartPal Development Guide

## AI Agent Optimization

This project is specifically structured for AI agent development with the following optimizations:

### 🤖 Agent-Friendly Architecture

#### Clear Separation of Concerns
- **Monorepo Structure**: Each package has a single responsibility
- **Shared Types**: Consistent data models across applications
- **API-First Design**: Well-defined interfaces between services

#### Predictable File Organization
```
apps/[app-name]/src/
├── components/          # UI components
│   ├── ui/             # Basic UI elements
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   └── navigation/     # Navigation components
├── pages/              # Next.js pages
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # App-specific types
└── styles/             # Styling files
```

#### Documentation-Driven Development
- README files for each major component
- Inline code documentation
- API specification documents
- User story mapping

### 🛠️ Development Workflow

#### Getting Started
```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Start specific applications
pnpm dev:ims        # IMS on port 3001
pnpm dev:marketplace # Marketplace on port 3000
pnpm dev:api        # API service
```

#### Building and Testing
```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### 🎨 UI/UX Guidelines for AI Development

#### Design System Approach
1. **Atomic Components**: Build from basic elements up
2. **Consistent Patterns**: Reuse design patterns across apps
3. **Responsive Design**: Mobile-first development
4. **Accessibility**: WCAG 2.1 AA compliance

#### Component Development Pattern
```typescript
// 1. Define types
interface ComponentProps {
  // Clear prop definitions
}

// 2. Implement component
export function Component({ ...props }: ComponentProps) {
  // Component logic
}

// 3. Export with proper typing
export type { ComponentProps };
```

#### State Management Strategy
- **Local State**: React useState for component-specific state
- **Server State**: TanStack Query for API data
- **Form State**: React Hook Form for form management
- **Global State**: Context API for app-wide state

### 📦 Package Management

#### Workspace Dependencies
```json
{
  "dependencies": {
    "@partpal/shared-ui": "workspace:*",
    "@partpal/shared-types": "workspace:*",
    "@partpal/api-client": "workspace:*"
  }
}
```

#### Adding New Packages
1. Create package directory: `packages/new-package/`
2. Add package.json with workspace reference
3. Update root package.json workspaces array
4. Import in consuming applications

### 🔧 Development Tools

#### Essential VS Code Extensions
- TypeScript and JavaScript Language Server
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Auto Rename Tag

#### Recommended Settings
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### 🚀 Deployment Strategy

#### Environment Structure
- **Development**: Local development with hot reload
- **Staging**: Feature testing environment
- **Production**: Live applications

#### CI/CD Pipeline
1. **Code Quality**: Linting, type checking, tests
2. **Build**: Compile TypeScript, bundle assets
3. **Deploy**: Automated deployment to target environment
4. **Monitor**: Performance and error tracking

### 📋 AI Agent Development Checklist

#### Before Starting Development
- [ ] Review project structure documentation
- [ ] Understand shared types and interfaces
- [ ] Set up development environment
- [ ] Familiarize with component library

#### During Development
- [ ] Follow established file organization patterns
- [ ] Use shared types and components
- [ ] Implement responsive design
- [ ] Add proper error handling
- [ ] Write clear, documented code

#### Before Completion
- [ ] Test across different screen sizes
- [ ] Verify accessibility standards
- [ ] Check type safety compliance
- [ ] Review code for consistency
- [ ] Update relevant documentation

This structure ensures AI agents can efficiently understand the codebase, maintain consistency, and implement features that align with the overall architecture and user experience goals.
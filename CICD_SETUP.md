# CI/CD Pipeline Setup for PartPal

This document describes the CI/CD pipeline configuration for deploying PartPal to Vercel.

## Overview

The CI/CD pipeline is implemented using GitHub Actions and integrates with Vercel for automated deployments. The pipeline includes:

- Code quality checks (linting and type checking)
- Automated testing
- Security scanning
- Preview deployments for pull requests
- Production deployments for main branch

## GitHub Actions Workflows

### 1. Vercel Deployment Workflow

**File**: `.github/workflows/vercel-deploy.yml`

This workflow handles all deployments to Vercel:

#### Triggers
- **Push** to `main`, `dev`, or `develop` branches
- **Pull requests** (opened, synchronized, or reopened)
- **Manual dispatch** via GitHub UI

#### Jobs

1. **changes** - Detects which files have changed to optimize builds
2. **lint-and-typecheck** - Runs ESLint and TypeScript type checking
3. **test** - Executes Jest tests with coverage reporting
4. **security-scan** - Performs dependency audits and secret scanning
5. **deploy-preview** - Deploys to Vercel preview environment (PRs only)
6. **deploy-production** - Deploys to Vercel production (main branch only)
7. **notify** - Reports deployment status

### 2. Existing CI Workflow

**File**: `.github/workflows/ci.yml`

Comprehensive CI pipeline for all code changes:
- Multi-stage change detection
- Parallel linting and type checking
- Test execution with PostgreSQL and Redis services
- Build verification for all applications
- Security audit with multiple tools (Snyk, TruffleHog, Dependency Review)

### 3. Test Workflow

**File**: `.github/workflows/test.yml`

Dedicated test suite execution:
- Unit tests for shared packages
- Integration tests for API
- Frontend tests for IMS and Marketplace
- E2E tests with Playwright
- Security audits
- Performance tests (on schedule or with `[perf]` commit message)

## Required Secrets

Configure these secrets in your GitHub repository (Settings > Secrets and variables > Actions):

### Vercel Secrets

```
VERCEL_TOKEN          # Get from https://vercel.com/account/tokens
VERCEL_ORG_ID         # Found in Vercel project settings > General
VERCEL_PROJECT_ID     # Found in Vercel project settings > General
```

### Optional Secrets

```
CODECOV_TOKEN         # For code coverage reporting
SNYK_TOKEN           # For Snyk security scanning
LHCI_GITHUB_APP_TOKEN # For Lighthouse CI performance testing
```

## Setup Instructions

### 1. Create Vercel Token

1. Log in to Vercel dashboard
2. Go to Settings > Tokens
3. Click "Create Token"
4. Name: `GitHub Actions`
5. Scope: Select appropriate scope (Full Account or specific projects)
6. Copy the token

### 2. Get Vercel Project IDs

```bash
# Install Vercel CLI
pnpm add -g vercel@latest

# Login
vercel login

# Link project
cd apps/ims
vercel link

# Get project details
cat .vercel/project.json
```

The `project.json` file contains:
- `projectId` - This is your `VERCEL_PROJECT_ID`
- `orgId` - This is your `VERCEL_ORG_ID`

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret:
   - Name: `VERCEL_TOKEN`
   - Value: (paste your token)
   - Click "Add secret"
5. Repeat for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

### 4. Configure Vercel Projects

For each Vercel project (IMS and Marketplace):

1. Go to Vercel Dashboard > Your Project > Settings
2. **Git Integration**:
   - Production Branch: `main`
   - Enable "Automatic deployments for Production Branch"
3. **Build & Development Settings**:
   - Framework Preset: `Next.js`
   - Root Directory: `apps/ims` (or `apps/marketplace`)
   - Build Command: `cd ../.. && pnpm install && pnpm --filter @partpal/ims build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`
4. **Environment Variables**:
   - Add all required environment variables (see VERCEL_DEPLOYMENT_GUIDE.md)
5. **Deployment Protection** (Vercel Pro):
   - Enable deployment protection for production
   - Require passing checks before deployment
   - Optionally require manual approval

## Deployment Workflow

### Pull Request Flow

1. Developer creates a feature branch and opens a PR
2. GitHub Actions workflow triggers:
   ```
   PR opened → Changes detected → Lint/Type Check → Tests → Security Scan → Preview Deploy
   ```
3. Preview deployment URL is commented on the PR
4. Team reviews code and preview deployment
5. Once approved and checks pass, PR can be merged

### Production Deployment Flow

1. PR is merged to `main` branch
2. GitHub Actions workflow triggers:
   ```
   Push to main → Changes detected → Lint/Type Check → Tests → Security Scan → Production Deploy
   ```
3. Production deployment is created
4. Smoke tests run against production URL
5. Team is notified of deployment status

### Manual Deployment

Trigger manual deployment via GitHub UI:

1. Go to Actions tab in GitHub repository
2. Select "Vercel Deployment" workflow
3. Click "Run workflow"
4. Select branch and environment (preview/production)
5. Click "Run workflow"

## Environment Configuration

### Preview Environment

Preview deployments use environment variables tagged with "Preview" scope in Vercel:

- Separate database (preview database)
- Non-production API keys
- Debug logging enabled
- Test mode for payment processing

### Production Environment

Production deployments use environment variables tagged with "Production" scope:

- Production database
- Production API keys
- Minimal logging
- Live payment processing

## Monitoring and Alerts

### Build Failures

If a build fails:

1. Check GitHub Actions logs for error details
2. Common issues:
   - Linting errors: Fix code style issues
   - Type errors: Fix TypeScript errors
   - Test failures: Fix failing tests
   - Build errors: Check dependencies and build configuration

### Deployment Failures

If deployment to Vercel fails:

1. Check GitHub Actions logs
2. Check Vercel deployment logs in dashboard
3. Common issues:
   - Environment variables missing
   - Build command incorrect
   - Dependencies not installed
   - Vercel token expired

### Security Alerts

Security scans may fail the build:

1. **High/Critical vulnerabilities**: Build blocked, must fix before deployment
2. **Moderate vulnerabilities**: Warning only, deployment proceeds
3. Fix vulnerabilities:
   ```bash
   # Update dependencies
   pnpm update

   # Check audit
   pnpm audit

   # Fix specific issues
   pnpm audit --fix
   ```

## Performance Optimization

### Build Cache

Turbo cache is enabled to speed up builds:

```json
{
  "turbo": {
    "cache": {
      "signature": true,
      "artifacts": ["dist/**", ".next/**"]
    }
  }
}
```

### Parallel Execution

Jobs run in parallel when possible:
- Lint and test jobs run concurrently
- Security scans run independently
- Multiple app deployments can run simultaneously

### Conditional Execution

Workflows only run for relevant changes:
- If only docs change, skip build/test
- If only IMS changes, skip marketplace deployment
- Change detection optimizes CI time

## Best Practices

### 1. Commit Messages

Use conventional commits for better automation:

```
feat: Add user authentication
fix: Resolve database connection issue
docs: Update deployment guide
test: Add tests for vehicle API
perf: Optimize image loading
```

### 2. Branch Protection

Configure branch protection rules for `main`:

1. Require pull request reviews (minimum 1)
2. Require status checks to pass:
   - lint-and-typecheck
   - test
   - security-scan
3. Require branches to be up to date
4. Require conversation resolution

### 3. Code Review Checklist

Before approving PR:

- [ ] Code follows project style guide
- [ ] All tests pass
- [ ] No security vulnerabilities introduced
- [ ] Preview deployment tested
- [ ] Documentation updated if needed
- [ ] No console.log or debug code
- [ ] Environment variables documented

### 4. Deployment Checklist

Before merging to main:

- [ ] All PR checks passed
- [ ] Preview deployment reviewed
- [ ] Database migrations prepared
- [ ] Environment variables verified
- [ ] Rollback plan documented
- [ ] Team notified of deployment

## Troubleshooting

### Workflow Not Triggering

**Issue**: GitHub Actions workflow doesn't run

**Solutions**:
1. Check workflow file syntax (YAML)
2. Verify trigger conditions match your branch/event
3. Check GitHub Actions is enabled for repository
4. Review GitHub Actions logs for errors

### Vercel Deployment Hangs

**Issue**: Deployment to Vercel takes too long or hangs

**Solutions**:
1. Check Vercel dashboard for deployment status
2. Cancel and retry deployment
3. Check build logs for stuck processes
4. Verify environment variables are set

### Test Failures in CI But Pass Locally

**Issue**: Tests pass locally but fail in CI

**Solutions**:
1. Check environment differences (Node version, dependencies)
2. Ensure database/Redis services are running in CI
3. Check for timezone issues
4. Review CI-specific environment variables

### Preview URL Not Commenting

**Issue**: Preview deployment succeeds but URL not posted to PR

**Solutions**:
1. Check GitHub token has required permissions
2. Verify `github-script` action configuration
3. Check if PR is from forked repository (limited permissions)
4. Review GitHub Actions logs for errors

## Cost Optimization

### GitHub Actions Minutes

Free tier: 2,000 minutes/month

Optimization tips:
1. Use change detection to skip unnecessary jobs
2. Cache dependencies between runs
3. Run tests in parallel
4. Use self-hosted runners for high-volume projects

### Vercel Build Minutes

Free tier: 6,000 minutes/month (Hobby)
Pro tier: 24,000 minutes/month

Optimization tips:
1. Enable Turbo cache
2. Use monorepo filtering to build only changed apps
3. Optimize build scripts
4. Use preview deployments sparingly

## Advanced Configuration

### Custom Deployment Domains

Configure custom domains for different branches:

```yaml
# .github/workflows/vercel-deploy.yml
- name: Deploy to custom domain
  run: |
    if [ "${{ github.ref }}" == "refs/heads/staging" ]; then
      vercel alias $DEPLOYMENT_URL staging.partpal.co.za
    fi
```

### Slack/Discord Notifications

Add notification step to workflow:

```yaml
- name: Notify team
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to production completed'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

### Database Migrations

Run migrations before deployment:

```yaml
- name: Run migrations
  run: |
    pnpm --filter @partpal/database prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Maintenance

### Weekly Tasks

- [ ] Review failed builds/deployments
- [ ] Check dependency vulnerabilities
- [ ] Review Vercel usage/costs
- [ ] Update dependencies if needed

### Monthly Tasks

- [ ] Review and update workflow configurations
- [ ] Audit security scan results
- [ ] Optimize build performance
- [ ] Review access tokens and rotate if needed

### Quarterly Tasks

- [ ] Review branch protection rules
- [ ] Audit team access and permissions
- [ ] Update Node.js version if needed
- [ ] Review and update documentation

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Git Integration](https://vercel.com/docs/concepts/git)
- [Turbo Documentation](https://turbo.build/repo/docs)

## Support

For issues with:
- **GitHub Actions**: Check workflow logs, GitHub Status page
- **Vercel Deployment**: Check Vercel logs, Vercel support
- **Build Issues**: Review build logs, check local build first
- **Security Scans**: Review vulnerability details, update dependencies

Generated with [Claude Code](https://claude.com/claude-code)

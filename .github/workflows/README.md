# PartPal CI/CD Pipeline Documentation

## Overview

This repository implements a comprehensive CI/CD pipeline for the PartPal platform using GitHub Actions, Docker, and Kubernetes.

## Pipeline Architecture

### Workflow Structure

1. **CI Pipeline** (`ci.yml`) - Runs on every push and pull request
2. **Docker Build** (`docker-build.yml`) - Builds and pushes container images
3. **Deploy Staging** (`deploy-staging.yml`) - Deploys to staging environment
4. **Deploy Production** (`deploy-production.yml`) - Deploys to production environment

### Change Detection

The pipeline uses `dorny/paths-filter` to detect changes in specific parts of the monorepo:
- `packages/`: Shared packages (affects all apps)
- `apps/ims/`: IMS application
- `apps/marketplace/`: Marketplace application
- `services/api/`: API service
- `infrastructure/`: Infrastructure configuration

## Environments

### Staging Environment
- **Trigger**: Push to `develop` branch
- **URL**: https://staging.partpal.co.za
- **IMS URL**: https://ims-staging.partpal.co.za
- **Namespace**: `partpal-staging`
- **Replicas**: 2 per service

### Production Environment
- **Trigger**: Push to `main` branch or release
- **URL**: https://partpal.co.za
- **IMS URL**: https://ims.partpal.co.za
- **Namespace**: `partpal`
- **Replicas**: 3 per service (with auto-scaling)

## Security

### Secrets Required

#### Kubernetes Configuration
- `KUBE_CONFIG_STAGING`: Base64-encoded kubeconfig for staging cluster
- `KUBE_CONFIG_PRODUCTION`: Base64-encoded kubeconfig for production cluster

#### Application Secrets (per environment)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

### Container Registry
- Uses GitHub Container Registry (ghcr.io)
- Authentication via `GITHUB_TOKEN` (automatic)

## Deployment Strategy

### Staging
- **Rolling Deployment**: Updates pods one by one
- **Health Checks**: HTTP checks on `/api/health`
- **Rollback**: Automatic on health check failure

### Production
- **Blue-Green Deployment**: Zero-downtime deployments
- **Sequential Deployment**: API → IMS → Marketplace
- **Extended Health Checks**: Multiple attempts with retry logic
- **Manual Approval**: Required for production deployments
- **Backup**: Previous deployment stored as artifacts

## Monitoring and Alerts

### Health Checks
- **Liveness Probe**: Checks if container is running
- **Readiness Probe**: Checks if container can handle traffic
- **Startup Probe**: Extended time for application startup

### Auto-scaling
- **HPA**: Horizontal Pod Autoscaler based on CPU/Memory
- **Marketplace**: 3-10 replicas
- **IMS**: 2-8 replicas
- **API**: 3-15 replicas

## Usage

### Manual Deployment

#### Staging
```bash
# Deploy specific services
gh workflow run deploy-staging.yml -f deploy_ims=true -f deploy_marketplace=false -f deploy_api=true
```

#### Production
```bash
# Deploy all services
gh workflow run deploy-production.yml

# Emergency deployment (skip tests)
gh workflow run deploy-production.yml -f skip_tests=true
```

### Rollback

#### Kubernetes Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/partpal-marketplace -n partpal

# Rollback to specific revision
kubectl rollout undo deployment/partpal-marketplace -n partpal --to-revision=2
```

#### Docker Image Rollback
```bash
# Use previous image tag
kubectl set image deployment/partpal-marketplace marketplace=ghcr.io/partpal/partpal-marketplace:previous-tag -n partpal
```

## Local Development

### Testing CI/CD Changes

1. **Fork the repository** for testing workflow changes
2. **Use act** for local GitHub Actions testing:
   ```bash
   # Install act
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

   # Run CI pipeline locally
   act push
   ```

3. **Docker Compose** for local environment testing:
   ```bash
   # Test staging environment
   docker-compose -f docker-compose.yml -f docker-compose.staging.yml up

   # Test production environment
   docker-compose -f docker-compose.yml -f docker-compose.production.yml up
   ```

## Troubleshooting

### Common Issues

#### Build Failures
- Check package.json dependencies
- Verify Turbo cache configuration
- Review build logs in GitHub Actions

#### Deployment Failures
- Verify Kubernetes secrets are present
- Check resource limits and requests
- Review pod logs: `kubectl logs -f deployment/partpal-api -n partpal`

#### Health Check Failures
- Ensure `/api/health` endpoint exists
- Check application startup time
- Verify environment variables

### Debugging Commands

```bash
# Check deployment status
kubectl get deployments -n partpal

# View pod logs
kubectl logs -f -l app=partpal-marketplace -n partpal

# Check resource usage
kubectl top pods -n partpal

# Port forward for testing
kubectl port-forward svc/partpal-api-service 3333:80 -n partpal
```

## Best Practices

### Code Quality
- All tests must pass before deployment
- Linting and type checking enforced
- Security audit on dependencies

### Container Security
- Multi-stage builds for minimal attack surface
- Non-root user in containers
- Resource limits enforced

### Infrastructure
- Namespace isolation between environments
- Network policies for service communication
- SSL/TLS termination at ingress

### Monitoring
- Structured logging with correlation IDs
- Metrics collection via Prometheus
- Alert integration with monitoring systems
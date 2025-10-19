# PartPal AWS Quick Start Guide
## Get Running in 30 Minutes

This is the express guide to deploy PartPal to AWS. For detailed information, see [AWS-DEPLOYMENT-GUIDE.md](./AWS-DEPLOYMENT-GUIDE.md).

---

## Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured
- [ ] Terraform 1.5+ installed
- [ ] kubectl installed
- [ ] Domain name (partpal.co.za) with Route 53 hosted zone
- [ ] GitHub repository access

---

## Step 1: AWS Initial Setup (5 minutes)

```bash
# Create Terraform state bucket
aws s3api create-bucket \
  --bucket partpal-terraform-state \
  --region af-south-1 \
  --create-bucket-configuration LocationConstraint=af-south-1

aws s3api put-bucket-versioning \
  --bucket partpal-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name partpal-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region af-south-1
```

---

## Step 2: Configure Terraform Variables (3 minutes)

```bash
cd infrastructure/terraform

# Copy example and edit
cp terraform.tfvars.example terraform.tfvars.staging

# Edit terraform.tfvars.staging
# Set these values:
# - db_password: Generate with: openssl rand -base64 24
# - environment: staging
```

---

## Step 3: Deploy Infrastructure (10 minutes)

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan -var-file="terraform.tfvars.staging"

# Deploy (takes ~10 minutes)
terraform apply -var-file="terraform.tfvars.staging"

# Save outputs
terraform output > terraform-outputs.txt
```

---

## Step 4: Configure kubectl (2 minutes)

```bash
# Get cluster name from terraform output
CLUSTER_NAME=$(terraform output -raw cluster_name)

# Configure kubectl
aws eks update-kubeconfig \
  --region af-south-1 \
  --name ${CLUSTER_NAME}

# Verify
kubectl get nodes
```

---

## Step 5: Create Kubernetes Secrets (3 minutes)

```bash
# Get endpoints from Terraform
RDS_ENDPOINT=$(terraform output -raw database_endpoint)
REDIS_ENDPOINT=$(terraform output -raw redis_primary_endpoint)

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)

# Create namespace
kubectl create namespace partpal

# Create secrets
kubectl create secret generic partpal-secrets \
  --namespace=partpal \
  --from-literal=database-url="postgresql://partpal:YOUR_DB_PASSWORD@${RDS_ENDPOINT}/partpal" \
  --from-literal=redis-url="redis://${REDIS_ENDPOINT}:6379" \
  --from-literal=jwt-secret="${JWT_SECRET}" \
  --from-literal=cloudinary-cloud-name="YOUR_CLOUDINARY_NAME" \
  --from-literal=cloudinary-api-key="YOUR_CLOUDINARY_KEY" \
  --from-literal=cloudinary-api-secret="YOUR_CLOUDINARY_SECRET"
```

---

## Step 6: Configure GitHub Secrets (2 minutes)

Go to GitHub Repository → Settings → Secrets → Actions

Add these secrets:

```
AWS_ACCESS_KEY_ID=<from terraform output>
AWS_SECRET_ACCESS_KEY=<from terraform output>
```

---

## Step 7: Deploy Applications (5 minutes)

```bash
# Option A: Push to trigger deployment
git push origin develop

# Option B: Manual deployment
# Go to: GitHub Actions → "Deploy to AWS EKS" → Run workflow
# Select: staging, deploy all services
```

---

## Step 8: Verify Deployment (2 minutes)

```bash
# Check pods
kubectl get pods -n partpal

# Check services
kubectl get services -n partpal

# Check ingress
kubectl get ingress -n partpal

# View logs
kubectl logs -f deployment/partpal-api -n partpal
```

---

## Step 9: Configure DNS (3 minutes)

```bash
# Get ALB DNS name
ALB_DNS=$(kubectl get ingress partpal-ingress -n partpal -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "Update Route 53 with CNAME records:"
echo "api.partpal.co.za → ${ALB_DNS}"
echo "ims.partpal.co.za → ${ALB_DNS}"
echo "partpal.co.za → ${ALB_DNS}"
```

Update Route 53:
1. Go to Route 53 Console
2. Select your hosted zone (partpal.co.za)
3. Create CNAME records pointing to ALB DNS

---

## Quick Commands Reference

### Deployment
```bash
# Build and push images
git push origin develop

# Deploy to staging
# Triggered automatically on push to develop

# Deploy to production
git push origin main
```

### Monitoring
```bash
# View all resources
kubectl get all -n partpal

# View pod logs
kubectl logs -f <pod-name> -n partpal

# Shell into pod
kubectl exec -it <pod-name> -n partpal -- /bin/sh

# Check deployment status
kubectl rollout status deployment/<name> -n partpal
```

### Troubleshooting
```bash
# Describe pod issues
kubectl describe pod <pod-name> -n partpal

# View events
kubectl get events -n partpal --sort-by='.lastTimestamp'

# Test database connection
kubectl run -it --rm debug --image=postgres:15 -n partpal -- bash
psql <your-database-url>

# Restart deployment
kubectl rollout restart deployment/<name> -n partpal
```

### Scaling
```bash
# Scale deployment
kubectl scale deployment/partpal-api --replicas=5 -n partpal

# Auto-scaling
kubectl autoscale deployment/partpal-api \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n partpal
```

---

## What Gets Deployed

### AWS Infrastructure
- **VPC** with public, private, and database subnets across 3 AZs
- **EKS Cluster** (v1.28) with 2-10 t3.medium nodes
- **RDS PostgreSQL 15** with automated backups
- **ElastiCache Redis 7** with encryption
- **Application Load Balancer** with SSL termination
- **ECR Repositories** for Docker images
- **CloudWatch** logging and monitoring
- **S3 Buckets** for static assets and backups

### Kubernetes Resources
- **Namespace**: partpal
- **Deployments**: API, IMS, Marketplace
- **Services**: ClusterIP for each app
- **Ingress**: ALB with SSL/TLS
- **Secrets**: Database, Redis, JWT, Cloudinary
- **Auto-scaling**: HPA for production

### GitHub Actions Workflows
- **aws-docker-build.yml**: Build and push to ECR
- **aws-deploy-eks.yml**: Deploy to EKS
- **ci.yml**: Lint, test, build with coverage
- **infrastructure.yml**: Terraform automation

---

## Cost Estimate

**Staging Environment:** ~$190-230/month
- EKS: $73
- EC2: $60 (2x t3.medium)
- RDS: $16 (db.t3.micro)
- Redis: $14 (cache.t3.micro)
- ALB: $16
- Other: $10-50

**Production Environment:** ~$340-490/month
- EKS: $73
- EC2: $90 (3x t3.medium)
- RDS: $67 (db.t3.small Multi-AZ)
- Redis: $28 (2 nodes)
- ALB: $16
- Other: $65-215

---

## Next Steps

1. ✅ Infrastructure deployed
2. ✅ Applications running
3. ⏳ Update DNS records
4. ⏳ Verify SSL certificates
5. ⏳ Setup monitoring dashboards
6. ⏳ Configure backups
7. ⏳ Run smoke tests
8. ⏳ Deploy to production

---

## Health Checks

```bash
# API
curl https://api.partpal.co.za/api/health

# IMS
curl https://ims.partpal.co.za/

# Marketplace
curl https://partpal.co.za/
```

---

## Emergency Procedures

### Rollback Deployment
```bash
# View rollout history
kubectl rollout history deployment/<name> -n partpal

# Rollback to previous version
kubectl rollout undo deployment/<name> -n partpal

# Rollback to specific revision
kubectl rollout undo deployment/<name> --to-revision=2 -n partpal
```

### Scale Down (Cost Saving)
```bash
# Scale all to 1 replica
kubectl scale deployment/partpal-api --replicas=1 -n partpal
kubectl scale deployment/partpal-ims --replicas=1 -n partpal
kubectl scale deployment/partpal-marketplace --replicas=1 -n partpal
```

### Complete Teardown
```bash
# WARNING: This destroys everything!
cd infrastructure/terraform
terraform destroy -var-file="terraform.tfvars.staging"
```

---

## Support

- **Documentation**: See AWS-DEPLOYMENT-GUIDE.md
- **Logs**: `kubectl logs -f <pod> -n partpal`
- **Metrics**: CloudWatch Dashboard
- **Issues**: GitHub Issues

---

**Quick Start Version:** 1.0
**Last Updated:** 2025-10-15

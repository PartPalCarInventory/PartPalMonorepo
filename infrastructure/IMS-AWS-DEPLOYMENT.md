# PartPal IMS - AWS Deployment Guide
## Optimized for 50 Concurrent Users

This guide focuses specifically on deploying the **PartPal IMS (Inventory Management System)** to AWS, optimized for 50 concurrent users.

---

## System Overview

### What is PartPal IMS?
PartPal IMS is a B2B inventory management system for scrap yards in South Africa, enabling:
- Vehicle check-in and management
- Parts inventory tracking
- Publishing parts to marketplace
- Sales and reporting
- Multi-user access with role-based permissions

### Architecture for 50 Users
- **2 Applications**: API Backend + IMS Frontend
- **2 EKS Nodes**: t3.small instances for high availability
- **Small RDS Instance**: db.t4g.micro (ARM-based for cost efficiency)
- **Single Redis Node**: cache.t4g.micro
- **Expected Performance**: <1 second response times under normal load

---

## Infrastructure Specifications

### AWS Resources (Optimized for 50 Users)

#### EKS Cluster
- **Nodes**: 2x t3.small (2 vCPU, 2GB RAM each)
- **Total Capacity**: 4 vCPU, 4GB RAM
- **Auto-scaling**: 1-4 nodes
- **Region**: af-south-1 (Cape Town)

#### Application Pods
- **API Backend**: 2 replicas
  - 250m CPU request, 500m CPU limit
  - 256Mi memory request, 512Mi memory limit
- **IMS Frontend**: 2 replicas
  - 250m CPU request, 500m CPU limit
  - 256Mi memory request, 512Mi memory limit

#### Database (RDS)
- **Instance**: db.t4g.micro (ARM-based)
- **Storage**: 20GB (auto-scales to 100GB)
- **Engine**: PostgreSQL 15.4
- **Backups**: 7 days retention
- **Connection Limit**: ~100 connections (sufficient for 50 users)

#### Cache (ElastiCache)
- **Instance**: cache.t4g.micro (ARM-based)
- **Memory**: 0.5GB
- **Node**: Single node (multi-AZ for production)

### Performance Capacity

**50 Concurrent Users:**
- API requests: ~100-150 requests/second
- Database connections: ~50 active connections
- Redis operations: ~200-300 ops/second
- Response times: <500ms for most operations

---

## Cost Breakdown

### Monthly Cost Estimate (ZAR - South Africa Region)

#### Staging Environment
| Service | Specification | Monthly Cost (USD) |
|---------|--------------|-------------------|
| EKS Cluster | Control plane | $73 |
| EC2 Instances | 2x t3.small | $30 |
| RDS PostgreSQL | db.t4g.micro | $12 |
| ElastiCache Redis | cache.t4g.micro | $11 |
| Application Load Balancer | Standard ALB | $16 |
| Data Transfer | ~20GB/month | $2 |
| CloudWatch | Basic monitoring | $5 |
| S3 Storage | Backups and assets | $2 |
| **Total** | | **~$151 USD/month** |

#### Production Environment
| Service | Specification | Monthly Cost (USD) |
|---------|--------------|-------------------|
| EKS Cluster | Control plane | $73 |
| EC2 Instances | 2x t3.small | $30 |
| RDS PostgreSQL | db.t4g.micro Multi-AZ | $24 |
| ElastiCache Redis | cache.t4g.micro Multi-AZ | $22 |
| Application Load Balancer | Standard ALB | $16 |
| Data Transfer | ~50GB/month | $5 |
| CloudWatch | Enhanced monitoring | $8 |
| S3 Storage | Backups and assets | $3 |
| **Total** | | **~$181 USD/month** |

**Conversion to ZAR (approx 1 USD = 18 ZAR):**
- Staging: ~R2,718/month
- Production: ~R3,258/month

### Cost Optimization Tips for Small Scale

1. **Use Savings Plans** - 1-year commitment saves 30-40%
2. **Schedule Downtime** - Scale to 1 replica during off-hours (6pm-7am)
3. **Reserved Instances** - RDS Reserved Instance saves 40%
4. **Single-AZ Staging** - Use Multi-AZ only for production
5. **Lifecycle Policies** - Auto-delete old ECR images and S3 backups

**Potential Savings:** 20-35% with optimization = ~$110-140/month

---

## Quick Start Guide (30 Minutes)

### Prerequisites
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Install Terraform
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
unzip terraform_1.5.0_linux_amd64.zip && sudo mv terraform /usr/local/bin/

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/

# Configure AWS CLI
aws configure
```

### Step 1: Create Terraform State Backend (5 min)
```bash
# S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket partpal-ims-terraform-state \
  --region af-south-1 \
  --create-bucket-configuration LocationConstraint=af-south-1

aws s3api put-bucket-versioning \
  --bucket partpal-ims-terraform-state \
  --versioning-configuration Status=Enabled

# DynamoDB for state locking
aws dynamodb create-table \
  --table-name partpal-ims-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region af-south-1
```

### Step 2: Configure Terraform Variables (3 min)
```bash
cd infrastructure/terraform

cat > terraform.tfvars <<EOF
environment = "staging"
aws_region = "af-south-1"
domain_name = "partpal.co.za"

# Network
vpc_cidr = "10.0.0.0/16"

# EKS - Optimized for 50 users
kubernetes_version = "1.28"

# Database - Small instance
postgres_version = "15.4"
db_instance_class = "db.t4g.micro"
db_allocated_storage = 20
db_name = "partpal_ims"
db_username = "partpal"
db_password = "$(openssl rand -base64 24)"

# Redis - Single node
redis_node_type = "cache.t4g.micro"
redis_num_cache_nodes = 1

# Monitoring
log_retention_days = 7
EOF
```

### Step 3: Deploy Infrastructure (10 min)
```bash
terraform init
terraform plan
terraform apply -auto-approve

# Save outputs
terraform output -json > outputs.json
```

### Step 4: Configure Kubernetes (5 min)
```bash
# Update kubeconfig
CLUSTER_NAME=$(terraform output -raw cluster_name)
aws eks update-kubeconfig --region af-south-1 --name ${CLUSTER_NAME}

# Create namespace
kubectl create namespace partpal

# Create secrets
RDS_ENDPOINT=$(terraform output -raw database_endpoint)
REDIS_ENDPOINT=$(terraform output -raw redis_primary_endpoint)
JWT_SECRET=$(openssl rand -base64 32)

kubectl create secret generic partpal-secrets \
  --namespace=partpal \
  --from-literal=database-url="postgresql://partpal:YOUR_PASSWORD@${RDS_ENDPOINT}/partpal_ims" \
  --from-literal=redis-url="redis://${REDIS_ENDPOINT}:6379" \
  --from-literal=jwt-secret="${JWT_SECRET}" \
  --from-literal=cloudinary-cloud-name="YOUR_CLOUDINARY_NAME" \
  --from-literal=cloudinary-api-key="YOUR_KEY" \
  --from-literal=cloudinary-api-secret="YOUR_SECRET"
```

### Step 5: Configure GitHub Secrets (2 min)
```
Go to: GitHub → Settings → Secrets and variables → Actions

Add:
AWS_ACCESS_KEY_ID=<from terraform output>
AWS_SECRET_ACCESS_KEY=<from terraform output>
```

### Step 6: Deploy IMS (5 min)
```bash
# Push to trigger deployment
git add .
git commit -m "Configure IMS deployment"
git push origin develop  # Deploys to staging

# Or manually trigger via GitHub Actions
```

### Step 7: Verify Deployment
```bash
# Check pods
kubectl get pods -n partpal

# Expected output:
# partpal-api-xxxxx   1/1   Running
# partpal-api-xxxxx   1/1   Running
# partpal-ims-xxxxx   1/1   Running
# partpal-ims-xxxxx   1/1   Running

# Check services
kubectl get ingress -n partpal

# Test API
kubectl port-forward svc/partpal-api-service 3333:80 -n partpal
curl http://localhost:3333/api/health

# Test IMS
kubectl port-forward svc/partpal-ims-service 3001:80 -n partpal
# Open browser: http://localhost:3001
```

---

## User Capacity Planning

### 50 Concurrent Users Breakdown

**Resource Usage Per User (Average):**
- CPU: 5-10m per user = 250-500m total for 50 users
- Memory: 5-10Mi per user = 250-500Mi total for 50 users
- Database Connections: 1 per user = 50 connections
- API Requests: 2-3 requests/second per user = 100-150 req/s

**Current Configuration Handles:**
- **CPU**: 4 vCPU total (2 nodes x 2 vCPU) - comfortable for 50 users
- **Memory**: 4GB total - comfortable for 50 users
- **Database**: 100 connections limit - sufficient for 50 users
- **Load Balancer**: Can handle 1000+ req/s - more than sufficient

### Scaling Recommendations

**If you need to scale to 100 users:**
1. Increase EKS nodes to 3x t3.small
2. Upgrade RDS to db.t4g.small
3. Keep Redis as-is (sufficient for 100 users)
4. Total cost increase: ~$40/month

**If you need to scale to 200 users:**
1. Increase EKS nodes to 4x t3.medium
2. Upgrade RDS to db.t4g.medium
3. Add Redis replica (2 nodes)
4. Total cost increase: ~$120/month

---

## Production Deployment Checklist

- [ ] Infrastructure deployed with Terraform
- [ ] EKS cluster running (2 nodes)
- [ ] RDS PostgreSQL created and accessible
- [ ] ElastiCache Redis running
- [ ] Kubernetes secrets configured
- [ ] GitHub Actions configured with AWS credentials
- [ ] IMS deployed to staging
- [ ] Health checks passing
- [ ] Domain configured (ims.partpal.co.za)
- [ ] SSL certificate issued
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Load testing completed (50 concurrent users)
- [ ] User acceptance testing passed
- [ ] Deploy to production

---

## Monitoring and Alerts

### Key Metrics to Monitor

**Application Health:**
```bash
# Pod status
kubectl get pods -n partpal

# Pod resource usage
kubectl top pods -n partpal

# Logs
kubectl logs -f deployment/partpal-ims -n partpal
kubectl logs -f deployment/partpal-api -n partpal
```

**Database Monitoring:**
```bash
# RDS CloudWatch metrics
- CPUUtilization (should be <70%)
- DatabaseConnections (should be <80)
- FreeableMemory (should be >100MB)
- ReadLatency / WriteLatency (should be <10ms)
```

**Redis Monitoring:**
```bash
# ElastiCache CloudWatch metrics
- CPUUtilization (should be <60%)
- CurrConnections (should be <50)
- EngineCPUUtilization (should be <70%)
```

### Recommended Alerts

1. **Pod Restarts** - Alert if pods restart >3 times in 15 minutes
2. **High CPU** - Alert if CPU >80% for 5 minutes
3. **High Memory** - Alert if memory >85% for 5 minutes
4. **Database Connections** - Alert if >80 connections
5. **API Response Time** - Alert if >1 second for 5 minutes
6. **Pod Not Ready** - Alert if pods not ready for 3 minutes

---

## Backup and Disaster Recovery

### Automated Backups

**RDS Backups:**
- Automated daily backups (7-day retention)
- Backup window: 3:00-4:00 AM SAST
- Point-in-time recovery enabled

**Application Data:**
```bash
# Manual database backup
kubectl run postgres-backup --rm -i --restart=Never --image=postgres:15 -- \
  pg_dump -h RDS_ENDPOINT -U partpal partpal_ims > backup.sql

# Upload to S3
aws s3 cp backup.sql s3://partpal-ims-backups/$(date +%Y-%m-%d)/
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective): 30 minutes**
**RPO (Recovery Point Objective): 24 hours**

**Recovery Steps:**
1. Deploy infrastructure with Terraform (10 min)
2. Restore database from latest backup (10 min)
3. Deploy applications (5 min)
4. Verify health checks (5 min)

---

## Troubleshooting Guide

### Common Issues

#### Pods Not Starting
```bash
# Check events
kubectl describe pod <pod-name> -n partpal

# Common causes:
# 1. Image pull error - check ECR permissions
# 2. Missing secrets - verify secrets exist
# 3. Resource limits - check node capacity

# Fix:
kubectl get nodes  # Check node status
kubectl get secrets -n partpal  # Verify secrets
```

#### Database Connection Failed
```bash
# Test connectivity
kubectl run -it --rm debug --image=postgres:15 -n partpal -- \
  psql postgresql://partpal:PASSWORD@RDS_ENDPOINT:5432/partpal_ims

# Check security groups
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*database*"
```

#### High Memory Usage
```bash
# Check resource usage
kubectl top pods -n partpal

# If needed, increase memory limits:
kubectl set resources deployment/partpal-api \
  --limits=memory=768Mi -n partpal
```

---

## Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor application logs
- Check pod health status

**Weekly:**
- Review CloudWatch metrics
- Check disk space usage
- Review error logs

**Monthly:**
- Update dependencies
- Review and optimize costs
- Test backup restoration
- Update SSL certificates (auto-renewed)

### Getting Help

- **Documentation**: See AWS-DEPLOYMENT-GUIDE.md for detailed info
- **AWS Support**: https://console.aws.amazon.com/support/
- **Kubernetes**: https://kubernetes.io/docs/
- **Application Logs**: `kubectl logs -f <pod> -n partpal`

---

## Next Steps

1. ✅ Deploy staging environment
2. ⏳ Load test with 50 simulated users
3. ⏳ User acceptance testing
4. ⏳ Configure production environment
5. ⏳ Deploy to production
6. ⏳ Train users on IMS system
7. ⏳ Monitor and optimize

---

**Version:** 1.0 (Optimized for 50 Users)
**Last Updated:** 2025-10-15
**System:** PartPal IMS Only
**Target Users:** 50 concurrent users
**Monthly Cost:** ~$150-180 USD (~R2,700-3,300 ZAR)

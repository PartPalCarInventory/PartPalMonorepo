# PartPal AWS Deployment Guide
## Complete CI/CD Pipeline for AWS EKS

This guide provides step-by-step instructions for deploying PartPal to AWS using EKS, ECR, RDS, and ElastiCache.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Initial AWS Setup](#initial-aws-setup)
4. [Terraform Infrastructure](#terraform-infrastructure)
5. [GitHub Actions Configuration](#github-actions-configuration)
6. [Kubernetes Configuration](#kubernetes-configuration)
7. [Deployment Process](#deployment-process)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Cost Optimization](#cost-optimization)

---

## Architecture Overview

### AWS Services Used

- **EKS (Elastic Kubernetes Service)**: Container orchestration
- **ECR (Elastic Container Registry)**: Docker image storage
- **RDS PostgreSQL**: Relational database
- **ElastiCache Redis**: Caching and session storage
- **ALB (Application Load Balancer)**: Load balancing and SSL termination
- **ACM (Certificate Manager)**: SSL/TLS certificates
- **Route 53**: DNS management
- **CloudWatch**: Logging and monitoring
- **S3**: Static assets and backups
- **VPC**: Network isolation

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Route 53                             │
│                    (partpal.co.za)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                Application Load Balancer                     │
│                     (SSL Termination)                        │
└──────────────┬──────────────────┬──────────────┬────────────┘
               │                  │              │
     ┌─────────▼────────┐ ┌──────▼──────┐ ┌────▼────────┐
     │   Marketplace    │ │     IMS     │ │     API     │
     │   (Port 3000)    │ │ (Port 3001) │ │ (Port 3333) │
     └──────────────────┘ └─────────────┘ └──────┬──────┘
                                                  │
                        ┌─────────────────────────┴──────────┐
                        │                                    │
               ┌────────▼────────┐              ┌───────────▼──────────┐
               │  RDS PostgreSQL │              │  ElastiCache Redis   │
               │    (Port 5432)  │              │     (Port 6379)      │
               └─────────────────┘              └──────────────────────┘
```

### Deployment Flow

```
GitHub Push → GitHub Actions → Build Docker Images → Push to ECR
    → Deploy to EKS → Health Checks → Traffic Switch
```

---

## Prerequisites

### Required Tools

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Terraform
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
unzip terraform_1.5.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# eksctl (optional but recommended)
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

### AWS Account Requirements

- AWS Account with admin access
- Region: af-south-1 (Cape Town)
- Domain name registered (partpal.co.za)
- Route 53 hosted zone

---

## Initial AWS Setup

### 1. Create S3 Bucket for Terraform State

```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket partpal-terraform-state \
  --region af-south-1 \
  --create-bucket-configuration LocationConstraint=af-south-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket partpal-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket partpal-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 2. Create DynamoDB Table for State Locking

```bash
aws dynamodb create-table \
  --table-name partpal-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region af-south-1
```

### 3. Create IAM User for GitHub Actions

```bash
# Create IAM user
aws iam create-user --user-name partpal-github-actions

# Attach policies (adjust as needed)
aws iam attach-user-policy \
  --user-name partpal-github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-user-policy \
  --user-name partpal-github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy

# Create access keys
aws iam create-access-key --user-name partpal-github-actions
```

Save the Access Key ID and Secret Access Key for GitHub Secrets.

---

## Terraform Infrastructure

### 1. Create terraform.tfvars File

```bash
cd infrastructure/terraform

cat > terraform.tfvars.staging <<EOF
environment = "staging"
aws_region = "af-south-1"
domain_name = "partpal.co.za"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"

# EKS Configuration
kubernetes_version = "1.28"
node_groups = {
  general = {
    instance_types = ["t3.medium"]
    capacity_type  = "ON_DEMAND"
    min_size      = 2
    max_size      = 5
    desired_size  = 2
    disk_size     = 50
    ami_type      = "AL2_x86_64"
    labels = {
      role = "general"
    }
    taints = []
  }
}

# Database Configuration
postgres_version = "15.4"
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
db_max_allocated_storage = 100
db_name = "partpal"
db_username = "partpal"
db_password = "CHANGE-THIS-PASSWORD"  # Change this!

# Redis Configuration
redis_node_type = "cache.t3.micro"
redis_num_cache_nodes = 1

# Monitoring
log_retention_days = 14
EOF
```

### 2. Initialize and Apply Terraform

```bash
# Initialize Terraform
terraform init

# Plan the infrastructure
terraform plan -var-file="terraform.tfvars.staging"

# Apply the infrastructure
terraform apply -var-file="terraform.tfvars.staging"
```

### 3. Save Terraform Outputs

```bash
# Get EKS cluster name
terraform output cluster_name

# Get ECR repository URLs
terraform output ecr_repository_urls

# Get database endpoint
terraform output database_endpoint

# Get Redis endpoint
terraform output redis_primary_endpoint

# Get GitHub Actions credentials
terraform output github_actions_access_key_id
terraform output github_actions_secret_access_key
```

---

## GitHub Actions Configuration

### Required GitHub Secrets

Navigate to GitHub Repository → Settings → Secrets and variables → Actions

Add the following secrets:

```
# AWS Credentials
AWS_ACCESS_KEY_ID=<from terraform output>
AWS_SECRET_ACCESS_KEY=<from terraform output>

# Database (optional, can be in Kubernetes secrets)
DB_PASSWORD=<your database password>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your cloudinary cloud name>
CLOUDINARY_API_KEY=<your cloudinary api key>
CLOUDINARY_API_SECRET=<your cloudinary api secret>

# JWT
JWT_SECRET=<generate secure random string>

# Optional: Code coverage and security scanning
CODECOV_TOKEN=<from codecov.io>
SNYK_TOKEN=<from snyk.io>
```

### Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

---

## Kubernetes Configuration

### 1. Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --region af-south-1 \
  --name partpal-staging

# Verify connection
kubectl get nodes
```

### 2. Create Kubernetes Secrets

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(terraform output -raw database_endpoint)
REDIS_ENDPOINT=$(terraform output -raw redis_primary_endpoint)

# Create secrets
kubectl create namespace partpal

kubectl create secret generic partpal-secrets \
  --namespace=partpal \
  --from-literal=database-url="postgresql://partpal:YOUR_PASSWORD@${RDS_ENDPOINT}:5432/partpal" \
  --from-literal=redis-url="redis://${REDIS_ENDPOINT}:6379" \
  --from-literal=jwt-secret="YOUR_JWT_SECRET" \
  --from-literal=cloudinary-cloud-name="YOUR_CLOUD_NAME" \
  --from-literal=cloudinary-api-key="YOUR_API_KEY" \
  --from-literal=cloudinary-api-secret="YOUR_API_SECRET"
```

### 3. Install AWS Load Balancer Controller

```bash
# Create IAM policy
curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam-policy.json

# Create IAM role
eksctl create iamserviceaccount \
  --cluster=partpal-staging \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::YOUR_ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --approve

# Install controller using Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=partpal-staging \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### 4. Configure Ingress for ALB

```yaml
# Create ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: partpal-ingress
  namespace: partpal
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: <ACM_CERTIFICATE_ARN>
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
spec:
  rules:
  - host: api.partpal.co.za
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: partpal-api-service
            port:
              number: 80
  - host: ims.partpal.co.za
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: partpal-ims-service
            port:
              number: 80
  - host: partpal.co.za
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: partpal-marketplace-service
            port:
              number: 80
```

Apply ingress:
```bash
kubectl apply -f ingress.yaml
```

---

## Deployment Process

### Automated Deployment

1. **Push to develop branch** → Deploys to staging
2. **Push to main branch** → Deploys to production

### Manual Deployment

```bash
# Go to GitHub Actions
# Select "Deploy to AWS EKS" workflow
# Click "Run workflow"
# Select environment and services to deploy
```

### First-Time Deployment

```bash
# 1. Build and push Docker images
git push origin develop

# 2. Wait for Docker build workflow to complete
# Check: Actions → AWS ECR Docker Build and Push

# 3. Deploy to EKS
# The deployment should trigger automatically
# Or run manually: Actions → Deploy to AWS EKS

# 4. Get ALB DNS name
kubectl get ingress partpal-ingress -n partpal

# 5. Update Route 53 DNS records
# Point your domains to the ALB DNS name
```

---

## Monitoring and Maintenance

### CloudWatch Logs

```bash
# View application logs
aws logs tail /aws/eks/partpal-staging/application --follow

# View cluster logs
aws logs tail /aws/eks/partpal-staging/cluster --follow
```

### Kubernetes Monitoring

```bash
# Check pod status
kubectl get pods -n partpal

# View pod logs
kubectl logs -f <pod-name> -n partpal

# Describe pod
kubectl describe pod <pod-name> -n partpal

# Check deployments
kubectl get deployments -n partpal

# Check services
kubectl get services -n partpal

# Check ingress
kubectl get ingress -n partpal
```

### Database Monitoring

```bash
# RDS metrics
aws rds describe-db-instances \
  --db-instance-identifier partpal-staging-postgres

# CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=partpal-staging-postgres \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

---

## Troubleshooting

### Common Issues

#### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n partpal

# Common causes:
# 1. Image pull errors - check ECR permissions
# 2. Missing secrets - verify secrets exist
# 3. Resource limits - check node capacity
```

#### Database Connection Issues

```bash
# Test database connection from pod
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- bash
psql postgresql://partpal:PASSWORD@RDS_ENDPOINT:5432/partpal

# Check security groups
# Ensure EKS security group can access RDS security group
```

#### Image Pull Errors

```bash
# Check ECR login
aws ecr get-login-password --region af-south-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.af-south-1.amazonaws.com

# Verify image exists
aws ecr describe-images \
  --repository-name partpal-staging-api \
  --region af-south-1
```

#### Load Balancer Not Created

```bash
# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify IAM permissions
# Ensure controller has correct IAM role
```

---

## Cost Optimization

### Cost Estimates (South Africa Region)

**Staging Environment (per month):**
- EKS Cluster: $73
- EC2 (2x t3.medium): $60
- RDS (db.t3.micro): $16
- ElastiCache (cache.t3.micro): $14
- ALB: $16
- Data Transfer: $10-50
- **Total: ~$189-229/month**

**Production Environment (per month):**
- EKS Cluster: $73
- EC2 (3x t3.medium): $90
- RDS (db.t3.small, Multi-AZ): $67
- ElastiCache (2 nodes): $28
- ALB: $16
- CloudWatch: $10
- S3: $5
- Data Transfer: $50-150
- **Total: ~$339-489/month**

### Cost Optimization Tips

1. **Use Spot Instances** for non-critical workloads
2. **Enable Auto-scaling** to scale down during low traffic
3. **Use Reserved Instances** for production (save up to 70%)
4. **Implement CloudWatch alarms** for cost anomalies
5. **Regular cleanup** of unused ECR images
6. **Use S3 Lifecycle policies** for old backups
7. **Enable RDS backups** retention (7 days max for staging)

### Scheduled Scaling

```yaml
# Add to Kubernetes for cost savings
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: partpal-api-hpa
  namespace: partpal
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: partpal-api
  minReplicas: 1  # Scale down off-hours
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Next Steps

1. ✅ Infrastructure deployed with Terraform
2. ✅ ECR repositories created
3. ✅ EKS cluster running
4. ✅ GitHub Actions configured
5. ⏳ First deployment to staging
6. ⏳ DNS records updated
7. ⏳ SSL certificates verified
8. ⏳ Monitoring dashboards created
9. ⏳ Backup strategy implemented
10. ⏳ Production deployment

---

## Support and Resources

### Documentation
- AWS EKS: https://docs.aws.amazon.com/eks/
- Terraform: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- Kubernetes: https://kubernetes.io/docs/

### Monitoring
- CloudWatch: https://console.aws.amazon.com/cloudwatch/
- EKS Dashboard: https://console.aws.amazon.com/eks/

### Terraform Commands Reference

```bash
# Initialize
terraform init

# Plan
terraform plan -var-file="terraform.tfvars.staging"

# Apply
terraform apply -var-file="terraform.tfvars.staging"

# Destroy (careful!)
terraform destroy -var-file="terraform.tfvars.staging"

# Show outputs
terraform output

# Refresh state
terraform refresh -var-file="terraform.tfvars.staging"
```

---

**Last Updated:** 2025-10-15
**Version:** 1.0
**Maintained by:** CI/CD Pipeline Agent

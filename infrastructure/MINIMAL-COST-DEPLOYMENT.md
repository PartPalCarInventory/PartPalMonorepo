# PartPal IMS - Minimal Cost Deployment
## Optimized for 3-4 Users Per Day

**Target Traffic:** 3-4 users per day (not concurrent)
**Use Case:** Development, testing, or very light production use
**Cost Target:** Absolute minimum while maintaining functionality

---

## Cost Breakdown - Minimal Traffic Configuration

### Option 1: AWS EKS (Minimal Configuration)
**Monthly Cost: ~$105-115 USD (~R1,890-2,070 ZAR)**

| Service | Specification | Monthly Cost (USD) |
|---------|--------------|-------------------|
| EKS Cluster | Control plane | $73 |
| EC2 Instances | 1x t3.micro | $7.50 |
| RDS PostgreSQL | db.t4g.micro | $12 |
| ElastiCache Redis | cache.t4g.micro | $11 |
| ~~Application Load Balancer~~ | Removed - use Ingress Nginx | $0 |
| Data Transfer | <5GB/month | $0.50 |
| CloudWatch | Minimal logging | $2 |
| **Total** | | **~$106 USD/month** |

**In ZAR (at R18 per USD): ~R1,908/month**

### Option 2: AWS Lightsail (Recommended for Minimal Traffic)
**Monthly Cost: ~$20-30 USD (~R360-540 ZAR)**

| Service | Specification | Monthly Cost (USD) |
|---------|--------------|-------------------|
| Lightsail Instance | 2GB RAM, 1 vCPU | $10 |
| Lightsail Database | 1GB RAM PostgreSQL | $15 |
| Static IP | 1 IP address | $0 |
| Data Transfer | 2TB included | $0 |
| Snapshots | 10GB backup | $1 |
| **Total** | | **~$26 USD/month** |

**In ZAR (at R18 per USD): ~R468/month**

### Option 3: Single Container Solution (Ultra-Minimal)
**Monthly Cost: ~$15-20 USD (~R270-360 ZAR)**

| Service | Specification | Monthly Cost (USD) |
|---------|--------------|-------------------|
| EC2 Instance | t3.small (all-in-one) | $15 |
| Elastic IP | Static IP | $0 |
| EBS Volume | 30GB storage | $3 |
| Data Transfer | <5GB/month | $0.50 |
| Snapshots | 20GB backup | $2 |
| **Total** | | **~$20.50 USD/month** |

**In ZAR (at R18 per USD): ~R369/month**

---

## Recommended Solution: Option 2 (AWS Lightsail)

For 3-4 users per day, **AWS Lightsail** is the most cost-effective option.

### Why Lightsail?

1. **Simple pricing** - No complex calculations
2. **All-inclusive** - Bandwidth, static IP included
3. **Predictable costs** - No surprise charges
4. **Easy management** - Simple UI, less complexity
5. **Perfect for low traffic** - Designed for small applications

### Lightsail Configuration

#### Application Instance ($10/month)
- **Plan**: 2GB RAM, 1 vCPU, 60GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Includes**:
  - 2TB data transfer
  - Static IP address
  - DNS management
  - Automatic snapshots
- **Runs**:
  - Docker containers (API + IMS)
  - Nginx reverse proxy
  - Redis (in-memory, local)

#### Database ($15/month)
- **Plan**: Standard PostgreSQL - 1GB RAM
- **Includes**:
  - Automated backups (7 days)
  - High availability option
  - Automatic failover (optional)
  - SSL connections
  - CloudWatch monitoring

### Total Cost: $26/month (~R468/month)

---

## Detailed Cost Comparison

### Traffic Analysis: 3-4 Users Per Day

**Usage Pattern:**
- 4 users × 30 minutes per session = 2 hours of active use per day
- 10-20 API requests per user = 40-80 requests/day
- Database queries: ~200-400 per day
- Peak concurrent users: 1-2 (very rare)

**Resource Requirements:**
- CPU: <10% utilization average
- Memory: ~500MB-1GB
- Database: <10 connections active
- Network: <5GB data transfer/month

### Cost Comparison Table

| Configuration | Monthly Cost (USD) | Monthly Cost (ZAR) | Best For |
|--------------|-------------------|-------------------|----------|
| **Original (50 users)** | $151-181 | R2,718-3,258 | 50 concurrent users |
| **EKS Minimal** | $106 | R1,908 | 10-20 users/day |
| **Lightsail (Recommended)** | $26 | R468 | 3-5 users/day |
| **Single EC2** | $20.50 | R369 | Development only |

### Annual Cost Comparison

| Configuration | Annual Cost (USD) | Annual Cost (ZAR) | Annual Savings vs Original |
|--------------|------------------|------------------|----------------------------|
| Original (50 users) | $1,812-2,172 | R32,616-39,096 | Baseline |
| EKS Minimal | $1,272 | R22,896 | $540-900 (30-40%) |
| **Lightsail** | **$312** | **R5,616** | **$1,500-1,860 (83-86%)** |
| Single EC2 | $246 | R4,428 | $1,566-1,926 (86-89%) |

---

## Lightsail Deployment Guide

### Prerequisites
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Configure AWS
aws configure
```

### Step 1: Create Lightsail Database (5 minutes)

```bash
# Create PostgreSQL database
aws lightsail create-relational-database \
  --relational-database-name partpal-ims-db \
  --relational-database-bundle-id micro_2_0 \
  --engine postgres \
  --master-database-name partpal_ims \
  --master-username partpal \
  --master-user-password "$(openssl rand -base64 24)" \
  --region af-south-1

# Wait for database to be available (3-5 minutes)
aws lightsail get-relational-database \
  --relational-database-name partpal-ims-db \
  --query 'relationalDatabase.state'
```

### Step 2: Create Lightsail Instance (3 minutes)

```bash
# Create instance
aws lightsail create-instances \
  --instance-names partpal-ims \
  --availability-zone af-south-1a \
  --blueprint-id ubuntu_22_04 \
  --bundle-id medium_2_0 \
  --region af-south-1

# Allocate static IP
aws lightsail allocate-static-ip \
  --static-ip-name partpal-ims-ip \
  --region af-south-1

# Attach static IP
aws lightsail attach-static-ip \
  --static-ip-name partpal-ims-ip \
  --instance-name partpal-ims \
  --region af-south-1
```

### Step 3: Configure Instance (10 minutes)

```bash
# Get SSH key
aws lightsail download-default-key-pair \
  --region af-south-1 \
  --output text \
  --query 'privateKeyBase64' | base64 --decode > lightsail-key.pem
chmod 600 lightsail-key.pem

# Get instance IP
INSTANCE_IP=$(aws lightsail get-static-ip \
  --static-ip-name partpal-ims-ip \
  --query 'staticIp.ipAddress' \
  --output text)

# SSH to instance
ssh -i lightsail-key.pem ubuntu@${INSTANCE_IP}
```

#### On the Lightsail Instance:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p ~/partpal-ims
cd ~/partpal-ims
```

### Step 4: Create Docker Compose Configuration (5 minutes)

```yaml
# Create docker-compose.yml
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --maxmemory 100mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - partpal

  api:
    image: YOUR_ECR_URL/partpal-staging-api:latest
    restart: always
    ports:
      - "3333:3333"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://partpal:PASSWORD@DB_ENDPOINT:5432/partpal_ims
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
    depends_on:
      - redis
    networks:
      - partpal
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3333/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ims:
    image: YOUR_ECR_URL/partpal-staging-ims:latest
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api:3333
    depends_on:
      - api
    networks:
      - partpal
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - ims
    networks:
      - partpal

volumes:
  redis-data:

networks:
  partpal:
    driver: bridge
EOF
```

### Step 5: Configure Nginx (3 minutes)

```nginx
# Create nginx.conf
cat > nginx.conf <<'EOF'
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3333;
    }

    upstream ims {
        server ims:3001;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name ims.partpal.co.za api.partpal.co.za;
        return 301 https://$server_name$request_uri;
    }

    # IMS Frontend
    server {
        listen 443 ssl;
        server_name ims.partpal.co.za;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://ims;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # API Backend
    server {
        listen 443 ssl;
        server_name api.partpal.co.za;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
```

### Step 6: Setup SSL with Let's Encrypt (5 minutes)

```bash
# Install certbot
sudo apt install -y certbot

# Get SSL certificate
sudo certbot certonly --standalone \
  -d ims.partpal.co.za \
  -d api.partpal.co.za \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Copy certificates
mkdir -p ssl
sudo cp /etc/letsencrypt/live/ims.partpal.co.za/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/ims.partpal.co.za/privkey.pem ssl/
sudo chown ubuntu:ubuntu ssl/*

# Setup auto-renewal
(crontab -l 2>/dev/null; echo "0 0 1 * * sudo certbot renew --quiet && sudo cp /etc/letsencrypt/live/ims.partpal.co.za/*.pem ~/partpal-ims/ssl/ && cd ~/partpal-ims && docker-compose restart nginx") | crontab -
```

### Step 7: Deploy Application (2 minutes)

```bash
# Set environment variables
cat > .env <<EOF
JWT_SECRET=$(openssl rand -base64 32)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EOF

# Login to ECR
aws ecr get-login-password --region af-south-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.af-south-1.amazonaws.com

# Pull images
docker-compose pull

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

---

## Cost Optimization Strategies

### Further Reduce Costs

#### 1. Use Lightsail Snapshots for Backup ($1/10GB/month)
```bash
# Create snapshot
aws lightsail create-instance-snapshot \
  --instance-name partpal-ims \
  --instance-snapshot-name partpal-ims-snapshot-$(date +%Y%m%d)
```

#### 2. Schedule Downtime (If Applicable)
If the system is only used during business hours (8am-6pm):
- Stop instance during off-hours: **Save ~60% on compute**
- Keep database running (only $15/month)
- **New Total**: ~$15/month (~R270/month)

```bash
# Stop instance (scheduled via cron or Lambda)
aws lightsail stop-instance --instance-name partpal-ims

# Start instance
aws lightsail start-instance --instance-name partpal-ims
```

#### 3. Use Lightsail Container Service (Alternative)
For even simpler deployment:
- **Cost**: $7/month (Nano: 0.25 vCPU, 512MB RAM)
- **Includes**: Load balancing, auto-scaling, SSL
- **Total with DB**: $22/month (~R396/month)

---

## Performance Expectations

### For 3-4 Users Per Day

**Lightsail Configuration (2GB RAM, 1 vCPU):**
- Handles up to 10-15 concurrent users
- Response times: <500ms for most operations
- Database queries: <100ms
- Uptime: 99.9% (Lightsail SLA)

**Load Capacity:**
- API requests: Up to 50 requests/second
- Concurrent users: 10-15 comfortably
- Database connections: 100 available
- Storage: 60GB (expandable)

**This configuration can actually handle:**
- **Current**: 3-4 users/day
- **Growth**: Up to 20-30 users/day
- **Peak**: 50-100 users/day for short periods

---

## Monitoring on Lightsail

### Built-in Monitoring (Free)
```bash
# View metrics
aws lightsail get-instance-metric-data \
  --instance-name partpal-ims \
  --metric-name CPUUtilization \
  --period 300 \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S)
```

**Available Metrics:**
- CPU utilization
- Network in/out
- Instance state
- Burst capacity

### Application Monitoring
```bash
# View Docker logs
docker-compose logs -f --tail=100

# Check resource usage
docker stats

# Health checks
curl http://localhost:3333/api/health
curl http://localhost:3001
```

---

## Migration Path

### If Traffic Grows

**5-10 users/day** - Current config sufficient

**10-20 users/day** - Upgrade to 4GB Lightsail ($20/month)
- Total: $35/month (~R630/month)

**20-50 users/day** - Upgrade to 8GB Lightsail ($40/month)
- Total: $55/month (~R990/month)

**50+ users/day** - Migrate to EKS configuration
- Follow the IMS-AWS-DEPLOYMENT.md guide
- Total: $151/month (~R2,718/month)

---

## Final Cost Summary

### Recommended: AWS Lightsail

**Monthly Cost:**
- **Instance**: $10
- **Database**: $15
- **Snapshots**: $1
- **Total**: **$26/month (~R468/month)**

**Annual Cost:**
- **$312 USD/year (~R5,616 ZAR/year)**

**Cost Savings vs Original:**
- **83-86% cheaper** than 50-user configuration
- **$1,500-1,860 saved per year**

### With Scheduled Downtime (Business Hours Only)

**Monthly Cost:**
- **Instance** (10 hours/day): ~$5
- **Database**: $15
- **Total**: **~$20/month (~R360/month)**

**Annual Cost:**
- **$240 USD/year (~R4,320 ZAR/year)**

---

## Quick Decision Guide

| Daily Users | Recommended Solution | Monthly Cost (ZAR) |
|------------|---------------------|-------------------|
| 3-5 users | Lightsail + Scheduled stop | R360 |
| 5-10 users | Lightsail Standard | R468 |
| 10-20 users | Lightsail 4GB | R630 |
| 20-50 users | Lightsail 8GB | R990 |
| 50+ users | EKS Configuration | R2,718 |

---

## Conclusion

For **3-4 users per day**, the **AWS Lightsail solution at ~R468/month ($26/month)** is ideal:

- **83% cheaper** than the 50-user EKS configuration
- **Simple to manage** - no Kubernetes complexity
- **Predictable costs** - no surprise charges
- **Room to grow** - can scale to 20-30 users/day
- **Production-ready** - includes backups, monitoring, SSL

### Total Deployment Cost
- **Setup**: Free (one-time)
- **Monthly**: R468 (~$26)
- **Annual**: R5,616 (~$312)

**Ready to deploy in 30 minutes!**

---

**Last Updated**: 2025-10-15
**Configuration**: Lightsail Minimal
**Target Traffic**: 3-4 users/day
**Monthly Cost**: R468 (~$26 USD)

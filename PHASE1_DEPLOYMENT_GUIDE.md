# PartPal IMS - Phase 1 Test Deployment Guide
## Complete Step-by-Step Guide for First Deployment

**Target**: Deploy IMS application for testing with minimal cost
**Timeline**: 2-3 hours total setup time
**Monthly Cost**: Approximately R468 (~$26 USD)
**Prerequisites**: GitHub account only

---

## Table of Contents

1. [Account Setup Prerequisites](#1-account-setup-prerequisites)
2. [Required Third-Party Services](#2-required-third-party-services)
3. [AWS Infrastructure Setup](#3-aws-infrastructure-setup)
4. [Docker Image Preparation](#4-docker-image-preparation)
5. [Database Configuration](#5-database-configuration)
6. [Application Deployment](#6-application-deployment)
7. [Domain and SSL Setup](#7-domain-and-ssl-setup)
8. [Testing and Verification](#8-testing-and-verification)
9. [Monitoring and Maintenance](#9-monitoring-and-maintenance)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Account Setup Prerequisites

### 1.1 AWS Account Creation (15 minutes)

**Step 1: Create AWS Account**
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Fill in:
   - Email address
   - Password
   - AWS account name (e.g., "PartPal IMS")
4. Choose "Personal" account type
5. Fill in contact information:
   - Full name
   - Phone number
   - Address (South African address)
   - Postal code

**Step 2: Payment Information**
1. Enter credit/debit card details
2. AWS will charge R1-R2 for verification (refunded)
3. Verify the charge on your phone/email

**Step 3: Identity Verification**
1. Choose phone verification
2. Enter your phone number
3. Receive and enter the verification code

**Step 4: Choose Support Plan**
1. Select "Basic Support - Free"
2. Click "Complete sign up"

**Step 5: Sign in to Console**
1. Go to https://console.aws.amazon.com
2. Sign in with root user email and password
3. You should see the AWS Management Console

**IMPORTANT SECURITY STEPS:**
1. Enable MFA (Multi-Factor Authentication):
   - Click your account name (top right)
   - Select "Security credentials"
   - Under "Multi-factor authentication (MFA)", click "Activate MFA"
   - Follow the wizard (use Google Authenticator app)

2. Create IAM User (recommended):
   - Go to IAM service
   - Click "Users" > "Add users"
   - Username: "partpal-admin"
   - Enable "AWS Management Console access"
   - Set password
   - Attach policy: "AdministratorAccess"
   - Complete creation
   - Use this user instead of root account

### 1.2 Cloudinary Account (5 minutes)

Cloudinary handles image uploads and optimization.

**Step 1: Sign Up**
1. Go to https://cloudinary.com
2. Click "Sign Up Free"
3. Fill in:
   - Email
   - Password
   - Cloud name (e.g., "partpal-ims")
4. Verify email address

**Step 2: Get API Credentials**
1. Login to Cloudinary
2. Go to Dashboard
3. Copy these values (you'll need them later):
   - Cloud name: `your_cloud_name`
   - API Key: `123456789012345`
   - API Secret: `abcdefghijklmnopqrstuvwxyz123`

**Free Tier Includes:**
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 transformations/month
- More than enough for phase 1 testing

### 1.3 Email Service - Gmail SMTP (5 minutes)

For sending notification emails.

**Step 1: Create App Password**
1. Go to https://myaccount.google.com
2. Click "Security"
3. Enable "2-Step Verification" if not enabled
4. Go back to Security
5. Click "App passwords"
6. Select:
   - App: "Mail"
   - Device: "Other (Custom name)"
   - Name: "PartPal IMS"
7. Click "Generate"
8. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)
9. Save this password securely

**Alternative**: Use your existing Gmail account or create a dedicated one like `partpal.notifications@gmail.com`

### 1.4 Optional Services (Can skip for Phase 1)

These can be added later:

**Google Analytics** (Website tracking)
- https://analytics.google.com
- Free tier available

**Mapbox** (Location services)
- https://www.mapbox.com
- Free tier: 50,000 map loads/month

**Sentry** (Error tracking)
- https://sentry.io
- Free tier: 5,000 errors/month

---

## 2. Required Third-Party Services

### 2.1 Cost Summary

| Service | Purpose | Monthly Cost | Free Tier |
|---------|---------|--------------|-----------|
| **AWS Lightsail** | Server hosting | $10 | No |
| **AWS Lightsail DB** | PostgreSQL database | $15 | No |
| **Cloudinary** | Image storage | $0 | Yes (25GB) |
| **Gmail SMTP** | Email notifications | $0 | Yes |
| **Domain (Optional)** | Custom domain | R100-200 | No |
| **SSL Certificate** | HTTPS | $0 | Yes (Let's Encrypt) |
| **TOTAL** | | **~R468 ($26)** | |

### 2.2 What You Need to Have Ready

Before proceeding, ensure you have:

- [ ] AWS account with payment method
- [ ] Cloudinary account credentials
- [ ] Gmail app password
- [ ] GitHub repository access
- [ ] Domain name (optional but recommended)
- [ ] Text editor for configuration files

---

## 3. AWS Infrastructure Setup

### 3.1 Install AWS CLI (10 minutes)

**On Ubuntu/Linux:**
```bash
# Download AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# Unzip
unzip awscliv2.zip

# Install
sudo ./aws/install

# Verify installation
aws --version
# Should show: aws-cli/2.x.x Python/3.x.x Linux/x.x.x
```

**On macOS:**
```bash
# Using Homebrew
brew install awscli

# Verify
aws --version
```

**On Windows:**
1. Download from https://aws.amazon.com/cli/
2. Run the installer
3. Open PowerShell and verify: `aws --version`

### 3.2 Configure AWS CLI (5 minutes)

**Step 1: Get AWS Credentials**
1. Login to AWS Console
2. Click your name (top right) > "Security credentials"
3. Under "Access keys", click "Create access key"
4. Choose "Command Line Interface (CLI)"
5. Check "I understand" and click "Next"
6. Add description: "PartPal CLI"
7. Click "Create access key"
8. **IMPORTANT**: Copy both:
   - Access key ID: `AKIAIOSFODNN7EXAMPLE`
   - Secret access key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
9. Download the CSV file as backup

**Step 2: Configure CLI**
```bash
aws configure
```

Enter when prompted:
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: af-south-1
Default output format [None]: json
```

**Step 3: Verify Configuration**
```bash
# Test AWS connection
aws sts get-caller-identity
```

Should return:
```json
{
    "UserId": "AIDAI...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/partpal-admin"
}
```

### 3.3 Create Lightsail Database (10 minutes)

**Step 1: Create Database Instance**
```bash
# Generate a strong password
DB_PASSWORD=$(openssl rand -base64 24)
echo "Database Password: $DB_PASSWORD"
# SAVE THIS PASSWORD - You'll need it later!

# Create PostgreSQL database
aws lightsail create-relational-database \
  --relational-database-name partpal-ims-db \
  --relational-database-bundle-id micro_2_0 \
  --engine postgres \
  --master-database-name partpal_ims \
  --master-username partpal \
  --master-user-password "$DB_PASSWORD" \
  --region af-south-1
```

**Step 2: Wait for Database Creation (3-5 minutes)**
```bash
# Check database status
aws lightsail get-relational-database \
  --relational-database-name partpal-ims-db \
  --region af-south-1 \
  --query 'relationalDatabase.state' \
  --output text
```

Wait until it shows: `available`

**Step 3: Get Database Endpoint**
```bash
# Get database connection details
aws lightsail get-relational-database \
  --relational-database-name partpal-ims-db \
  --region af-south-1 \
  --query 'relationalDatabase.masterEndpoint' \
  --output json
```

Save the endpoint address (e.g., `ls-abc123.czxxxxxx.af-south-1.rds.amazonaws.com`)

**Step 4: Enable Public Access (for initial setup)**
```bash
aws lightsail update-relational-database \
  --relational-database-name partpal-ims-db \
  --publicly-accessible \
  --region af-south-1
```

### 3.4 Create Lightsail Instance (10 minutes)

**Step 1: Create Instance**
```bash
# Create the server instance
aws lightsail create-instances \
  --instance-names partpal-ims \
  --availability-zone af-south-1a \
  --blueprint-id ubuntu_22_04 \
  --bundle-id medium_2_0 \
  --region af-south-1
```

**Step 2: Create and Attach Static IP**
```bash
# Allocate static IP
aws lightsail allocate-static-ip \
  --static-ip-name partpal-ims-ip \
  --region af-south-1

# Wait 30 seconds for instance to be ready
sleep 30

# Attach static IP to instance
aws lightsail attach-static-ip \
  --static-ip-name partpal-ims-ip \
  --instance-name partpal-ims \
  --region af-south-1
```

**Step 3: Get Your Static IP Address**
```bash
# Get the IP address
INSTANCE_IP=$(aws lightsail get-static-ip \
  --static-ip-name partpal-ims-ip \
  --region af-south-1 \
  --query 'staticIp.ipAddress' \
  --output text)

echo "Your server IP address: $INSTANCE_IP"
# Save this IP address!
```

**Step 4: Open Required Ports**
```bash
# Open HTTP (port 80)
aws lightsail open-instance-public-ports \
  --instance-name partpal-ims \
  --port-info fromPort=80,toPort=80,protocol=TCP \
  --region af-south-1

# Open HTTPS (port 443)
aws lightsail open-instance-public-ports \
  --instance-name partpal-ims \
  --port-info fromPort=443,toPort=443,protocol=TCP \
  --region af-south-1

# Open SSH (port 22) - already open by default
```

### 3.5 Connect to Your Instance (5 minutes)

**Step 1: Download SSH Key**
```bash
# Create directory for SSH keys
mkdir -p ~/.ssh

# Download the default key
aws lightsail download-default-key-pair \
  --region af-south-1 \
  --output text \
  --query 'privateKeyBase64' | base64 --decode > ~/.ssh/lightsail-key.pem

# Set correct permissions
chmod 600 ~/.ssh/lightsail-key.pem
```

**Step 2: SSH into Instance**
```bash
# Connect to your instance
ssh -i ~/.ssh/lightsail-key.pem ubuntu@$INSTANCE_IP
```

You should see:
```
Welcome to Ubuntu 22.04.x LTS
...
ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

---

## 4. Docker Image Preparation

### 4.1 Setup Docker on Lightsail Instance (10 minutes)

**Run these commands on your Lightsail instance (after SSH):

**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
```

**SSH back in:**
```bash
ssh -i ~/.ssh/lightsail-key.pem ubuntu@$INSTANCE_IP
```

### 4.2 Clone Your Repository (5 minutes)

```bash
# Install git if not already installed
sudo apt install -y git

# Clone your IMS repository
cd ~
git clone https://github.com/PartPalCarInventory/PartPalMonorepo.git partpal-ims
cd partpal-ims

# Verify you have the files
ls -la
# Should see: apps/, packages/, services/, etc.
```

### 4.3 Build Docker Images (15 minutes)

**Create Production Dockerfiles:**

**File 1: `apps/ims/Dockerfile.prod`**
```bash
cat > apps/ims/Dockerfile.prod <<'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ims/package.json ./apps/ims/
COPY packages ./packages

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/ims ./apps/ims
COPY tsconfig.json ./
COPY turbo.json ./

# Build the application
RUN pnpm --filter @partpal/ims build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy built application
COPY --from=builder /app/apps/ims/.next ./apps/ims/.next
COPY --from=builder /app/apps/ims/public ./apps/ims/public
COPY --from=builder /app/apps/ims/package.json ./apps/ims/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3001

CMD ["pnpm", "--filter", "@partpal/ims", "start"]
EOF
```

**File 2: `services/api/Dockerfile.prod`**
```bash
cat > services/api/Dockerfile.prod <<'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/api/package.json ./services/api/
COPY packages ./packages

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY services/api ./services/api
COPY tsconfig.json ./
COPY turbo.json ./

# Build the application
RUN pnpm --filter @partpal/api build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy built application
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/package.json ./services/api/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter @partpal/database prisma generate

EXPOSE 3333

CMD ["pnpm", "--filter", "@partpal/api", "start"]
EOF
```

**Build the images:**
```bash
# Build API image
docker build -f services/api/Dockerfile.prod -t partpal-api:latest .

# Build IMS image
docker build -f apps/ims/Dockerfile.prod -t partpal-ims:latest .

# Verify images
docker images | grep partpal
```

---

## 5. Database Configuration

### 5.1 Create Environment File (10 minutes)

```bash
# Navigate to your application directory
cd ~/partpal-ims

# Create .env.production file
cat > .env.production <<EOF
# Environment
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://partpal:${DB_PASSWORD}@${DB_ENDPOINT}:5432/partpal_ims

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# API Configuration
API_PORT=3333
API_HOST=0.0.0.0

# Application URLs (Update with your domain later)
NEXT_PUBLIC_API_URL=http://${INSTANCE_IP}:3333
NEXT_PUBLIC_IMS_URL=http://${INSTANCE_IP}:3001

# Cloudinary Configuration (Replace with your values)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (Replace with your Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL=noreply@partpal.co.za

# Security
CORS_ORIGIN=http://${INSTANCE_IP}:3001,http://${INSTANCE_IP}:3000
SECURE_COOKIES=false
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_AUTH_POINTS=5
RATE_LIMIT_AUTH_DURATION=900
RATE_LIMIT_GENERAL_POINTS=100
RATE_LIMIT_GENERAL_DURATION=900

# Logging
LOG_LEVEL=info

# Feature Flags
FEATURE_ADVANCED_SEARCH=true
FEATURE_MAP_INTEGRATION=false
FEATURE_PUSH_NOTIFICATIONS=true
EOF
```

**IMPORTANT: Edit the .env.production file and replace:**
1. `your_cloudinary_cloud_name` - Your Cloudinary cloud name
2. `your_cloudinary_api_key` - Your Cloudinary API key
3. `your_cloudinary_api_secret` - Your Cloudinary API secret
4. `your_email@gmail.com` - Your Gmail address
5. `your_gmail_app_password` - Your Gmail app password (16 characters, no spaces)

```bash
# Edit the file
nano .env.production
# Press Ctrl+X, then Y, then Enter to save
```

### 5.2 Run Database Migrations (5 minutes)

```bash
# Create a temporary container to run migrations
docker run --rm \
  --env-file .env.production \
  -v $(pwd)/packages/database:/app/packages/database \
  partpal-api:latest \
  sh -c "cd /app/packages/database && pnpx prisma migrate deploy"
```

---

## 6. Application Deployment

### 6.1 Create Docker Compose File (10 minutes)

```bash
cat > docker-compose.production.yml <<'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - partpal
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  api:
    image: partpal-api:latest
    restart: always
    ports:
      - "3333:3333"
    env_file:
      - .env.production
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - partpal
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  ims:
    image: partpal-ims:latest
    restart: always
    ports:
      - "3001:3001"
    env_file:
      - .env.production
    depends_on:
      api:
        condition: service_healthy
    networks:
      - partpal
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

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

### 6.2 Create Nginx Configuration (5 minutes)

```bash
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

    # HTTP Server - Redirect to HTTPS (will be configured later)
    server {
        listen 80 default_server;
        server_name _;

        location / {
            proxy_pass http://ims;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            proxy_pass http://api/health;
            proxy_set_header Host $host;
        }
    }
}
EOF
```

### 6.3 Deploy the Application (5 minutes)

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs --tail=50
```

Expected output:
```
NAME                STATUS              PORTS
partpal-ims-api-1   Up X seconds (healthy)   0.0.0.0:3333->3333/tcp
partpal-ims-ims-1   Up X seconds (healthy)   0.0.0.0:3001->3001/tcp
partpal-ims-redis-1 Up X seconds (healthy)   6379/tcp
partpal-ims-nginx-1 Up X seconds             0.0.0.0:80->80/tcp
```

### 6.4 Verify Deployment (5 minutes)

```bash
# Test API health endpoint
curl http://localhost:3333/health

# Expected response:
# {"status":"OK","timestamp":"...","database":"connected"}

# Test IMS application
curl http://localhost:3001

# Should return HTML content

# Test from external browser
echo "Access your application at: http://$INSTANCE_IP"
```

Open your browser and go to: `http://YOUR_INSTANCE_IP`

You should see the PartPal IMS login page!

---

## 7. Domain and SSL Setup

### 7.1 Configure Domain (Optional but Recommended)

**If you have a domain (e.g., partpal.co.za):**

1. **Add DNS Records** (in your domain registrar):
   ```
   Type: A
   Name: ims
   Value: YOUR_INSTANCE_IP
   TTL: 3600

   Type: A
   Name: api
   Value: YOUR_INSTANCE_IP
   TTL: 3600
   ```

2. **Wait for DNS propagation** (5-30 minutes):
   ```bash
   # Check DNS propagation
   nslookup ims.partpal.co.za
   nslookup api.partpal.co.za
   ```

### 7.2 Install SSL Certificate (10 minutes)

**After DNS is configured:**

```bash
# Install certbot
sudo apt install -y certbot

# Stop nginx temporarily
docker-compose -f docker-compose.production.yml stop nginx

# Get SSL certificate
sudo certbot certonly --standalone \
  -d ims.partpal.co.za \
  -d api.partpal.co.za \
  --email your-email@gmail.com \
  --agree-tos \
  --non-interactive

# Create SSL directory
mkdir -p ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/ims.partpal.co.za/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/ims.partpal.co.za/privkey.pem ssl/
sudo chown -R ubuntu:ubuntu ssl/

# Update nginx configuration for HTTPS
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

    # IMS Frontend - HTTPS
    server {
        listen 443 ssl;
        server_name ims.partpal.co.za;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://ims;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # API Backend - HTTPS
    server {
        listen 443 ssl;
        server_name api.partpal.co.za;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Restart nginx
docker-compose -f docker-compose.production.yml start nginx

# Setup auto-renewal
(crontab -l 2>/dev/null; echo "0 0 1 * * sudo certbot renew --quiet && sudo cp /etc/letsencrypt/live/ims.partpal.co.za/*.pem ~/partpal-ims/ssl/ && cd ~/partpal-ims && docker-compose -f docker-compose.production.yml restart nginx") | crontab -
```

**Update .env.production with your domain:**
```bash
nano .env.production
```

Change these lines:
```
NEXT_PUBLIC_API_URL=https://api.partpal.co.za
NEXT_PUBLIC_IMS_URL=https://ims.partpal.co.za
CORS_ORIGIN=https://ims.partpal.co.za
SECURE_COOKIES=true
```

**Restart services:**
```bash
docker-compose -f docker-compose.production.yml restart
```

---

## 8. Testing and Verification

### 8.1 Automated Health Checks (5 minutes)

Create a health check script:

```bash
cat > health-check.sh <<'EOF'
#!/bin/bash

echo "=== PartPal IMS Health Check ==="
echo ""

# Check API
echo "1. Checking API Health..."
API_RESPONSE=$(curl -s http://localhost:3333/health)
if echo $API_RESPONSE | grep -q "OK"; then
    echo "   ✓ API is healthy"
else
    echo "   ✗ API is not responding"
fi

# Check IMS
echo "2. Checking IMS Application..."
IMS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$IMS_RESPONSE" == "200" ]; then
    echo "   ✓ IMS is responding"
else
    echo "   ✗ IMS is not responding (HTTP $IMS_RESPONSE)"
fi

# Check Redis
echo "3. Checking Redis..."
REDIS_RESPONSE=$(docker exec partpal-ims-redis-1 redis-cli ping 2>/dev/null)
if [ "$REDIS_RESPONSE" == "PONG" ]; then
    echo "   ✓ Redis is running"
else
    echo "   ✗ Redis is not responding"
fi

# Check Database
echo "4. Checking Database Connection..."
DB_CHECK=$(docker exec partpal-ims-api-1 sh -c "wget -q -O- http://localhost:3333/health" 2>/dev/null | grep -o '"database":"connected"')
if [ ! -z "$DB_CHECK" ]; then
    echo "   ✓ Database is connected"
else
    echo "   ✗ Database is not connected"
fi

# Check Docker containers
echo "5. Checking Docker Containers..."
RUNNING=$(docker-compose -f docker-compose.production.yml ps | grep -c "Up")
echo "   $RUNNING containers running"

echo ""
echo "=== Health Check Complete ==="
EOF

chmod +x health-check.sh

# Run health check
./health-check.sh
```

### 8.2 Manual Testing Checklist

**API Tests:**
```bash
# Health check
curl http://localhost:3333/health

# Create a test user (signup)
curl -X POST http://localhost:3333/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@partpal.co.za",
    "password": "TestPassword123!",
    "name": "Test User",
    "role": "seller"
  }'

# Login
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@partpal.co.za",
    "password": "TestPassword123!"
  }'
```

**Browser Tests:**
1. Open `http://YOUR_INSTANCE_IP` (or your domain)
2. You should see the IMS login page
3. Try to create an account
4. Login with your credentials
5. Navigate through the dashboard
6. Test adding a vehicle
7. Test adding a part
8. Test the reports section

### 8.3 Performance Testing

```bash
# Install Apache Bench for load testing
sudo apt install -y apache2-utils

# Test API with 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3333/health

# Test IMS homepage
ab -n 50 -c 5 http://localhost:3001/
```

---

## 9. Monitoring and Maintenance

### 9.1 View Logs

```bash
# View all logs
docker-compose -f docker-compose.production.yml logs -f

# View specific service logs
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f ims
docker-compose -f docker-compose.production.yml logs -f redis

# View last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100

# Save logs to file
docker-compose -f docker-compose.production.yml logs > logs-$(date +%Y%m%d).txt
```

### 9.2 Monitoring Scripts

**Create monitoring script:**
```bash
cat > monitor.sh <<'EOF'
#!/bin/bash

# CPU and Memory usage
echo "=== Resource Usage ==="
docker stats --no-stream

# Disk usage
echo ""
echo "=== Disk Usage ==="
df -h | grep -E "Filesystem|/$"

# Database size
echo ""
echo "=== Database Size ==="
aws lightsail get-relational-database \
  --relational-database-name partpal-ims-db \
  --region af-south-1 \
  --query 'relationalDatabase.hardware.diskSizeInGb'
EOF

chmod +x monitor.sh
```

**Create cleanup script:**
```bash
cat > cleanup.sh <<'EOF'
#!/bin/bash

echo "Cleaning up Docker resources..."

# Remove old containers
docker container prune -f

# Remove old images
docker image prune -a -f

# Remove old volumes
docker volume prune -f

# Remove old logs (older than 7 days)
find /var/lib/docker/containers -name "*.log" -mtime +7 -delete

echo "Cleanup complete!"
df -h | grep -E "Filesystem|/$"
EOF

chmod +x cleanup.sh
```

**Schedule regular cleanup (run monthly):**
```bash
(crontab -l 2>/dev/null; echo "0 2 1 * * ~/partpal-ims/cleanup.sh >> ~/cleanup.log 2>&1") | crontab -
```

### 9.3 Backup Strategy

**Database Backup:**
```bash
# Create backup script
cat > backup-db.sh <<'EOF'
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR

# Create database snapshot
aws lightsail create-relational-database-snapshot \
  --relational-database-name partpal-ims-db \
  --relational-database-snapshot-name partpal-ims-backup-$DATE \
  --region af-south-1

echo "Database backup created: partpal-ims-backup-$DATE"

# Clean old snapshots (keep last 7)
aws lightsail get-relational-database-snapshots \
  --region af-south-1 \
  --query 'relationalDatabaseSnapshots[?contains(relationalDatabaseSnapshotName, `partpal-ims-backup`)].relationalDatabaseSnapshotName' \
  --output text | tr '\t' '\n' | sort -r | tail -n +8 | while read snapshot; do
    echo "Deleting old snapshot: $snapshot"
    aws lightsail delete-relational-database-snapshot \
      --relational-database-snapshot-name $snapshot \
      --region af-south-1
done
EOF

chmod +x backup-db.sh

# Schedule daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * ~/partpal-ims/backup-db.sh >> ~/backup.log 2>&1") | crontab -
```

### 9.4 Update Procedure

**When you need to update the application:**

```bash
cd ~/partpal-ims

# Pull latest code
git pull origin main

# Rebuild images
docker build -f services/api/Dockerfile.prod -t partpal-api:latest .
docker build -f apps/ims/Dockerfile.prod -t partpal-ims:latest .

# Run migrations if needed
docker run --rm \
  --env-file .env.production \
  -v $(pwd)/packages/database:/app/packages/database \
  partpal-api:latest \
  sh -c "cd /app/packages/database && pnpx prisma migrate deploy"

# Restart services with new images
docker-compose -f docker-compose.production.yml up -d --force-recreate

# Verify update
./health-check.sh
```

---

## 10. Troubleshooting

### 10.1 Common Issues

**Issue 1: Application not accessible**

```bash
# Check if containers are running
docker-compose -f docker-compose.production.yml ps

# Check if ports are open
sudo netstat -tulpn | grep -E '80|443|3001|3333'

# Check Lightsail firewall
aws lightsail get-instance-port-states \
  --instance-name partpal-ims \
  --region af-south-1

# Check nginx logs
docker-compose -f docker-compose.production.yml logs nginx
```

**Issue 2: Database connection failed**

```bash
# Test database connectivity
telnet $DB_ENDPOINT 5432

# Check database status
aws lightsail get-relational-database \
  --relational-database-name partpal-ims-db \
  --region af-south-1 \
  --query 'relationalDatabase.state'

# Check API logs for database errors
docker-compose -f docker-compose.production.yml logs api | grep -i database
```

**Issue 3: Out of memory**

```bash
# Check memory usage
free -h

# Check Docker memory
docker stats --no-stream

# Restart containers to free memory
docker-compose -f docker-compose.production.yml restart

# If persistent, upgrade Lightsail instance:
# AWS Console > Lightsail > Instances > partpal-ims > Upgrade
```

**Issue 4: SSL certificate expired**

```bash
# Renew certificate manually
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/ims.partpal.co.za/*.pem ~/partpal-ims/ssl/
sudo chown -R ubuntu:ubuntu ~/partpal-ims/ssl/

# Restart nginx
docker-compose -f docker-compose.production.yml restart nginx
```

**Issue 5: High disk usage**

```bash
# Check disk usage
df -h

# Clean Docker resources
./cleanup.sh

# If still high, delete old logs
find ~/partpal-ims -name "*.log" -mtime +30 -delete

# Clean system packages
sudo apt autoremove -y
sudo apt clean
```

### 10.2 Getting Help

**Check logs:**
```bash
# All service logs
docker-compose -f docker-compose.production.yml logs --tail=200

# Save logs for support
docker-compose -f docker-compose.production.yml logs > debug-logs-$(date +%Y%m%d).txt
```

**Service status:**
```bash
./health-check.sh
./monitor.sh
```

**AWS Status:**
```bash
# Instance status
aws lightsail get-instance \
  --instance-name partpal-ims \
  --region af-south-1 \
  --query 'instance.state'

# Database status
aws lightsail get-relational-database \
  --relational-database-name partpal-ims-db \
  --region af-south-1 \
  --query 'relationalDatabase.state'
```

---

## Summary Checklist

Before going live, ensure:

- [ ] AWS account created and configured
- [ ] Lightsail database created and accessible
- [ ] Lightsail instance created with static IP
- [ ] Docker and Docker Compose installed
- [ ] Application code cloned and images built
- [ ] Environment variables configured correctly
- [ ] Cloudinary credentials added
- [ ] Email SMTP configured
- [ ] Database migrations completed
- [ ] All services running and healthy
- [ ] Health check script passes
- [ ] Domain configured (if applicable)
- [ ] SSL certificate installed (if domain configured)
- [ ] Application accessible in browser
- [ ] User registration works
- [ ] User login works
- [ ] Basic functionality tested
- [ ] Backup script configured
- [ ] Monitoring scripts created
- [ ] Logs are being captured

---

## Cost Tracking

Keep track of your monthly costs:

```bash
# Check Lightsail costs
aws lightsail get-instances \
  --region af-south-1 \
  --query 'instances[*].[name,bundleId]'

aws lightsail get-relational-databases \
  --region af-south-1 \
  --query 'relationalDatabases[*].[name,relationalDatabaseBundleId]'
```

**Expected Monthly Costs:**
- Lightsail Instance (2GB): $10
- Lightsail Database (1GB): $15
- Snapshots (approx): $1-2
- Data transfer: $0-1
- **Total: ~$26-28 USD (~R468-504 ZAR)**

---

## Next Steps

After successful Phase 1 deployment:

1. **Monitor for 1-2 weeks**
   - Check daily health status
   - Monitor resource usage
   - Review logs for errors

2. **Gather feedback**
   - Test with real users
   - Document any issues
   - Collect performance metrics

3. **Optimize**
   - Tune database queries
   - Optimize image loading
   - Add caching where needed

4. **Plan Phase 2**
   - Add monitoring tools (Sentry, Analytics)
   - Implement automated testing
   - Setup CI/CD pipeline
   - Consider adding Marketplace application

---

**Congratulations! You have successfully deployed PartPal IMS for Phase 1 testing!**

For support, refer to the troubleshooting section or check the logs for specific error messages.

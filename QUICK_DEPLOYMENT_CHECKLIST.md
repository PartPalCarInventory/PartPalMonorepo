# PartPal IMS - Quick Deployment Checklist

This is a condensed checklist for deploying PartPal IMS Phase 1. For detailed instructions, see [PHASE1_DEPLOYMENT_GUIDE.md](./PHASE1_DEPLOYMENT_GUIDE.md).

## Pre-Deployment (30 minutes)

### Accounts to Create

- [ ] **AWS Account** - https://aws.amazon.com
  - Add payment method
  - Enable MFA
  - Create IAM user
  - Note: Access Key ID and Secret Access Key

- [ ] **Cloudinary Account** - https://cloudinary.com (Free tier)
  - Note: Cloud Name
  - Note: API Key
  - Note: API Secret

- [ ] **Gmail App Password** - https://myaccount.google.com
  - Enable 2-Step Verification
  - Create App Password
  - Note: 16-character app password

### Information to Prepare

- [ ] AWS Access Key ID: `________________`
- [ ] AWS Secret Access Key: `________________`
- [ ] Cloudinary Cloud Name: `________________`
- [ ] Cloudinary API Key: `________________`
- [ ] Cloudinary API Secret: `________________`
- [ ] Gmail Address: `________________`
- [ ] Gmail App Password: `________________`
- [ ] Domain Name (optional): `________________`

---

## Deployment Steps (90 minutes)

### 1. Local Setup (10 min)

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Configure AWS
aws configure
# Enter: Access Key, Secret Key, Region: af-south-1, Format: json
```

- [ ] AWS CLI installed
- [ ] AWS credentials configured
- [ ] Can run: `aws sts get-caller-identity`

### 2. Create AWS Resources (20 min)

```bash
# Create database (save the password!)
DB_PASSWORD=$(openssl rand -base64 24)
echo "Save this: $DB_PASSWORD"

aws lightsail create-relational-database \
  --relational-database-name partpal-ims-db \
  --relational-database-bundle-id micro_2_0 \
  --engine postgres \
  --master-database-name partpal_ims \
  --master-username partpal \
  --master-user-password "$DB_PASSWORD" \
  --region af-south-1

# Create server instance
aws lightsail create-instances \
  --instance-names partpal-ims \
  --availability-zone af-south-1a \
  --blueprint-id ubuntu_22_04 \
  --bundle-id medium_2_0 \
  --region af-south-1

# Create and attach static IP
aws lightsail allocate-static-ip \
  --static-ip-name partpal-ims-ip \
  --region af-south-1

sleep 30

aws lightsail attach-static-ip \
  --static-ip-name partpal-ims-ip \
  --instance-name partpal-ims \
  --region af-south-1

# Get your IP
INSTANCE_IP=$(aws lightsail get-static-ip \
  --static-ip-name partpal-ims-ip \
  --region af-south-1 \
  --query 'staticIp.ipAddress' \
  --output text)

echo "Your server IP: $INSTANCE_IP"

# Open ports
aws lightsail open-instance-public-ports \
  --instance-name partpal-ims \
  --port-info fromPort=80,toPort=80,protocol=TCP \
  --region af-south-1

aws lightsail open-instance-public-ports \
  --instance-name partpal-ims \
  --port-info fromPort=443,toPort=443,protocol=TCP \
  --region af-south-1
```

- [ ] Database created (status: available)
- [ ] Instance created
- [ ] Static IP attached
- [ ] Ports 80, 443 open
- [ ] Database password saved
- [ ] Database endpoint saved
- [ ] Instance IP saved

### 3. Connect to Server (5 min)

```bash
# Download SSH key
mkdir -p ~/.ssh
aws lightsail download-default-key-pair \
  --region af-south-1 \
  --output text \
  --query 'privateKeyBase64' | base64 --decode > ~/.ssh/lightsail-key.pem

chmod 600 ~/.ssh/lightsail-key.pem

# Connect
ssh -i ~/.ssh/lightsail-key.pem ubuntu@$INSTANCE_IP
```

- [ ] SSH key downloaded
- [ ] Successfully connected to instance

### 4. Install Docker (10 min)

Run on the Lightsail instance:

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

# Log out and back in
exit
```

```bash
# SSH back in
ssh -i ~/.ssh/lightsail-key.pem ubuntu@$INSTANCE_IP

# Verify
docker --version
docker-compose --version
```

- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Can run docker without sudo

### 5. Clone and Build (20 min)

```bash
# Install git
sudo apt install -y git

# Clone repository
git clone https://github.com/PartPalCarInventory/PartPalMonorepo.git partpal-ims
cd partpal-ims

# Create production Dockerfiles (see PHASE1_DEPLOYMENT_GUIDE.md section 4.3)
# Or download from your repository if you've added them

# Build images
docker build -f services/api/Dockerfile.prod -t partpal-api:latest .
docker build -f apps/ims/Dockerfile.prod -t partpal-ims:latest .

# Verify
docker images | grep partpal
```

- [ ] Repository cloned
- [ ] API Docker image built
- [ ] IMS Docker image built

### 6. Configure Environment (10 min)

```bash
cd ~/partpal-ims

# Get database endpoint
DB_ENDPOINT=$(aws lightsail get-relational-database \
  --relational-database-name partpal-ims-db \
  --region af-south-1 \
  --query 'relationalDatabase.masterEndpoint.address' \
  --output text)

# Create .env.production file
# See PHASE1_DEPLOYMENT_GUIDE.md section 5.1 for full template

nano .env.production
```

**Replace these values in .env.production:**
- DATABASE_URL with actual database endpoint and password
- CLOUDINARY_* with your Cloudinary credentials
- SMTP_USER with your Gmail
- SMTP_PASS with your Gmail app password
- INSTANCE_IP with your server IP

- [ ] .env.production created
- [ ] All credentials filled in
- [ ] Database URL correct
- [ ] Cloudinary configured
- [ ] Email configured

### 7. Run Migrations (5 min)

```bash
docker run --rm \
  --env-file .env.production \
  -v $(pwd)/packages/database:/app/packages/database \
  partpal-api:latest \
  sh -c "cd /app/packages/database && pnpx prisma migrate deploy"
```

- [ ] Migrations completed successfully
- [ ] No errors in output

### 8. Deploy Application (10 min)

```bash
# Create docker-compose.production.yml
# See PHASE1_DEPLOYMENT_GUIDE.md section 6.1

# Create nginx.conf
# See PHASE1_DEPLOYMENT_GUIDE.md section 6.2

# Start services
docker-compose -f docker-compose.production.yml up -d

# Wait for startup
sleep 30

# Check status
docker-compose -f docker-compose.production.yml ps

# Should see all services as "Up" and "healthy"
```

- [ ] docker-compose.production.yml created
- [ ] nginx.conf created
- [ ] All services started
- [ ] All services healthy

### 9. Test Deployment (10 min)

```bash
# Create health check script
# See PHASE1_DEPLOYMENT_GUIDE.md section 8.1

chmod +x health-check.sh
./health-check.sh
```

**Browser Test:**
1. Open: `http://YOUR_INSTANCE_IP`
2. See IMS login page
3. Create test account
4. Login successfully

- [ ] Health check passes
- [ ] Can access via browser
- [ ] Can create account
- [ ] Can login

---

## Post-Deployment (Optional)

### 10. Configure Domain (if you have one)

1. Add DNS A records:
   - `ims.yourdomain.com` → Your Instance IP
   - `api.yourdomain.com` → Your Instance IP

2. Wait for DNS propagation (5-30 min)

3. Install SSL certificate:
```bash
sudo apt install -y certbot
docker-compose -f docker-compose.production.yml stop nginx

sudo certbot certonly --standalone \
  -d ims.yourdomain.com \
  -d api.yourdomain.com \
  --email your-email@gmail.com \
  --agree-tos \
  --non-interactive

mkdir -p ssl
sudo cp /etc/letsencrypt/live/ims.yourdomain.com/*.pem ssl/
sudo chown -R ubuntu:ubuntu ssl/

# Update nginx.conf for HTTPS (see PHASE1_DEPLOYMENT_GUIDE.md section 7.2)
# Update .env.production URLs

docker-compose -f docker-compose.production.yml start nginx
```

- [ ] DNS configured
- [ ] SSL certificate installed
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS

### 11. Setup Monitoring

```bash
# Create monitoring scripts
# See PHASE1_DEPLOYMENT_GUIDE.md section 9.2-9.3

# Schedule backups
(crontab -l 2>/dev/null; echo "0 2 * * * ~/partpal-ims/backup-db.sh >> ~/backup.log 2>&1") | crontab -

# Schedule cleanup
(crontab -l 2>/dev/null; echo "0 2 1 * * ~/partpal-ims/cleanup.sh >> ~/cleanup.log 2>&1") | crontab -
```

- [ ] Health check script created
- [ ] Monitor script created
- [ ] Backup script created and scheduled
- [ ] Cleanup script created and scheduled

---

## Quick Commands Reference

### Check Status
```bash
cd ~/partpal-ims
docker-compose -f docker-compose.production.yml ps
./health-check.sh
```

### View Logs
```bash
docker-compose -f docker-compose.production.yml logs -f
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f ims
```

### Restart Services
```bash
docker-compose -f docker-compose.production.yml restart
docker-compose -f docker-compose.production.yml restart api
docker-compose -f docker-compose.production.yml restart ims
```

### Update Application
```bash
cd ~/partpal-ims
git pull
docker build -f services/api/Dockerfile.prod -t partpal-api:latest .
docker build -f apps/ims/Dockerfile.prod -t partpal-ims:latest .
docker-compose -f docker-compose.production.yml up -d --force-recreate
```

---

## Cost Tracking

**Monthly Costs (Estimated):**
- Lightsail Instance: $10
- Lightsail Database: $15
- Snapshots: $1-2
- **Total: ~$26-28 USD (~R468-504 ZAR)**

**Check current costs:**
```bash
# In AWS Console:
# Lightsail → Billing → Month-to-date usage
```

---

## Support Resources

- **Detailed Guide**: [PHASE1_DEPLOYMENT_GUIDE.md](./PHASE1_DEPLOYMENT_GUIDE.md)
- **AWS Lightsail Docs**: https://lightsail.aws.amazon.com/ls/docs
- **Docker Docs**: https://docs.docker.com
- **Prisma Docs**: https://www.prisma.io/docs

---

## Troubleshooting Quick Fixes

**Can't access application:**
```bash
# Check services
docker-compose -f docker-compose.production.yml ps

# Check logs
docker-compose -f docker-compose.production.yml logs --tail=50

# Restart all
docker-compose -f docker-compose.production.yml restart
```

**Database connection error:**
```bash
# Check database status
aws lightsail get-relational-database \
  --relational-database-name partpal-ims-db \
  --region af-south-1 \
  --query 'relationalDatabase.state'

# Verify environment file
cat .env.production | grep DATABASE_URL
```

**Out of memory:**
```bash
free -h
docker stats --no-stream
docker-compose -f docker-compose.production.yml restart
```

---

## Success Criteria

Your deployment is successful when:

- [ ] All health checks pass
- [ ] Application accessible via browser
- [ ] Can create user accounts
- [ ] Can login and access dashboard
- [ ] Can add vehicles and parts
- [ ] Images upload successfully
- [ ] Email notifications work (if configured)
- [ ] No errors in logs
- [ ] All Docker containers healthy
- [ ] Database connection stable

---

**Estimated Total Time: 2-3 hours**

**Monthly Cost: ~R468 ($26 USD)**

For detailed step-by-step instructions, always refer to the full [PHASE1_DEPLOYMENT_GUIDE.md](./PHASE1_DEPLOYMENT_GUIDE.md).

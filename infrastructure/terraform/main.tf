terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    bucket         = "partpal-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "af-south-1"
    encrypt        = true
    dynamodb_table = "partpal-terraform-locks"
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "PartPal"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "PartPal-DevOps"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  cluster_name = "partpal-${var.environment}"

  common_tags = {
    Project     = "PartPal"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  # Network configuration
  vpc_cidr = var.vpc_cidr
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)

  private_subnets = [
    cidrsubnet(local.vpc_cidr, 8, 1),
    cidrsubnet(local.vpc_cidr, 8, 2),
    cidrsubnet(local.vpc_cidr, 8, 3),
  ]

  public_subnets = [
    cidrsubnet(local.vpc_cidr, 8, 101),
    cidrsubnet(local.vpc_cidr, 8, 102),
    cidrsubnet(local.vpc_cidr, 8, 103),
  ]

  database_subnets = [
    cidrsubnet(local.vpc_cidr, 8, 201),
    cidrsubnet(local.vpc_cidr, 8, 202),
    cidrsubnet(local.vpc_cidr, 8, 203),
  ]
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name = local.cluster_name
  cidr = local.vpc_cidr

  azs              = local.azs
  private_subnets  = local.private_subnets
  public_subnets   = local.public_subnets
  database_subnets = local.database_subnets

  enable_nat_gateway   = true
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Kubernetes specific tags
  public_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = "1"
  }

  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"

  cluster_name    = local.cluster_name
  cluster_version = var.kubernetes_version

  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  # Node groups configuration
  node_groups = var.node_groups

  # Cluster endpoint configuration
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs

  # Cluster addons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  tags = local.common_tags
}

# RDS Database
module "database" {
  source = "./modules/rds"

  identifier     = "${local.cluster_name}-postgres"
  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [module.security_groups.database_security_group_id]
  db_subnet_group_name   = module.vpc.database_subnet_group

  backup_retention_period = var.db_backup_retention_period
  backup_window          = var.db_backup_window
  maintenance_window     = var.db_maintenance_window

  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  monitoring_role_arn            = aws_iam_role.rds_enhanced_monitoring.arn

  deletion_protection = var.environment == "production" ? true : false
  skip_final_snapshot = var.environment == "production" ? false : true

  tags = local.common_tags
}

# ElastiCache Redis
module "redis" {
  source = "./modules/elasticache"

  cluster_id           = "${local.cluster_name}-redis"
  node_type           = var.redis_node_type
  num_cache_nodes     = var.redis_num_cache_nodes
  port                = 6379

  subnet_ids          = module.vpc.database_subnets
  security_group_ids  = [module.security_groups.redis_security_group_id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  multi_az_enabled        = var.environment == "production" ? true : false

  tags = local.common_tags
}

# ECR Container Registries
module "ecr" {
  source = "./modules/ecr"

  cluster_name = local.cluster_name

  repository_names = [
    "${local.cluster_name}-api",
    "${local.cluster_name}-ims"
  ]

  image_tag_mutability = var.environment == "production" ? "IMMUTABLE" : "MUTABLE"
  scan_on_push        = true

  max_image_count        = 30
  untagged_image_days    = 7
  production_image_days  = 90

  create_github_actions_user = var.environment == "production" ? true : false

  tags = local.common_tags
}

# Security Groups
module "security_groups" {
  source = "./modules/security-groups"

  name_prefix = local.cluster_name
  vpc_id      = module.vpc.vpc_id
  vpc_cidr    = module.vpc.vpc_cidr_block

  tags = local.common_tags
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  name               = "${local.cluster_name}-alb"
  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets

  security_group_ids = [module.security_groups.alb_security_group_id]

  target_groups = var.alb_target_groups

  https_listeners = [
    {
      port               = 443
      protocol           = "HTTPS"
      certificate_arn    = module.acm.certificate_arn
      target_group_index = 0
    }
  ]

  http_tcp_listeners = [
    {
      port        = 80
      protocol    = "HTTP"
      action_type = "redirect"
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  ]

  tags = local.common_tags
}

# ACM Certificate
module "acm" {
  source = "./modules/acm"

  domain_name               = var.domain_name
  subject_alternative_names = var.subject_alternative_names
  zone_id                  = data.aws_route53_zone.main.zone_id

  tags = local.common_tags
}

# Route53 DNS
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# S3 Buckets for static assets and backups
module "s3" {
  source = "./modules/s3"

  bucket_names = [
    "${local.cluster_name}-static-assets",
    "${local.cluster_name}-backups",
    "${local.cluster_name}-logs"
  ]

  environment = var.environment

  tags = local.common_tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/eks/${local.cluster_name}/application"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "cluster_logs" {
  name              = "/aws/eks/${local.cluster_name}/cluster"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name_prefix = "${local.cluster_name}-rds-monitoring-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
# General Configuration
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "af-south-1"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either staging or production."
  }
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "partpal.co.za"
}

variable "subject_alternative_names" {
  description = "Additional domain names for SSL certificate"
  type        = list(string)
  default = [
    "*.partpal.co.za",
    "api.partpal.co.za",
    "ims.partpal.co.za"
  ]
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# EKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "List of CIDR blocks that can access the EKS cluster endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "node_groups" {
  description = "EKS node groups configuration"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    min_size      = number
    max_size      = number
    desired_size  = number
    disk_size     = number
    ami_type      = string
    labels        = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  default = {
    # Optimized for 50 concurrent users
    general = {
      instance_types = ["t3.small"]  # Reduced from t3.medium for cost efficiency
      capacity_type  = "ON_DEMAND"
      min_size      = 1              # Reduced minimum
      max_size      = 4              # Reduced maximum (sufficient for 50 users)
      desired_size  = 2              # 2 nodes for HA
      disk_size     = 30             # Reduced disk size
      ami_type      = "AL2_x86_64"
      labels = {
        role = "general"
        workload = "ims"
      }
      taints = []
    }
  }
}

# Database Configuration
variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15.4"
}

variable "db_instance_class" {
  description = "RDS instance class - optimized for 50 users"
  type        = string
  default     = "db.t4g.micro"  # ARM-based, more cost-effective
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS instance"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS instance (auto-scaling)"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "partpal"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "partpal"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Daily time range for automated backups"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Weekly time range for maintenance"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache node type - optimized for 50 users"
  type        = string
  default     = "cache.t4g.micro"  # ARM-based, more cost-effective
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1  # Single node sufficient for 50 users
}

# Load Balancer Configuration
variable "alb_target_groups" {
  description = "ALB target groups configuration - IMS only"
  type = list(object({
    name             = string
    backend_protocol = string
    backend_port     = number
    target_type      = string
    health_check = object({
      enabled             = bool
      healthy_threshold   = number
      interval            = number
      matcher             = string
      path                = string
      port                = string
      protocol            = string
      timeout             = number
      unhealthy_threshold = number
    })
  }))
  default = [
    {
      name             = "partpal-api"
      backend_protocol = "HTTP"
      backend_port     = 80
      target_type      = "ip"
      health_check = {
        enabled             = true
        healthy_threshold   = 2
        interval            = 30
        matcher             = "200"
        path                = "/api/health"
        port                = "traffic-port"
        protocol            = "HTTP"
        timeout             = 5
        unhealthy_threshold = 2
      }
    },
    {
      name             = "partpal-ims"
      backend_protocol = "HTTP"
      backend_port     = 80
      target_type      = "ip"
      health_check = {
        enabled             = true
        healthy_threshold   = 2
        interval            = 30
        matcher             = "200,302"
        path                = "/"
        port                = "traffic-port"
        protocol            = "HTTP"
        timeout             = 5
        unhealthy_threshold = 2
      }
    }
  ]
}

# Logging Configuration
variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
}

# Monitoring Configuration
variable "enable_cloudwatch_monitoring" {
  description = "Enable CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "enable_prometheus" {
  description = "Enable Prometheus monitoring"
  type        = bool
  default     = true
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

# Security Configuration
variable "enable_security_scanner" {
  description = "Enable security scanner"
  type        = bool
  default     = true
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access resources"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Cost Optimization
variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "scheduled_scaling" {
  description = "Scheduled scaling configuration"
  type = object({
    enabled = bool
    scale_down = object({
      cron     = string
      replicas = number
    })
    scale_up = object({
      cron     = string
      replicas = number
    })
  })
  default = {
    enabled = false
    scale_down = {
      cron     = "0 18 * * 1-5"  # 6 PM on weekdays
      replicas = 1
    }
    scale_up = {
      cron     = "0 8 * * 1-5"   # 8 AM on weekdays
      replicas = 3
    }
  }
}
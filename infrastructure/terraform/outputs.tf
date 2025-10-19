# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "List of IDs of database subnets"
  value       = module.vpc.database_subnets
}

# EKS Outputs
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "cluster_iam_role_name" {
  description = "IAM role name associated with EKS cluster"
  value       = module.eks.cluster_iam_role_name
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN associated with EKS cluster"
  value       = module.eks.cluster_iam_role_arn
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "cluster_name" {
  description = "The name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster for the OpenID Connect identity provider"
  value       = module.eks.cluster_oidc_issuer_url
}

output "node_groups" {
  description = "EKS node groups"
  value       = module.eks.node_groups
}

# Database Outputs
output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.db_instance_endpoint
  sensitive   = true
}

output "database_port" {
  description = "RDS instance port"
  value       = module.database.db_instance_port
}

output "database_name" {
  description = "RDS instance database name"
  value       = module.database.db_instance_name
}

output "database_username" {
  description = "RDS instance root username"
  value       = module.database.db_instance_username
  sensitive   = true
}

output "database_id" {
  description = "RDS instance ID"
  value       = module.database.db_instance_id
}

# Redis Outputs
output "redis_primary_endpoint" {
  description = "Redis primary endpoint address"
  value       = module.redis.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "Redis cluster port"
  value       = module.redis.port
}

output "redis_cluster_id" {
  description = "Redis cluster ID"
  value       = module.redis.replication_group_id
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = module.redis.connection_string
  sensitive   = true
}

# ECR Outputs
output "ecr_repository_urls" {
  description = "Map of ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "ecr_repository_arns" {
  description = "Map of ECR repository ARNs"
  value       = module.ecr.repository_arns
}

output "github_actions_access_key_id" {
  description = "GitHub Actions IAM user access key ID"
  value       = module.ecr.github_actions_access_key_id
  sensitive   = true
}

output "github_actions_secret_access_key" {
  description = "GitHub Actions IAM user secret access key"
  value       = module.ecr.github_actions_secret_access_key
  sensitive   = true
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = module.alb.lb_dns_name
}

output "alb_zone_id" {
  description = "The zone ID of the load balancer"
  value       = module.alb.lb_zone_id
}

output "alb_arn" {
  description = "The ARN of the load balancer"
  value       = module.alb.lb_arn
}

output "target_group_arns" {
  description = "ARNs of the target groups"
  value       = module.alb.target_group_arns
}

# Certificate Outputs
output "certificate_arn" {
  description = "The ARN of the certificate"
  value       = module.acm.certificate_arn
}

output "certificate_domain_validation_options" {
  description = "Set of domain validation objects"
  value       = module.acm.certificate_domain_validation_options
}

# S3 Outputs
output "s3_bucket_ids" {
  description = "List of S3 bucket IDs"
  value       = module.s3.bucket_ids
}

output "s3_bucket_arns" {
  description = "List of S3 bucket ARNs"
  value       = module.s3.bucket_arns
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = module.security_groups.alb_security_group_id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = module.security_groups.database_security_group_id
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = module.security_groups.redis_security_group_id
}

# CloudWatch Outputs
output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application_logs.name
}

output "cluster_log_group_name" {
  description = "Name of the cluster CloudWatch log group"
  value       = aws_cloudwatch_log_group.cluster_logs.name
}

# Connection Information
output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "aws eks get-token --cluster-name ${module.eks.cluster_name} --region ${var.aws_region} | kubectl apply -f -"
}

output "database_connection_string" {
  description = "Database connection string (without password)"
  value       = "postgresql://${module.database.db_instance_username}@${module.database.db_instance_endpoint}:${module.database.db_instance_port}/${module.database.db_instance_name}"
  sensitive   = true
}


# Environment Summary
output "environment_summary" {
  description = "Summary of the deployed environment"
  value = {
    environment          = var.environment
    cluster_name        = local.cluster_name
    region              = var.aws_region
    vpc_id              = module.vpc.vpc_id
    database_engine     = "postgres"
    database_version    = var.postgres_version
    kubernetes_version  = var.kubernetes_version
    domain_name         = var.domain_name
  }
}
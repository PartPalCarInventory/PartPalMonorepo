output "replication_group_id" {
  description = "ID of the ElastiCache replication group"
  value       = var.enable_cluster_mode ? aws_elasticache_replication_group.cluster_mode[0].id : aws_elasticache_replication_group.main[0].id
}

output "primary_endpoint_address" {
  description = "Address of the primary endpoint"
  value       = var.enable_cluster_mode ? aws_elasticache_replication_group.cluster_mode[0].configuration_endpoint_address : aws_elasticache_replication_group.main[0].primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "Address of the reader endpoint"
  value       = var.enable_cluster_mode ? null : aws_elasticache_replication_group.main[0].reader_endpoint_address
}

output "port" {
  description = "Port of the Redis cluster"
  value       = var.port
}

output "connection_string" {
  description = "Redis connection string"
  value       = var.enable_cluster_mode ? "redis://${aws_elasticache_replication_group.cluster_mode[0].configuration_endpoint_address}:${var.port}" : "redis://${aws_elasticache_replication_group.main[0].primary_endpoint_address}:${var.port}"
}

output "auth_token" {
  description = "Auth token for Redis (if transit encryption is enabled)"
  value       = var.transit_encryption_enabled ? (var.enable_cluster_mode ? aws_elasticache_replication_group.cluster_mode[0].auth_token : aws_elasticache_replication_group.main[0].auth_token) : null
  sensitive   = true
}

# ElastiCache Redis Cluster

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.cluster_id}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = var.tags
}

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.cluster_id}-params"
  family = var.parameter_group_family

  # Performance tuning
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = var.tags
}

resource "aws_elasticache_replication_group" "main" {
  count = var.enable_cluster_mode ? 0 : 1

  replication_group_id       = var.cluster_id
  replication_group_description = "ElastiCache Redis for ${var.cluster_id}"

  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_nodes
  port                 = var.port
  parameter_group_name = aws_elasticache_parameter_group.main.name

  # Subnet and security
  subnet_group_name  = var.subnet_group_name != null ? var.subnet_group_name : aws_elasticache_subnet_group.main.name
  security_group_ids = var.security_group_ids

  # Encryption
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token_enabled        = var.transit_encryption_enabled

  # Backup and maintenance
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window         = var.snapshot_window
  maintenance_window      = var.maintenance_window

  # High availability
  automatic_failover_enabled = var.num_cache_nodes > 1
  multi_az_enabled          = var.num_cache_nodes > 1 && var.multi_az_enabled

  # Notifications
  notification_topic_arn = var.notification_topic_arn

  # Auto minor version upgrade
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  tags = var.tags
}

# For cluster mode
resource "aws_elasticache_replication_group" "cluster_mode" {
  count = var.enable_cluster_mode ? 1 : 0

  replication_group_id       = var.cluster_id
  replication_group_description = "ElastiCache Redis Cluster for ${var.cluster_id}"

  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  port                 = var.port
  parameter_group_name = aws_elasticache_parameter_group.main.name

  # Subnet and security
  subnet_group_name  = var.subnet_group_name != null ? var.subnet_group_name : aws_elasticache_subnet_group.main.name
  security_group_ids = var.security_group_ids

  # Cluster mode configuration
  num_node_groups         = var.num_node_groups
  replicas_per_node_group = var.replicas_per_node_group

  # Encryption
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token_enabled        = var.transit_encryption_enabled

  # Backup and maintenance
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window         = var.snapshot_window
  maintenance_window      = var.maintenance_window

  # High availability
  automatic_failover_enabled = true
  multi_az_enabled          = var.multi_az_enabled

  # Notifications
  notification_topic_arn = var.notification_topic_arn

  # Auto minor version upgrade
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  tags = var.tags
}

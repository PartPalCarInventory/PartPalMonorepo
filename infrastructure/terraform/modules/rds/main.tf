resource "aws_db_instance" "main" {
  identifier = var.identifier

  # Engine configuration
  engine         = var.engine
  engine_version = var.engine_version
  instance_class = var.instance_class

  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = var.storage_type
  storage_encrypted     = var.storage_encrypted
  kms_key_id           = var.kms_key_id

  # Database configuration
  db_name  = var.db_name
  username = var.username
  password = var.password
  port     = var.port

  # Network configuration
  vpc_security_group_ids = var.vpc_security_group_ids
  db_subnet_group_name   = var.db_subnet_group_name
  publicly_accessible    = var.publicly_accessible

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  copy_tags_to_snapshot  = true
  delete_automated_backups = false

  # Maintenance configuration
  maintenance_window = var.maintenance_window
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  # Monitoring configuration
  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_role_arn
  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports

  # Performance insights
  performance_insights_enabled = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_retention_period

  # Deletion protection
  deletion_protection = var.deletion_protection
  skip_final_snapshot = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Multi-AZ
  multi_az = var.multi_az

  # Parameter group
  parameter_group_name = var.parameter_group_name

  # Option group
  option_group_name = var.option_group_name

  tags = var.tags

  lifecycle {
    ignore_changes = [
      password,
      final_snapshot_identifier,
    ]
  }
}

# Create parameter group for PostgreSQL
resource "aws_db_parameter_group" "main" {
  count = var.engine == "postgres" ? 1 : 0

  family = "postgres${split(".", var.engine_version)[0]}"
  name   = "${var.identifier}-params"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = var.tags
}
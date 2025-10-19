variable "cluster_id" {
  description = "ElastiCache cluster identifier"
  type        = string
}

variable "node_type" {
  description = "Instance class to use for the cache nodes"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes (for non-cluster mode)"
  type        = number
  default     = 1
}

variable "port" {
  description = "Port number on which each cache node accepts connections"
  type        = number
  default     = 6379
}

variable "engine_version" {
  description = "Version number of the cache engine"
  type        = string
  default     = "7.0"
}

variable "parameter_group_family" {
  description = "Family of the ElastiCache parameter group"
  type        = string
  default     = "redis7"
}

variable "parameter_group_name" {
  description = "Name of the parameter group to associate"
  type        = string
  default     = null
}

variable "subnet_ids" {
  description = "List of subnet IDs for the cache subnet group"
  type        = list(string)
  default     = []
}

variable "subnet_group_name" {
  description = "Name of the subnet group to associate"
  type        = string
  default     = null
}

variable "security_group_ids" {
  description = "List of security group IDs to associate"
  type        = list(string)
  default     = []
}

variable "at_rest_encryption_enabled" {
  description = "Whether to enable encryption at rest"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Whether to enable encryption in transit"
  type        = bool
  default     = true
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "snapshot_window" {
  description = "Daily time range for snapshots"
  type        = string
  default     = "03:00-05:00"
}

variable "maintenance_window" {
  description = "Weekly time range for maintenance"
  type        = string
  default     = "sun:05:00-sun:07:00"
}

variable "multi_az_enabled" {
  description = "Whether to enable Multi-AZ"
  type        = bool
  default     = false
}

variable "auto_minor_version_upgrade" {
  description = "Whether to automatically upgrade minor versions"
  type        = bool
  default     = true
}

variable "notification_topic_arn" {
  description = "ARN of an SNS topic to send ElastiCache notifications"
  type        = string
  default     = null
}

variable "enable_cluster_mode" {
  description = "Enable Redis cluster mode"
  type        = bool
  default     = false
}

variable "num_node_groups" {
  description = "Number of node groups (shards) for cluster mode"
  type        = number
  default     = 1
}

variable "replicas_per_node_group" {
  description = "Number of replica nodes per node group"
  type        = number
  default     = 1
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

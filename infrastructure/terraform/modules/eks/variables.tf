variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version to use for the EKS cluster"
  type        = string
  default     = "1.27"
}

variable "vpc_id" {
  description = "ID of the VPC where to create the cluster"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "control_plane_subnet_ids" {
  description = "List of subnet IDs for the control plane"
  type        = list(string)
}

variable "node_groups" {
  description = "Map of EKS node group definitions"
  type = map(object({
    capacity_type    = string
    instance_types   = list(string)
    desired_size     = number
    max_size         = number
    min_size         = number
    max_unavailable  = number
  }))
  default = {}
}

variable "cluster_endpoint_private_access" {
  description = "Indicates whether or not the Amazon EKS private API server endpoint is enabled"
  type        = bool
  default     = false
}

variable "cluster_endpoint_public_access" {
  description = "Indicates whether or not the Amazon EKS public API server endpoint is enabled"
  type        = bool
  default     = true
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "List of CIDR blocks which can access the Amazon EKS public API server endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "cluster_addons" {
  description = "Map of cluster addon configurations"
  type = map(object({
    most_recent               = optional(bool)
    version                   = optional(string)
    service_account_role_arn  = optional(string)
  }))
  default = {}
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}
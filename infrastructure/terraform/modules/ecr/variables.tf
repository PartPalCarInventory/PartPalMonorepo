variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "repository_names" {
  description = "List of ECR repository names to create"
  type        = list(string)
  default = [
    "partpal-api",
    "partpal-ims",
    "partpal-marketplace"
  ]
}

variable "image_tag_mutability" {
  description = "The tag mutability setting for the repository"
  type        = string
  default     = "MUTABLE"
  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.image_tag_mutability)
    error_message = "image_tag_mutability must be either MUTABLE or IMMUTABLE."
  }
}

variable "scan_on_push" {
  description = "Indicates whether images are scanned after being pushed to the repository"
  type        = bool
  default     = true
}

variable "max_image_count" {
  description = "Maximum number of images to keep"
  type        = number
  default     = 30
}

variable "untagged_image_days" {
  description = "Number of days to keep untagged images"
  type        = number
  default     = 7
}

variable "production_image_days" {
  description = "Number of days to keep production images"
  type        = number
  default     = 90
}

variable "enable_cross_account_access" {
  description = "Enable cross-account access to ECR repositories"
  type        = bool
  default     = false
}

variable "allowed_account_ids" {
  description = "List of AWS account IDs allowed to pull images"
  type        = list(string)
  default     = []
}

variable "create_github_actions_user" {
  description = "Create IAM user for GitHub Actions"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

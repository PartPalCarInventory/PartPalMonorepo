output "repository_urls" {
  description = "Map of repository names to URLs"
  value = {
    for repo_name, repo in aws_ecr_repository.repositories :
    repo_name => repo.repository_url
  }
}

output "repository_arns" {
  description = "Map of repository names to ARNs"
  value = {
    for repo_name, repo in aws_ecr_repository.repositories :
    repo_name => repo.arn
  }
}

output "ecr_pull_policy_arn" {
  description = "ARN of the ECR pull policy"
  value       = aws_iam_policy.ecr_pull.arn
}

output "ecr_push_policy_arn" {
  description = "ARN of the ECR push policy"
  value       = aws_iam_policy.ecr_push.arn
}

output "github_actions_user_name" {
  description = "Name of the GitHub Actions IAM user"
  value       = var.create_github_actions_user ? aws_iam_user.github_actions[0].name : null
}

output "github_actions_access_key_id" {
  description = "Access key ID for GitHub Actions user"
  value       = var.create_github_actions_user ? aws_iam_access_key.github_actions[0].id : null
  sensitive   = true
}

output "github_actions_secret_access_key" {
  description = "Secret access key for GitHub Actions user"
  value       = var.create_github_actions_user ? aws_iam_access_key.github_actions[0].secret : null
  sensitive   = true
}

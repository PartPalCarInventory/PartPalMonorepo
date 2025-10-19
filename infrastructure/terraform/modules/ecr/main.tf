# ECR Repositories for PartPal applications

resource "aws_ecr_repository" "repositories" {
  for_each = toset(var.repository_names)

  name                 = each.value
  image_tag_mutability = var.image_tag_mutability

  encryption_configuration {
    encryption_type = "AES256"
  }

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  tags = merge(
    var.tags,
    {
      Name = each.value
    }
  )
}

# Lifecycle policy to clean up old images
resource "aws_ecr_lifecycle_policy" "repositories" {
  for_each = aws_ecr_repository.repositories

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.max_image_count} images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "release"]
          countType     = "imageCountMoreThan"
          countNumber   = var.max_image_count
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images older than ${var.untagged_image_days} days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.untagged_image_days
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 3
        description  = "Keep production images for ${var.production_image_days} days"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["prod", "production", "main"]
          countType     = "sinceImagePushed"
          countUnit     = "days"
          countNumber   = var.production_image_days
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Repository policy for cross-account access (if needed)
resource "aws_ecr_repository_policy" "repositories" {
  for_each = var.enable_cross_account_access ? aws_ecr_repository.repositories : {}

  repository = each.value.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCrossAccountPull"
        Effect = "Allow"
        Principal = {
          AWS = var.allowed_account_ids
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

# IAM policy for EKS to pull from ECR
resource "aws_iam_policy" "ecr_pull" {
  name        = "${var.cluster_name}-ecr-pull-policy"
  description = "Allow EKS nodes to pull images from ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

# IAM policy for CI/CD to push to ECR
resource "aws_iam_policy" "ecr_push" {
  name        = "${var.cluster_name}-ecr-push-policy"
  description = "Allow CI/CD to push images to ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

# IAM user for GitHub Actions
resource "aws_iam_user" "github_actions" {
  count = var.create_github_actions_user ? 1 : 0
  name  = "${var.cluster_name}-github-actions"
  path  = "/ci-cd/"

  tags = var.tags
}

resource "aws_iam_user_policy_attachment" "github_actions_ecr_push" {
  count      = var.create_github_actions_user ? 1 : 0
  user       = aws_iam_user.github_actions[0].name
  policy_arn = aws_iam_policy.ecr_push.arn
}

resource "aws_iam_access_key" "github_actions" {
  count = var.create_github_actions_user ? 1 : 0
  user  = aws_iam_user.github_actions[0].name
}

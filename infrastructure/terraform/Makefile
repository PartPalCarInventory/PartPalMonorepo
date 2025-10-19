# PartPal Infrastructure Makefile
# Provides convenient commands for infrastructure management

.PHONY: help init plan apply destroy test clean validate format security backup restore

# Default target
help: ## Show this help message
	@echo "PartPal Infrastructure Management"
	@echo "================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Environment management
init: ## Initialize Terraform for development environment
	@echo "Initializing Terraform for development..."
	@./scripts/init.sh development

init-staging: ## Initialize Terraform for staging environment
	@echo "Initializing Terraform for staging..."
	@./scripts/init.sh staging

init-prod: ## Initialize Terraform for production environment
	@echo "Initializing Terraform for production..."
	@./scripts/init.sh production

# Planning
plan: ## Create Terraform plan for development environment
	@echo "Creating Terraform plan for development..."
	@./scripts/deploy.sh development plan

plan-staging: ## Create Terraform plan for staging environment
	@echo "Creating Terraform plan for staging..."
	@./scripts/deploy.sh staging plan

plan-prod: ## Create Terraform plan for production environment
	@echo "Creating Terraform plan for production..."
	@./scripts/deploy.sh production plan

# Deployment
apply: ## Apply Terraform plan for development environment
	@echo "Applying Terraform plan for development..."
	@./scripts/deploy.sh development apply

apply-staging: ## Apply Terraform plan for staging environment
	@echo "Applying Terraform plan for staging..."
	@./scripts/deploy.sh staging apply

apply-prod: ## Apply Terraform plan for production environment
	@echo "Applying Terraform plan for production..."
	@./scripts/deploy.sh production apply

# Destruction
destroy: ## Destroy development infrastructure
	@echo "Destroying development infrastructure..."
	@./scripts/deploy.sh development destroy

destroy-staging: ## Destroy staging infrastructure
	@echo "Destroying staging infrastructure..."
	@./scripts/deploy.sh staging destroy

destroy-prod: ## Destroy production infrastructure (DANGEROUS!)
	@echo "Destroying production infrastructure..."
	@./scripts/deploy.sh production destroy

# Testing and validation
test: ## Run infrastructure tests for development
	@echo "Running infrastructure tests for development..."
	@./scripts/test-infrastructure.sh development

test-staging: ## Run infrastructure tests for staging
	@echo "Running infrastructure tests for staging..."
	@./scripts/test-infrastructure.sh staging

test-prod: ## Run infrastructure tests for production
	@echo "Running infrastructure tests for production..."
	@./scripts/test-infrastructure.sh production

validate: ## Validate Terraform configuration
	@echo "Validating Terraform configuration..."
	@terraform validate

format: ## Format Terraform files
	@echo "Formatting Terraform files..."
	@terraform fmt -recursive .

# Security
security: ## Run security checks on infrastructure code
	@echo "Running security checks..."
	@if command -v checkov >/dev/null 2>&1; then \
		checkov -d . --framework terraform; \
	else \
		echo "Checkov not installed. Install with: pip install checkov"; \
	fi
	@if command -v tfsec >/dev/null 2>&1; then \
		tfsec .; \
	else \
		echo "TFSec not installed. Install with: go install github.com/aquasecurity/tfsec/cmd/tfsec@latest"; \
	fi

# Backup and disaster recovery
backup: ## Create backup of current infrastructure state
	@echo "Creating infrastructure backup..."
	@./scripts/disaster-recovery.sh development backup

backup-staging: ## Create backup of staging infrastructure
	@echo "Creating staging infrastructure backup..."
	@./scripts/disaster-recovery.sh staging backup

backup-prod: ## Create backup of production infrastructure
	@echo "Creating production infrastructure backup..."
	@./scripts/disaster-recovery.sh production backup

restore: ## Restore from backup (development)
	@echo "Restoring from backup..."
	@./scripts/disaster-recovery.sh development restore

restore-staging: ## Restore staging from backup
	@echo "Restoring staging from backup..."
	@./scripts/disaster-recovery.sh staging restore

restore-prod: ## Restore production from backup
	@echo "Restoring production from backup..."
	@./scripts/disaster-recovery.sh production restore

# Maintenance
clean: ## Clean temporary files
	@echo "Cleaning temporary files..."
	@rm -f *.tfplan
	@rm -f *.tfplan.*
	@rm -f terraform.tfstate.backup
	@rm -rf .terraform/
	@rm -f outputs.*.json

outputs: ## Show Terraform outputs for development
	@echo "Terraform outputs for development:"
	@terraform output -json | jq .

outputs-staging: ## Show Terraform outputs for staging
	@echo "Terraform outputs for staging:"
	@terraform workspace select staging 2>/dev/null || true
	@terraform output -json | jq .

outputs-prod: ## Show Terraform outputs for production
	@echo "Terraform outputs for production:"
	@terraform workspace select production 2>/dev/null || true
	@terraform output -json | jq .

# Kubernetes operations
k8s-apply: ## Apply Kubernetes manifests
	@echo "Applying Kubernetes manifests..."
	@kubectl apply -f ../kubernetes/namespace.yaml
	@kubectl apply -f ../kubernetes/configmap.yaml
	@kubectl apply -f ../kubernetes/rbac.yaml
	@kubectl apply -f ../kubernetes/network-policies.yaml
	@kubectl apply -f ../kubernetes/pod-disruption-budgets.yaml
	@kubectl apply -f ../kubernetes/monitoring.yaml
	@kubectl apply -f ../kubernetes/logging.yaml
	@kubectl apply -f ../kubernetes/backup-cronjob.yaml

k8s-status: ## Check Kubernetes cluster status
	@echo "Kubernetes cluster status:"
	@kubectl get nodes
	@kubectl get pods -n partpal
	@kubectl get services -n partpal

# Development workflow
dev-setup: init plan ## Quick development setup
	@echo "Development environment ready for deployment"

staging-deploy: init-staging plan-staging apply-staging test-staging ## Full staging deployment
	@echo "Staging environment deployed and tested"

prod-deploy: init-prod plan-prod ## Production deployment (requires manual apply)
	@echo "Production plan created. Review and run 'make apply-prod' to deploy"

# Monitoring
logs: ## View application logs
	@echo "Viewing application logs..."
	@kubectl logs -n partpal -l component=frontend --tail=100
	@kubectl logs -n partpal -l component=backend --tail=100

monitor: ## Open monitoring dashboard
	@echo "Opening monitoring dashboard..."
	@kubectl port-forward -n partpal service/prometheus-service 9090:9090 &
	@echo "Prometheus available at http://localhost:9090"

# Complete workflow
full-test: validate format security test ## Run all validation and tests
	@echo "All tests completed successfully"
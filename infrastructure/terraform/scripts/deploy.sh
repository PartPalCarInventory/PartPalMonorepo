#!/bin/bash

# Terraform deployment script for PartPal infrastructure
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"
ENV="${1:-development}"
ACTION="${2:-apply}"

echo "🚀 Deploying PartPal Infrastructure for environment: $ENV"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
validate_environment() {
    print_status "Validating environment: $ENV"

    case $ENV in
        development|staging|production)
            print_success "Environment '$ENV' is valid"
            ;;
        *)
            print_error "Invalid environment '$ENV'. Must be one of: development, staging, production"
            exit 1
            ;;
    esac
}

# Validate action
validate_action() {
    print_status "Validating action: $ACTION"

    case $ACTION in
        plan|apply|destroy)
            print_success "Action '$ACTION' is valid"
            ;;
        *)
            print_error "Invalid action '$ACTION'. Must be one of: plan, apply, destroy"
            exit 1
            ;;
    esac
}

# Check if plan exists
check_plan() {
    if [ "$ACTION" = "apply" ] && [ ! -f "$TERRAFORM_DIR/tfplan.$ENV" ]; then
        print_warning "No terraform plan found for $ENV environment"
        print_status "Creating new plan..."

        terraform plan \
            -var-file="terraform.tfvars.$ENV" \
            -var="environment=$ENV" \
            -out="tfplan.$ENV"
    fi
}

# Apply terraform plan
apply_terraform() {
    print_status "Applying Terraform plan for $ENV environment..."

    if [ "$ENV" = "production" ]; then
        print_warning "You are about to deploy to PRODUCTION environment"
        read -p "Are you sure you want to continue? (yes/no): " confirm

        if [ "$confirm" != "yes" ]; then
            print_error "Deployment cancelled"
            exit 1
        fi
    fi

    case $ACTION in
        plan)
            terraform plan \
                -var-file="terraform.tfvars.$ENV" \
                -var="environment=$ENV"
            ;;
        apply)
            terraform apply "tfplan.$ENV"

            # Save outputs to file
            terraform output -json > "outputs.$ENV.json"
            print_success "Outputs saved to outputs.$ENV.json"
            ;;
        destroy)
            print_warning "You are about to DESTROY all infrastructure for $ENV environment"
            read -p "Type 'destroy' to confirm: " confirm

            if [ "$confirm" != "destroy" ]; then
                print_error "Destroy cancelled"
                exit 1
            fi

            terraform destroy \
                -var-file="terraform.tfvars.$ENV" \
                -var="environment=$ENV" \
                -auto-approve
            ;;
    esac
}

# Post-deployment tasks
post_deployment() {
    if [ "$ACTION" = "apply" ]; then
        print_status "Running post-deployment tasks..."

        # Extract important outputs
        EKS_CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "")
        if [ -n "$EKS_CLUSTER_NAME" ]; then
            print_status "Updating kubeconfig for EKS cluster: $EKS_CLUSTER_NAME"
            aws eks update-kubeconfig --region af-south-1 --name "$EKS_CLUSTER_NAME"
        fi

        # Display important information
        print_success "Deployment completed successfully!"
        print_status "Important outputs:"

        if [ -f "outputs.$ENV.json" ]; then
            echo "Database endpoint: $(jq -r '.database_endpoint.value // "N/A"' outputs.$ENV.json)"
            echo "Redis endpoint: $(jq -r '.redis_endpoint.value // "N/A"' outputs.$ENV.json)"
            echo "Load balancer DNS: $(jq -r '.load_balancer_dns.value // "N/A"' outputs.$ENV.json)"
            echo "EKS cluster endpoint: $(jq -r '.cluster_endpoint.value // "N/A"' outputs.$ENV.json)"
        fi

        print_status "Next steps:"
        echo "  1. Apply Kubernetes manifests: kubectl apply -f ../kubernetes/"
        echo "  2. Verify deployment: kubectl get pods -n partpal"
        echo "  3. Configure DNS records if needed"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up temporary files..."

    # Remove plan file after successful apply
    if [ "$ACTION" = "apply" ] && [ $? -eq 0 ]; then
        rm -f "tfplan.$ENV"
    fi
}

# Main execution
main() {
    print_status "Starting PartPal Infrastructure deployment..."

    cd "$TERRAFORM_DIR"

    validate_environment
    validate_action
    check_plan
    apply_terraform
    post_deployment
    cleanup

    print_success "Infrastructure deployment completed successfully!"
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
#!/bin/bash

# Terraform initialization and validation script for PartPal infrastructure
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"
ENV="${1:-development}"

echo "🚀 Initializing PartPal Infrastructure for environment: $ENV"

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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi

    # Check terraform version
    TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
    print_status "Terraform version: $TERRAFORM_VERSION"

    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi

    print_success "Prerequisites check completed"
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

# Initialize terraform backend
init_terraform() {
    print_status "Initializing Terraform backend..."

    cd "$TERRAFORM_DIR"

    # Create terraform variables file for the environment
    if [ ! -f "terraform.tfvars.$ENV" ]; then
        print_warning "terraform.tfvars.$ENV not found. Creating from template..."
        cp terraform.tfvars.example "terraform.tfvars.$ENV"
        print_warning "Please edit terraform.tfvars.$ENV with your specific values before proceeding"
    fi

    # Initialize terraform
    terraform init \
        -backend-config="key=infrastructure/$ENV/terraform.tfstate" \
        -reconfigure

    print_success "Terraform initialized successfully"
}

# Validate terraform configuration
validate_terraform() {
    print_status "Validating Terraform configuration..."

    terraform validate

    if [ $? -eq 0 ]; then
        print_success "Terraform configuration is valid"
    else
        print_error "Terraform configuration validation failed"
        exit 1
    fi
}

# Format terraform files
format_terraform() {
    print_status "Formatting Terraform files..."

    terraform fmt -recursive .

    print_success "Terraform files formatted"
}

# Create terraform plan
create_plan() {
    print_status "Creating Terraform plan..."

    terraform plan \
        -var-file="terraform.tfvars.$ENV" \
        -var="environment=$ENV" \
        -out="tfplan.$ENV"

    print_success "Terraform plan created: tfplan.$ENV"
}

# Main execution
main() {
    print_status "Starting PartPal Infrastructure initialization..."

    check_prerequisites
    validate_environment
    init_terraform
    validate_terraform
    format_terraform
    create_plan

    print_success "Infrastructure initialization completed successfully!"
    print_status "Next steps:"
    echo "  1. Review the plan: terraform show tfplan.$ENV"
    echo "  2. Apply the plan: ./scripts/deploy.sh $ENV"
}

# Run main function
main "$@"
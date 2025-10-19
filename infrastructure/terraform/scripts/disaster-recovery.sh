#!/bin/bash

# Disaster Recovery Script for PartPal Infrastructure
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"
ENV="${1:-production}"
ACTION="${2:-restore}"

echo "🆘 PartPal Disaster Recovery - Environment: $ENV, Action: $ACTION"

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

print_critical() {
    echo -e "${RED}[CRITICAL]${NC} $1"
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

# Check prerequisites
check_prerequisites() {
    print_status "Checking disaster recovery prerequisites..."

    # Check if required tools are installed
    local tools=("terraform" "aws" "kubectl" "jq")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            print_error "$tool is not installed"
            exit 1
        fi
    done

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        exit 1
    fi

    print_success "Prerequisites check completed"
}

# Backup current state
backup_current_state() {
    print_status "Creating backup of current infrastructure state..."

    local backup_dir="disaster-recovery-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup Terraform state
    if terraform state pull > "$backup_dir/terraform.tfstate.backup"; then
        print_success "Terraform state backed up"
    else
        print_error "Failed to backup Terraform state"
        exit 1
    fi

    # Backup Kubernetes resources
    if command -v kubectl &> /dev/null; then
        print_status "Backing up Kubernetes resources..."
        kubectl get all,pv,pvc,configmaps,secrets -n partpal -o yaml > "$backup_dir/kubernetes-resources.yaml" 2>/dev/null || true
        kubectl get nodes -o yaml > "$backup_dir/kubernetes-nodes.yaml" 2>/dev/null || true
    fi

    # Backup database if possible
    backup_database "$backup_dir"

    print_success "Current state backed up to: $backup_dir"
}

# Backup database
backup_database() {
    local backup_dir="$1"
    print_status "Attempting to backup database..."

    # Get database connection info from Terraform outputs
    local db_endpoint=$(terraform output -raw database_endpoint 2>/dev/null || echo "")

    if [ -n "$db_endpoint" ]; then
        print_status "Database endpoint found: $db_endpoint"

        # Create emergency database backup
        local backup_file="$backup_dir/emergency-db-backup-$(date +%Y%m%d-%H%M%S).sql"

        print_warning "Manual database backup required"
        print_status "Run the following command to backup the database:"
        echo "pg_dump -h $db_endpoint -U partpal -d partpal > $backup_file"
    else
        print_warning "Database endpoint not found in Terraform outputs"
    fi
}

# Restore from backup
restore_from_backup() {
    print_critical "Starting disaster recovery restore process..."

    # List available backups
    print_status "Available backups in S3:"
    aws s3 ls s3://partpal-$ENV-backups/database/ | grep "partpal-backup-" | tail -10

    read -p "Enter the backup filename to restore from: " backup_filename

    if [ -z "$backup_filename" ]; then
        print_error "No backup filename provided"
        exit 1
    fi

    # Confirm restore operation
    print_warning "This will restore the database from backup: $backup_filename"
    print_warning "This operation is DESTRUCTIVE and will replace current data"
    read -p "Type 'RESTORE' to confirm: " confirm

    if [ "$confirm" != "RESTORE" ]; then
        print_error "Restore cancelled"
        exit 1
    fi

    # Download backup from S3
    print_status "Downloading backup from S3..."
    aws s3 cp "s3://partpal-$ENV-backups/database/$backup_filename" "/tmp/$backup_filename"

    # Get database connection info
    local db_endpoint=$(terraform output -raw database_endpoint 2>/dev/null || echo "")

    if [ -n "$db_endpoint" ]; then
        print_status "Restoring database from backup..."
        print_warning "You will need to manually restore the database using:"
        echo "pg_restore -h $db_endpoint -U partpal -d partpal --clean --if-exists /tmp/$backup_filename"

        read -p "Press Enter after you have manually restored the database..."
    else
        print_error "Cannot determine database endpoint"
        exit 1
    fi
}

# Rebuild infrastructure
rebuild_infrastructure() {
    print_critical "Rebuilding infrastructure from scratch..."

    cd "$TERRAFORM_DIR"

    # Reinitialize Terraform
    print_status "Reinitializing Terraform..."
    terraform init -reconfigure

    # Create new infrastructure
    print_status "Creating new infrastructure..."
    terraform plan -var-file="terraform.tfvars.$ENV" -var="environment=$ENV" -out="disaster-recovery.tfplan"

    print_warning "Review the plan before applying"
    read -p "Press Enter to apply the disaster recovery plan..."

    terraform apply "disaster-recovery.tfplan"

    # Update kubeconfig
    local cluster_name=$(terraform output -raw cluster_name 2>/dev/null || echo "")
    if [ -n "$cluster_name" ]; then
        print_status "Updating kubeconfig for new cluster..."
        aws eks update-kubeconfig --region af-south-1 --name "$cluster_name"
    fi

    print_success "Infrastructure rebuilt successfully"
}

# Redeploy applications
redeploy_applications() {
    print_status "Redeploying applications to recovered infrastructure..."

    # Apply Kubernetes manifests
    kubectl apply -f "$(dirname "$TERRAFORM_DIR")/kubernetes/namespace.yaml"
    kubectl apply -f "$(dirname "$TERRAFORM_DIR")/kubernetes/configmap.yaml"
    kubectl apply -f "$(dirname "$TERRAFORM_DIR")/kubernetes/rbac.yaml"
    kubectl apply -f "$(dirname "$TERRAFORM_DIR")/kubernetes/secrets-template.yaml"  # Needs manual secret creation
    kubectl apply -f "$(dirname "$TERRAFORM_DIR")/kubernetes/network-policies.yaml"
    kubectl apply -f "$(dirname "$TERRAFORM_DIR")/kubernetes/pod-disruption-budgets.yaml"

    print_warning "You need to manually create secrets before deploying applications"
    print_status "Create secrets using the template in secrets-template.yaml"

    read -p "Press Enter after creating secrets..."

    # Deploy applications (you would need to update with actual deployment commands)
    kubectl apply -f "$(dirname "$TERRAFORM_DIR")/kubernetes/marketplace-deployment.yaml"
    kubectl apply -f "$(dirname "$TERRAFORM_DIR")/kubernetes/ims-deployment.yaml"
    kubectl apply -f "$(dirname "$TERRAFORM_DIR")/kubernetes/api-deployment.yaml"

    print_success "Applications redeployed"
}

# Health check
health_check() {
    print_status "Performing health check..."

    # Check infrastructure
    local cluster_name=$(terraform output -raw cluster_name 2>/dev/null || echo "")
    if [ -n "$cluster_name" ]; then
        print_status "Cluster status:"
        kubectl get nodes
        kubectl get pods -n partpal
    fi

    # Check database connectivity
    local db_endpoint=$(terraform output -raw database_endpoint 2>/dev/null || echo "")
    if [ -n "$db_endpoint" ]; then
        print_status "Database endpoint: $db_endpoint"
    fi

    print_success "Health check completed"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"

    print_status "Sending disaster recovery notification..."

    # This would integrate with your notification system (Slack, email, etc.)
    echo "Disaster Recovery $status: $message" | mail -s "PartPal DR $status" admin@partpal.co.za || true

    print_status "Notification sent"
}

# Main execution
main() {
    case $ACTION in
        backup)
            check_prerequisites
            validate_environment
            backup_current_state
            send_notification "BACKUP" "Emergency backup completed for $ENV"
            ;;
        restore)
            check_prerequisites
            validate_environment
            backup_current_state
            restore_from_backup
            send_notification "RESTORE" "Database restore completed for $ENV"
            ;;
        rebuild)
            check_prerequisites
            validate_environment
            backup_current_state
            rebuild_infrastructure
            redeploy_applications
            health_check
            send_notification "REBUILD" "Infrastructure rebuild completed for $ENV"
            ;;
        health)
            check_prerequisites
            validate_environment
            health_check
            ;;
        *)
            print_error "Invalid action: $ACTION"
            echo "Usage: $0 <environment> <action>"
            echo "Actions: backup, restore, rebuild, health"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
#!/bin/bash

# Infrastructure Testing and Validation Script for PartPal
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"
ENV="${1:-development}"

echo "🧪 Testing PartPal Infrastructure - Environment: $ENV"

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
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

# Run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local is_critical="${3:-false}"

    print_status "Running test: $test_name"

    if eval "$test_command" >/dev/null 2>&1; then
        print_success "$test_name"
        ((TESTS_PASSED++))
        return 0
    else
        if [ "$is_critical" = "true" ]; then
            print_error "$test_name (CRITICAL)"
            ((TESTS_FAILED++))
            return 1
        else
            print_warning "$test_name"
            ((TESTS_WARNED++))
            return 0
        fi
    fi
}

# Test Terraform configuration
test_terraform() {
    print_status "Testing Terraform configuration..."

    cd "$TERRAFORM_DIR"

    # Test terraform validate
    run_test "Terraform validate" "terraform validate" true

    # Test terraform fmt
    run_test "Terraform format check" "terraform fmt -check -recursive" false

    # Test terraform plan
    if [ -f "terraform.tfvars.$ENV" ]; then
        run_test "Terraform plan generation" "terraform plan -var-file=terraform.tfvars.$ENV -var=environment=$ENV -out=test.tfplan" true
        rm -f test.tfplan
    else
        print_warning "No terraform.tfvars.$ENV found, skipping plan test"
    fi
}

# Test AWS connectivity and permissions
test_aws() {
    print_status "Testing AWS connectivity and permissions..."

    # Test AWS CLI authentication
    run_test "AWS CLI authentication" "aws sts get-caller-identity" true

    # Test required AWS permissions
    run_test "EKS permissions" "aws eks list-clusters --region af-south-1" true
    run_test "RDS permissions" "aws rds describe-db-instances --region af-south-1" true
    run_test "S3 permissions" "aws s3 ls" false
    run_test "IAM permissions" "aws iam list-roles --max-items 1" false

    # Test region configuration
    local current_region=$(aws configure get region)
    if [ "$current_region" = "af-south-1" ]; then
        print_success "AWS region correctly set to af-south-1"
        ((TESTS_PASSED++))
    else
        print_warning "AWS region is $current_region, expected af-south-1"
        ((TESTS_WARNED++))
    fi
}

# Test Kubernetes connectivity
test_kubernetes() {
    print_status "Testing Kubernetes connectivity..."

    # Check if kubectl is configured
    run_test "Kubectl configuration" "kubectl cluster-info" false

    if kubectl cluster-info >/dev/null 2>&1; then
        # Test cluster access
        run_test "Kubernetes cluster access" "kubectl get nodes" false
        run_test "Kubernetes namespace access" "kubectl get namespaces" false

        # Test PartPal namespace
        if kubectl get namespace partpal >/dev/null 2>&1; then
            print_success "PartPal namespace exists"
            ((TESTS_PASSED++))

            # Test resources in partpal namespace
            run_test "ConfigMaps in partpal namespace" "kubectl get configmaps -n partpal" false
            run_test "Secrets in partpal namespace" "kubectl get secrets -n partpal" false
            run_test "Pods in partpal namespace" "kubectl get pods -n partpal" false
        else
            print_warning "PartPal namespace does not exist"
            ((TESTS_WARNED++))
        fi
    fi
}

# Test Docker configuration
test_docker() {
    print_status "Testing Docker configuration..."

    # Test Docker daemon
    run_test "Docker daemon" "docker info" false

    # Test Dockerfile syntax
    local docker_dir="$(dirname "$TERRAFORM_DIR")/docker"
    if [ -d "$docker_dir" ]; then
        for dockerfile in "$docker_dir"/Dockerfile.*; do
            if [ -f "$dockerfile" ]; then
                local service=$(basename "$dockerfile" | sed 's/Dockerfile\.//')
                run_test "Dockerfile.$service syntax" "docker build --dry-run -f $dockerfile ." false
            fi
        done
    fi
}

# Test network connectivity
test_network() {
    print_status "Testing network connectivity..."

    # Test internet connectivity
    run_test "Internet connectivity" "curl -s --max-time 10 https://google.com" true

    # Test AWS endpoints
    run_test "AWS EKS endpoint" "curl -s --max-time 10 https://eks.af-south-1.amazonaws.com" false
    run_test "AWS RDS endpoint" "curl -s --max-time 10 https://rds.af-south-1.amazonaws.com" false

    # Test DNS resolution
    run_test "DNS resolution" "nslookup google.com" false
}

# Test infrastructure outputs
test_infrastructure_outputs() {
    print_status "Testing infrastructure outputs..."

    cd "$TERRAFORM_DIR"

    if terraform output >/dev/null 2>&1; then
        # Test critical outputs
        local cluster_name=$(terraform output -raw cluster_name 2>/dev/null || echo "")
        local database_endpoint=$(terraform output -raw database_endpoint 2>/dev/null || echo "")
        local redis_endpoint=$(terraform output -raw redis_endpoint 2>/dev/null || echo "")

        if [ -n "$cluster_name" ]; then
            print_success "EKS cluster name output available: $cluster_name"
            ((TESTS_PASSED++))
        else
            print_warning "EKS cluster name output not available"
            ((TESTS_WARNED++))
        fi

        if [ -n "$database_endpoint" ]; then
            print_success "Database endpoint output available"
            ((TESTS_PASSED++))
        else
            print_warning "Database endpoint output not available"
            ((TESTS_WARNED++))
        fi

        if [ -n "$redis_endpoint" ]; then
            print_success "Redis endpoint output available"
            ((TESTS_PASSED++))
        else
            print_warning "Redis endpoint output not available"
            ((TESTS_WARNED++))
        fi
    else
        print_warning "No terraform outputs available (infrastructure may not be deployed)"
        ((TESTS_WARNED++))
    fi
}

# Test security configurations
test_security() {
    print_status "Testing security configurations..."

    # Test Kubernetes RBAC
    if kubectl cluster-info >/dev/null 2>&1; then
        run_test "Kubernetes RBAC enabled" "kubectl auth can-i list pods --as=system:anonymous" false
        run_test "Service accounts configured" "kubectl get serviceaccounts -n partpal" false
        run_test "Network policies configured" "kubectl get networkpolicies -n partpal" false
    fi

    # Test Terraform security
    cd "$TERRAFORM_DIR"
    run_test "No hardcoded secrets in Terraform" "! grep -r 'password.*=' *.tf" false
    run_test "Encryption enabled for RDS" "grep -q 'storage_encrypted.*=.*true' *.tf" false
}

# Test application health endpoints
test_application_health() {
    print_status "Testing application health endpoints..."

    # Get load balancer DNS from terraform outputs
    local lb_dns=$(terraform output -raw load_balancer_dns 2>/dev/null || echo "")

    if [ -n "$lb_dns" ]; then
        # Test marketplace health
        run_test "Marketplace health endpoint" "curl -s --max-time 10 http://$lb_dns/api/health" false

        # Test IMS health endpoint
        run_test "IMS health endpoint" "curl -s --max-time 10 http://$lb_dns:3001/api/health" false

        # Test API health endpoint
        run_test "API health endpoint" "curl -s --max-time 10 http://$lb_dns:3333/health" false
    else
        print_warning "Load balancer DNS not available, skipping health endpoint tests"
        ((TESTS_WARNED++))
    fi
}

# Generate test report
generate_report() {
    local total_tests=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNED))

    print_status "Test Results Summary:"
    echo "=========================="
    echo "Total Tests: $total_tests"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo "Warnings: $TESTS_WARNED"
    echo "=========================="

    if [ $TESTS_FAILED -gt 0 ]; then
        print_error "Some critical tests failed. Infrastructure may not be ready."
        return 1
    elif [ $TESTS_WARNED -gt 0 ]; then
        print_warning "Some tests generated warnings. Review before proceeding."
        return 0
    else
        print_success "All tests passed! Infrastructure is ready."
        return 0
    fi
}

# Main execution
main() {
    print_status "Starting infrastructure testing for environment: $ENV"

    test_terraform
    test_aws
    test_docker
    test_network
    test_kubernetes
    test_infrastructure_outputs
    test_security
    test_application_health

    generate_report
}

# Run main function
main "$@"
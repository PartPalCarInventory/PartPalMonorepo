#!/bin/bash

# PartPal Post-Deployment Verification Tests
# Runs automated checks after deployment to verify system health

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_URL="${1:-https://ims.partpal.co.za}"
TIMEOUT=10
PASSED=0
FAILED=0
WARNINGS=0

# Print header
echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    PartPal Post-Deployment Verification Tests     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Testing deployment: ${BLUE}${DEPLOYMENT_URL}${NC}"
echo ""

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local check_content="$4"

    echo -n "Testing ${name}... "

    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null)
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        if [ -n "$check_content" ]; then
            if echo "$body" | grep -q "$check_content"; then
                echo -e "${GREEN}✓ PASS${NC}"
                ((PASSED++))
                return 0
            else
                echo -e "${YELLOW}⚠ WARNING${NC} - Status OK but content mismatch"
                echo "  Expected content: $check_content"
                ((WARNINGS++))
                return 1
            fi
        else
            echo -e "${GREEN}✓ PASS${NC}"
            ((PASSED++))
            return 0
        fi
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Expected status: $expected_status, Got: $status_code"
        ((FAILED++))
        return 1
    fi
}

# Test with JSON parsing
test_json_endpoint() {
    local name="$1"
    local url="$2"
    local json_key="$3"
    local expected_value="$4"

    echo -n "Testing ${name}... "

    response=$(curl -s --max-time $TIMEOUT "$url" 2>/dev/null)

    if [ -z "$response" ]; then
        echo -e "${RED}✗ FAIL${NC} - No response"
        ((FAILED++))
        return 1
    fi

    # Check if response is valid JSON
    if ! echo "$response" | jq empty 2>/dev/null; then
        echo -e "${RED}✗ FAIL${NC} - Invalid JSON response"
        ((FAILED++))
        return 1
    fi

    # Extract value using jq
    actual_value=$(echo "$response" | jq -r ".$json_key" 2>/dev/null)

    if [ "$actual_value" = "$expected_value" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        echo "  Expected $json_key: $expected_value, Got: $actual_value"
        ((WARNINGS++))
        return 1
    fi
}

# Check dependencies
check_dependencies() {
    local missing=0

    if ! command -v curl &> /dev/null; then
        echo -e "${RED}✗ curl is not installed${NC}"
        missing=1
    fi

    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠ jq is not installed (optional, for JSON parsing)${NC}"
    fi

    return $missing
}

# Main test suite
run_tests() {
    echo -e "${BLUE}━━━ Basic Connectivity Tests ${NC}"

    # Test 1: Root endpoint
    test_endpoint "Root endpoint" "$DEPLOYMENT_URL" "200"

    # Test 2: Health check
    test_json_endpoint "Health check" "$DEPLOYMENT_URL/api/health" "status" "ok"

    # Test 3: Database health (might require auth)
    test_endpoint "Database health check" "$DEPLOYMENT_URL/api/health/db" "200|401"

    echo ""
    echo -e "${BLUE}━━━ Static Assets Tests ${NC}"

    # Test 4: Favicon
    test_endpoint "Favicon" "$DEPLOYMENT_URL/favicon.ico" "200"

    # Test 5: Next.js static assets (check if _next directory is accessible)
    test_endpoint "Next.js build manifest" "$DEPLOYMENT_URL/_next/static/chunks/webpack" "200"

    echo ""
    echo -e "${BLUE}━━━ Security Headers Tests ${NC}"

    # Test 6: HTTPS redirect (if not using HTTPS URL)
    if [[ $DEPLOYMENT_URL =~ ^http:// ]]; then
        echo -n "Testing HTTPS redirect... "
        https_url="${DEPLOYMENT_URL/http:/https:}"
        response=$(curl -s -I -L --max-time $TIMEOUT "$DEPLOYMENT_URL" 2>/dev/null | grep -i "location:")
        if echo "$response" | grep -q "https://"; then
            echo -e "${GREEN}✓ PASS${NC}"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠ WARNING${NC} - HTTPS redirect not detected"
            ((WARNINGS++))
        fi
    fi

    # Test 7: Security headers
    echo -n "Testing security headers... "
    headers=$(curl -s -I --max-time $TIMEOUT "$DEPLOYMENT_URL" 2>/dev/null)

    security_headers_found=0
    if echo "$headers" | grep -qi "x-frame-options"; then ((security_headers_found++)); fi
    if echo "$headers" | grep -qi "x-content-type-options"; then ((security_headers_found++)); fi
    if echo "$headers" | grep -qi "strict-transport-security"; then ((security_headers_found++)); fi

    if [ $security_headers_found -ge 2 ]; then
        echo -e "${GREEN}✓ PASS${NC} ($security_headers_found/3 headers found)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - Only $security_headers_found/3 security headers found"
        ((WARNINGS++))
    fi

    echo ""
    echo -e "${BLUE}━━━ API Endpoints Tests ${NC}"

    # Test 8: API routes accessibility (these might require auth)
    test_endpoint "Vehicles API" "$DEPLOYMENT_URL/api/vehicles" "200|401"
    test_endpoint "Parts API" "$DEPLOYMENT_URL/api/parts" "200|401"

    echo ""
    echo -e "${BLUE}━━━ Performance Tests ${NC}"

    # Test 9: Response time
    echo -n "Testing response time... "
    start_time=$(date +%s%N)
    curl -s --max-time $TIMEOUT "$DEPLOYMENT_URL/api/health" > /dev/null 2>&1
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))

    if [ $response_time -lt 1000 ]; then
        echo -e "${GREEN}✓ PASS${NC} (${response_time}ms)"
        ((PASSED++))
    elif [ $response_time -lt 3000 ]; then
        echo -e "${YELLOW}⚠ WARNING${NC} (${response_time}ms - slower than ideal)"
        ((WARNINGS++))
    else
        echo -e "${RED}✗ FAIL${NC} (${response_time}ms - too slow)"
        ((FAILED++))
    fi
}

# Summary
print_summary() {
    echo ""
    echo -e "${BLUE}━━━ Test Summary ${NC}"
    echo "  Total tests: $((PASSED + FAILED + WARNINGS))"
    echo -e "  ${GREEN}Passed: $PASSED${NC}"
    echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"
    echo -e "  ${RED}Failed: $FAILED${NC}"
    echo ""

    if [ $FAILED -eq 0 ]; then
        if [ $WARNINGS -eq 0 ]; then
            echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║  ✓ SUCCESS: All tests passed                      ║${NC}"
            echo -e "${GREEN}║     Deployment is healthy and ready               ║${NC}"
            echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
            return 0
        else
            echo -e "${YELLOW}╔═══════════════════════════════════════════════════╗${NC}"
            echo -e "${YELLOW}║  ⚠ WARNING: All tests passed with warnings       ║${NC}"
            echo -e "${YELLOW}║     Review warnings before considering complete   ║${NC}"
            echo -e "${YELLOW}╚═══════════════════════════════════════════════════╝${NC}"
            return 0
        fi
    else
        echo -e "${RED}╔═══════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ✗ FAILURE: Some tests failed                     ║${NC}"
        echo -e "${RED}║     Review failures and fix before proceeding     ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════╝${NC}"
        return 1
    fi
}

# Main execution
main() {
    # Check dependencies
    if ! check_dependencies; then
        echo -e "${RED}Missing required dependencies. Please install and retry.${NC}"
        exit 1
    fi

    # Run tests
    run_tests

    # Print summary
    print_summary
    exit_code=$?

    echo ""
    echo "Logs and detailed results can be viewed in Vercel Dashboard"
    echo "  Deployments: https://vercel.com/dashboard"
    echo "  Logs: vercel logs $DEPLOYMENT_URL"
    echo ""

    exit $exit_code
}

# Run main function
main

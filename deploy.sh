#!/bin/bash
set -e

# Configuration
PROJECT_NAME="faq"
DEPLOY_DIR="/c/work/QKA/qka"
GIT_BRANCH="master"
DOCKER_REGISTRY="nest-pharmatech"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up old containers and images..."
    docker system prune -f
    docker volume prune -f
    rm -rf node_modules .next
    npm cache clean --force
}

# Check disk space
check_disk_space() {
    local available_space=$(df -h / | awk 'NR==2 {print $4}' | sed 's/G//')
    if (( $(echo "$available_space < 10" | bc -l) )); then
        log_warn "Low disk space detected: ${available_space}GB available"
        cleanup
    fi
}

# Build function
build() {
    log_info "Installing dependencies..."
    npm install --production --frozen-lockfile

    log_info "Building application..."
    npm run build

    log_info "Building Docker image..."
    docker-compose build --no-cache
}

# Deploy function
deploy() {
    cd "$DEPLOY_DIR" || exit 1
    
    # Configure git
    git config --global --add safe.directory "$DEPLOY_DIR"
    
    # Update source code
    log_info "Updating source code..."
    git fetch origin
    git checkout "$GIT_BRANCH"
    git pull origin "$GIT_BRANCH"
    
    # Check disk space before build
    check_disk_space
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose down || true
    
    # Build application
    build
    
    # Start new containers
    log_info "Starting containers..."
    docker-compose up -d
    
    # Wait for health check
    log_info "Waiting for service to be healthy..."
    for i in {1..30}; do
        if docker-compose ps | grep -q "healthy"; then
            log_info "Service is healthy!"
            return 0
        fi
        sleep 2
    done
    
    log_error "Service failed to become healthy within timeout"
    return 1
}

# Main execution
log_info "Starting deployment of $PROJECT_NAME..."

# Error handling
if ! deploy; then
    log_error "Deployment failed"
    docker-compose logs
    exit 1
fi

log_info "Deployment completed successfully" 
# Configuration
$PROJECT_NAME = "faq"
$DEPLOY_DIR = "C:\work\QKA\qka"
$GIT_BRANCH = "master"

# Colors for output
$RED = [ConsoleColor]::Red
$GREEN = [ConsoleColor]::Green
$YELLOW = [ConsoleColor]::Yellow

# Helper functions
function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor $GREEN
}

function Write-Warn {
    param($Message)
    Write-Host "[WARN] $Message" -ForegroundColor $YELLOW
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $RED
}

# Cleanup function
function Cleanup {
    Write-Info "Cleaning up old containers and images..."
    docker system prune -f
    docker volume prune -f
    
    Write-Info "Cleaning up node modules and build files..."
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
    npm cache clean --force
}

# Check disk space
function Check-DiskSpace {
    $drive = Get-PSDrive C
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    
    if ($freeSpaceGB -lt 10) {
        Write-Warn "Low disk space detected: ${freeSpaceGB}GB available"
        Cleanup
    }
}

# Build function
function Build {
    try {
        Write-Info "Installing dependencies..."
        npm install --production --frozen-lockfile
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

        Write-Info "Building application..."
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm build failed" }

        Write-Info "Building Docker image..."
        docker-compose build --no-cache
        if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }
    }
    catch {
        Write-Error "Build failed: $_"
        throw
    }
}

# Deploy function
function Deploy {
    try {
        # Change to deploy directory
        Set-Location $DEPLOY_DIR
        
        # Update source code
        Write-Info "Updating source code..."
        git fetch origin
        git checkout $GIT_BRANCH
        git pull origin $GIT_BRANCH
        
        # Check disk space
        Check-DiskSpace
        
        # Stop existing containers
        Write-Info "Stopping existing containers..."
        docker-compose down
        
        # Build application
        Build
        
        # Start new containers
        Write-Info "Starting containers..."
        docker-compose up -d
        
        # Wait for health check
        Write-Info "Waiting for service to be healthy..."
        $healthy = $false
        $attempts = 30
        
        while ($attempts -gt 0) {
            $status = docker-compose ps
            if ($status -match "healthy") {
                $healthy = $true
                break
            }
            Start-Sleep -Seconds 2
            $attempts--
        }
        
        if (-not $healthy) {
            throw "Service failed to become healthy within timeout"
        }
        
        Write-Info "Service is healthy!"
    }
    catch {
        Write-Error "Deployment failed: $_"
        docker-compose logs
        throw
    }
}

# Main execution
try {
    Write-Info "Starting deployment of $PROJECT_NAME..."
    Deploy
    Write-Info "Deployment completed successfully"
}
catch {
    Write-Error "Deployment failed. See logs above for details."
    exit 1
} 
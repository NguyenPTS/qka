#!/bin/bash

echo "🚀 Starting deployment process..."

# Stop and remove existing container if it exists
echo "Cleaning up existing containers..."
docker ps -q --filter "name=qka" | grep -q . && docker stop qka && docker rm qka

# Remove existing image
echo "Removing old image..."
docker image rm qka 2>/dev/null || true

# Clean npm cache and remove node_modules
echo "Cleaning npm cache..."
npm cache clean --force
rm -rf node_modules
rm -rf .next

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps --force

# Build the Docker image
echo "Building Docker image..."
docker build -t qka . --no-cache

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "🎉 Build successful! Starting container..."
    
    # Run the container
    docker run -d --name qka -p 3000:3000 qka

    # Check if container started successfully
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully!"
        echo "Application is running on port 3000"
        docker ps | grep qka
    else
        echo "❌ Failed to start container"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi 
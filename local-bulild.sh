#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
else
    echo ".env file not found. Please create one."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build:ci

# List files for confirmation
echo "Listing files..."
ls -lR

# Deploy to local environment
echo "Deploying to local environment..."
npm run deploy:dev

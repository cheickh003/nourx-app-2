#!/bin/bash

# Script de configuration et exécution des tests
set -e

echo "🧪 Setting up test environment for Nourx Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_status "Test setup script ready!"
print_status "Run with: ./scripts/test-setup.sh [unit|integration|e2e|all|coverage]"
#!/bin/bash

# =============================================================================
# NOURX Bootstrap Script
# =============================================================================

set -e

echo "🚀 Bootstrapping NOURX project..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env from env.example...${NC}"
    cp env.example .env
    echo -e "${GREEN}✅ .env created! Please review and update it.${NC}"
else
    echo -e "${YELLOW}⚠️  .env already exists, skipping copy${NC}"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is required but not installed.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is required but not installed.${NC}"
    exit 1
fi

echo -e "${BLUE}🐳 Starting services...${NC}"
cd infra/compose && docker-compose up -d

echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

echo -e "${BLUE}🗃️  Running Django migrations...${NC}"
cd ../.. && make migrate

echo -e "${BLUE}👤 Creating superuser...${NC}"
echo "Please create a superuser account:"
make createsuperuser

echo -e "${BLUE}🌱 Loading seed data...${NC}"
make seed-data

echo ""
echo -e "${GREEN}🎉 Bootstrap completed successfully!${NC}"
echo ""
echo -e "${BLUE}Available services:${NC}"
echo "  • Django API:     http://localhost:8000"
echo "  • Next.js App:    http://localhost:3000"
echo "  • Django Admin:   http://localhost:8000/admin/"
echo "  • MailHog UI:     http://localhost:8025"
echo "  • MinIO Console:  http://localhost:9001"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit Django Admin to verify setup"
echo "2. Visit Next.js App to see the frontend"
echo "3. Check the API documentation at http://localhost:8000/api/schema/swagger-ui/"

# =============================================================================
# NOURX APPLICATION - Makefile
# =============================================================================

.DEFAULT_GOAL := help
SHELL := /bin/bash

# Docker Compose file path
COMPOSE_FILE := infra/compose/docker-compose.yml

# Colors for terminal output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
CYAN := \033[0;36m
NC := \033[0m # No Color

##@ Development

.PHONY: help
help: ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(CYAN)Usage:$(NC)\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(CYAN)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: setup
setup: ## Initial project setup
	@echo "$(BLUE)🚀 Setting up NOURX project...$(NC)"
	@cp env.example .env || echo "$(YELLOW)⚠️  .env already exists, skipping copy$(NC)"
	@echo "$(GREEN)✅ Project setup completed!$(NC)"
	@echo "$(YELLOW)📝 Please review and update .env file with your configuration$(NC)"

.PHONY: up
up: ## Start all services with docker-compose
	@echo "$(BLUE)🐳 Starting NOURX services...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✅ All services started successfully!$(NC)"
	@echo ""
	@echo "$(CYAN)🌐 Available services:$(NC)"
	@echo "  • Django API:     http://localhost:8000"
	@echo "  • Next.js App:    http://localhost:3000"
	@echo "  • Django Admin:   http://localhost:8000/admin/"
	@echo "  • MailHog UI:     http://localhost:8025"
	@echo "  • MinIO Console:  http://localhost:9001"
	@echo "  • PostgreSQL:     localhost:5432"
	@echo "  • Redis:          localhost:6379"

.PHONY: down
down: ## Stop all services
	@echo "$(YELLOW)🛑 Stopping NOURX services...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)✅ All services stopped!$(NC)"

.PHONY: restart
restart: down up ## Restart all services

.PHONY: logs
logs: ## Show logs for all services
	@docker-compose -f $(COMPOSE_FILE) logs -f

.PHONY: logs-web
logs-web: ## Show logs for Django web service
	@docker-compose -f $(COMPOSE_FILE) logs -f web

.PHONY: logs-frontend
logs-frontend: ## Show logs for Next.js frontend service
	@docker-compose -f $(COMPOSE_FILE) logs -f web-frontend

.PHONY: logs-worker
logs-worker: ## Show logs for Celery worker service
	@docker-compose -f $(COMPOSE_FILE) logs -f worker

##@ Database & Migrations

.PHONY: migrate
migrate: ## Run Django migrations
	@echo "$(BLUE)🗃️  Running Django migrations...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py migrate
	@echo "$(GREEN)✅ Migrations completed!$(NC)"

.PHONY: makemigrations
makemigrations: ## Create new Django migrations
	@echo "$(BLUE)📝 Creating Django migrations...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py makemigrations
	@echo "$(GREEN)✅ Migrations created!$(NC)"

.PHONY: createsuperuser
createsuperuser: ## Create Django superuser
	@echo "$(BLUE)👤 Creating Django superuser...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py createsuperuser
	@echo "$(GREEN)✅ Superuser created!$(NC)"

.PHONY: dbshell
dbshell: ## Open PostgreSQL shell
	@echo "$(BLUE)🗃️  Opening PostgreSQL shell...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec postgres psql -U nourx_user -d nourx_db

.PHONY: resetdb
resetdb: ## Reset database (WARNING: destroys all data)
	@echo "$(RED)⚠️  WARNING: This will destroy all database data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(YELLOW)🗃️  Resetting database...$(NC)"; \
		docker-compose -f $(COMPOSE_FILE) down; \
		docker volume rm $$(docker volume ls -q | grep nourx-app-2_postgres_data) 2>/dev/null || true; \
		docker-compose -f $(COMPOSE_FILE) up -d postgres; \
		sleep 5; \
		make migrate; \
		echo "$(GREEN)✅ Database reset completed!$(NC)"; \
	else \
		echo "$(GREEN)✅ Database reset cancelled.$(NC)"; \
	fi

##@ Data Management

.PHONY: seed-data
seed-data: ## Load seed data
	@echo "$(BLUE)🌱 Loading seed data...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py loaddata fixtures/initial_data.json || echo "$(YELLOW)⚠️  No seed data found, skipping...$(NC)"
	@echo "$(GREEN)✅ Seed data loaded!$(NC)"

.PHONY: shell
shell: ## Open Django shell
	@echo "$(BLUE)🐚 Opening Django shell...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py shell

.PHONY: shell-plus
shell-plus: ## Open Django shell with shell_plus (if available)
	@echo "$(BLUE)🐚 Opening Django shell_plus...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py shell_plus || make shell

##@ Services Management

.PHONY: bash
bash: ## Open bash shell in Django container
	@docker-compose -f $(COMPOSE_FILE) exec web bash

.PHONY: bash-frontend
bash-frontend: ## Open bash shell in Next.js container
	@docker-compose -f $(COMPOSE_FILE) exec web-frontend bash

.PHONY: ps
ps: ## Show running services status
	@docker-compose -f $(COMPOSE_FILE) ps

.PHONY: top
top: ## Show running processes in containers
	@docker-compose -f $(COMPOSE_FILE) top

##@ Development Tools

.PHONY: test
test: ## Run backend tests (auth/health/schema)
	@echo "$(BLUE)🧪 Running Django tests...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py test apps.accounts.tests apps.core.tests -v 1
	@echo "$(GREEN)✅ Tests completed!$(NC)"

.PHONY: test-phase3
test-phase3: ## Run Phase 3 API tests (projects/tasks scoping)
	@echo "$(BLUE)🧪 Running Phase 3 API tests...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py test apps.projects.tests apps.tasks.tests -v 1
	@echo "$(GREEN)✅ Phase 3 tests passed!$(NC)"

.PHONY: test-phase4
test-phase4: ## Run Phase 4 API tests (documents/invoices)
	@echo "$(BLUE)🧪 Running Phase 4 API tests...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py test apps.documents.tests apps.billing.tests -v 1
	@echo "$(GREEN)✅ Phase 4 tests passed!$(NC)"

.PHONY: test-all
test-all: ## Run full backend tests (phases 1-5) with low verbosity
	@echo "$(BLUE)🧪 Running full backend tests...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py test -v 1 \
		apps.accounts.tests \
		apps.core.tests \
		apps.projects.tests \
		apps.tasks.tests \
		apps.documents.tests \
		apps.billing.tests \
		apps.payments.tests
	@echo "$(GREEN)✅ Full test suite completed!$(NC)"

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	@echo "$(BLUE)🧪 Running tests with coverage...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web coverage run --source='.' manage.py test
	@docker-compose -f $(COMPOSE_FILE) exec web coverage report
	@docker-compose -f $(COMPOSE_FILE) exec web coverage html
	@echo "$(GREEN)✅ Coverage report generated!$(NC)"

.PHONY: lint
lint: ## Run linting tools
	@echo "$(BLUE)🔍 Running linting tools...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web black --check .
	@docker-compose -f $(COMPOSE_FILE) exec web isort --check-only .
	@docker-compose -f $(COMPOSE_FILE) exec web ruff check .
	@echo "$(GREEN)✅ Linting completed!$(NC)"

.PHONY: format
format: ## Format code
	@echo "$(BLUE)✨ Formatting code...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web black .
	@docker-compose -f $(COMPOSE_FILE) exec web isort .
	@docker-compose -f $(COMPOSE_FILE) exec web ruff --fix .
	@echo "$(GREEN)✅ Code formatted!$(NC)"

.PHONY: collectstatic
collectstatic: ## Collect static files
	@echo "$(BLUE)📦 Collecting static files...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec web python manage.py collectstatic --noinput
	@echo "$(GREEN)✅ Static files collected!$(NC)"

##@ Cleanup

.PHONY: clean
clean: ## Clean up containers, volumes, and images
	@echo "$(YELLOW)🧹 Cleaning up Docker resources...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) down --volumes --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✅ Cleanup completed!$(NC)"

.PHONY: clean-all
clean-all: ## Clean up everything including images
	@echo "$(RED)⚠️  WARNING: This will remove all Docker resources!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(YELLOW)🧹 Cleaning up all Docker resources...$(NC)"; \
		docker-compose -f $(COMPOSE_FILE) down --volumes --remove-orphans --rmi all; \
		docker system prune -af --volumes; \
		echo "$(GREEN)✅ Complete cleanup finished!$(NC)"; \
	else \
		echo "$(GREEN)✅ Cleanup cancelled.$(NC)"; \
	fi

##@ Information

.PHONY: status
status: ## Show project status
	@echo "$(CYAN)📊 NOURX Project Status$(NC)"
	@echo "===================="
	@echo ""
	@echo "$(BLUE)🐳 Docker Services:$(NC)"
	@make ps
	@echo ""
	@echo "$(BLUE)🌐 Available URLs:$(NC)"
	@echo "  • Django API:     http://localhost:8000"
	@echo "  • Next.js App:    http://localhost:3000"
	@echo "  • Django Admin:   http://localhost:8000/admin/"
	@echo "  • MailHog UI:     http://localhost:8025"
	@echo "  • MinIO Console:  http://localhost:9001"
	@echo ""
	@echo "$(BLUE)📁 Project Structure:$(NC)"
	@echo "  • Backend API:    apps/api/"
	@echo "  • Frontend Web:   apps/web/"
	@echo "  • Infrastructure: infra/"
	@echo "  • Documentation:  docs/"

##@ Quick Start

.PHONY: bootstrap
bootstrap: setup up migrate seed-data createsuperuser ## Complete project bootstrap
	@echo ""
	@echo "$(GREEN)🎉 NOURX project bootstrapped successfully!$(NC)"
	@echo ""
	@echo "$(CYAN)Next steps:$(NC)"
	@echo "1. Visit Django Admin: http://localhost:8000/admin/"
	@echo "2. Visit Next.js App:  http://localhost:3000"
	@echo "3. Check MailHog:      http://localhost:8025"
	@echo "4. Review API docs:    http://localhost:8000/api/schema/swagger-ui/"

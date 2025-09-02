# NOURX App - Client Portal & Project Management

A comprehensive web application for managing client relationships, projects, invoices, and support tickets. Built with Node.js, PostgreSQL, and SvelteKit.

## 🏗️ Architecture

### Backend (API)
- **Node.js + Express** - RESTful API server (runs locally)
- **PostgreSQL** - Primary database (Docker only in dev)
- **JWT Authentication** - Secure token-based auth
- **Nodemailer** - Email notifications
- **Winston** - Structured logging
- **Helmet + CORS** - Security middleware

### Frontend (Web)
- **SvelteKit** - Modern web framework (runs locally)
- **Tailwind CSS** - Utility-first CSS
- **Flowbite Svelte** - UI component library
- **Neutral Theme** - Black/white design system

### Infrastructure
- **Docker Compose (DB only)** - Postgres for development
- **GitHub Actions** - CI pipeline
- **ESLint + Prettier** - Code quality

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nourx-app-2
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start PostgreSQL (Docker only)**
```bash
# Host port 5433 is mapped to container 5432
docker compose up -d db
```

4. **Run API (local)**
```bash
cd api
npm install
npm run dev
# Health: http://localhost:3001/health
```

5. **Run Web (local)**
```bash
cd web
npm install
npm run dev
# App: http://localhost:5173
```

### Manual Development Setup

#### API Setup
```bash
cd api
npm install
npm run dev
```

#### Frontend Setup  
```bash
cd web
npm install
npm run dev
```

#### Database Setup
```bash
# Start PostgreSQL (dev only)
docker compose up -d db

# The schema and seed run automatically via database/init/*.sql
# DB is reachable on host at localhost:5433
```

## 📋 Development Phases

### ✅ Phase 0: Foundation (Complete)
- [x] Dockerized PostgreSQL (DB only) + init scripts
- [x] PostgreSQL database schema
- [x] Express API skeleton with domain routing
- [x] Security middleware (Helmet, CORS, rate limiting)
- [x] SvelteKit frontend with Tailwind + Flowbite
- [x] Neutral design system (black/white theme)
- [x] Authentication layouts (/login, /admin/login)
- [x] Dashboard layouts (/app/*, /admin/*)
- [x] CI pipeline (lint/tests/build) without Docker images

### 🔄 Phase 1: Authentication & Accounts
- [ ] JWT authentication implementation
- [ ] Organization and user management
- [ ] Account activation/deactivation with email notifications
- [ ] Password reset functionality
- [ ] Role-based access control (RBAC)
- [ ] Audit logging for security events

### 🔄 Phase 2: Support System
- [ ] Ticket creation and management
- [ ] Email notification system
- [ ] File attachment handling
- [ ] SLA tracking and alerts
- [ ] Agent assignment and workflows

### 🔄 Phase 3: Projects & Billing
- [ ] Project and milestone management
- [ ] Deliverable upload and approval
- [ ] Invoice generation and management
- [ ] Payment integration
- [ ] PDF generation for invoices

### 🔄 Phase 4: Client Portal Completion
- [ ] Complete client dashboard
- [ ] Document management system
- [ ] Advanced filtering and search
- [ ] Mobile responsiveness optimization

### 🔄 Phase 5: Production Hardening
- [ ] Security audit and OWASP compliance
- [ ] Performance optimization
- [ ] Monitoring and alerting
- [ ] Backup and recovery procedures
- [ ] Production deployment setup

## 🛠️ Development Commands

### API Commands
```bash
cd api
npm run dev          # Start development server
npm run start        # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
```

### Frontend Commands
```bash
cd web
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run Svelte type checking
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Docker Commands
```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs api           # View API logs
docker-compose logs web           # View web logs
docker-compose exec db psql -U nourx_user -d nourx  # Connect to database
```

## 🔐 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin request control
- **Rate limiting** - Prevent abuse
- **Input validation** - Zod/express-validator
- **SQL injection protection** - Parameterized queries
- **JWT token management** - Secure authentication
- **Password hashing** - bcrypt/argon2id
- **CSRF protection** - Token-based
- **Audit logging** - Security event tracking

## 📊 Database Schema

Key entities:
- `organizations` - Client companies
- `user_admin` - Internal team members
- `user_client` - Client users
- `projects` - Client projects
- `tickets` - Support tickets
- `invoices` - Billing documents
- `email_outbox` - Reliable email delivery
- `audit_logs` - Security and activity logs

## 🎨 Design System

### Color Palette (Neutral)
- **Primary**: Slate tones (neutral grays)
- **Background**: White/Dark slate
- **Text**: High contrast black/white
- **Accents**: Subtle gray variations

### Typography
- **Font**: Inter (system fallback)
- **Scale**: Tailwind typography scale
- **Weights**: 300-700

### Components
- **Flowbite Svelte** - Pre-built accessible components
- **Custom utilities** - Project-specific helpers
- **Responsive design** - Mobile-first approach

## 🚦 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Account Management
- `GET /api/accounts/organizations` - List organizations
- `POST /api/accounts/organizations` - Create organization
- `GET /api/accounts/organizations/:id/users` - Organization users
- `POST /api/accounts/organizations/:id/users` - Create user + invitation

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id/deliverables` - Project deliverables

### Support
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `POST /api/tickets/:id/messages` - Add message

### Billing
- `GET /api/billing/invoices` - List invoices
- `POST /api/billing/invoices` - Create invoice
- `GET /api/billing/invoices/:id/pdf` - Download PDF

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nourx
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nourx
DB_USER=nourx_user
DB_PASSWORD=nourx_password

# API
NODE_ENV=development
PORT=3001
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=noreply@nourx.com

# Frontend
PUBLIC_API_URL=http://localhost:3001
VITE_API_URL=http://localhost:3001
```

## 📈 Monitoring & Observability

- **Winston** - Structured JSON logging
- **Request ID tracking** - Request correlation
- **Health check endpoints** - Service monitoring
- **Performance metrics** - Response time tracking
- **Error tracking** - Centralized error handling

## 🧪 Testing

- **Jest** - Unit and integration tests
- **Supertest** - API endpoint testing
- **Svelte Testing Library** - Component testing
- **Playwright** - End-to-end testing (planned)

## 📝 License

© 2024 NOURX. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

For questions or support, please contact the development team or create an issue in the repository.

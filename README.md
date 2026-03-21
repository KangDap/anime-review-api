# Anime Review API

[![CI](https://github.com/KangDap/anime-review-api/actions/workflows/ci.yml/badge.svg)](https://github.com/KangDap/anime-review-api/actions/workflows/ci.yml)
[![CI Docker](https://github.com/KangDap/anime-review-api/actions/workflows/docker-ci.yml/badge.svg)](https://github.com/KangDap/anime-review-api/actions/workflows/docker-ci.yml)
[![CS](https://github.com/KangDap/anime-review-api/actions/workflows/cs.yml/badge.svg)](https://github.com/KangDap/anime-review-api/actions/workflows/cs.yml)

Anime Review API is a basic RESTful API built with Next.js for anime catalog and review management, including JWT-based authentication.

## Tech Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js + TypeScript | 16.1.6 / 5.x | Core API framework and type safety |
| **Database** | PostgreSQL | 16 | Main relational data store |
| **ORM** | Prisma | 7.5.0 | Schema, migrations, and DB access |
| **Authentication** | JWT + bcryptjs | 9.0.3 / 3.0.3 | Token auth and password hashing |
| **Containerization** | Docker + Docker Compose | Latest / v3 | Local and production container setup |
| **Testing** | Vitest | 3.2.4 | Unit and endpoint testing |
| **CI/CS** | GitHub Actions | Native | Automated CI and code scanning |

## Project Architecture

### Authentication Model

The API uses JWT (JSON Web Tokens) for stateless authentication. Upon successful login or registration, users receive a token containing their user ID, role, and email. This token must be included in the Authorization header for protected endpoints.

### API Architecture

This project implements a basic RESTful API structure with clear separation of concerns:
- Public endpoints: anime listing and review retrieval
- Authenticated endpoints: review creation, update, and deletion
- Admin-only endpoints: user listing and global review listing

## Features

- Basic RESTful CRUD endpoints for anime and reviews
- User registration and JWT authentication
- Role-based authorization (USER and ADMIN)
- Pagination support for list endpoints
- Comprehensive input validation
- Automatic database migrations
- Docker containerization with health checks
- GitHub Actions CI/CS pipeline

## Prerequisites

- Node.js 22 or higher
- PostgreSQL 16 or higher (for local development)
- Docker and Docker Compose (for containerized setup)

## Getting Started

### Local Development Setup

1. Clone the repository
```bash
git clone <repository-url>
cd anime-review-api
```

2. Install dependencies
```bash
npm install
```

3. Create environment configuration
```bash
cp .env.example .env
```

Edit `.env` with your local configuration:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/anime_review
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
APP_PORT=3000
```

4. Setup database
```bash
npx prisma migrate deploy
```

5. Generate Prisma client
```bash
npx prisma generate
```

6. Start the development server
```bash
npm run dev
```

The API will be available at http://localhost:3000

### Running Tests

Execute unit tests with coverage:
```bash
npm run test
```

### Building for Production

Create an optimized production build:
```bash
npm run build
npm start
```

## Docker Setup

The project includes complete Docker support for both development and production environments.

### Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher

### Local Development with Docker

Start the complete stack (application + database) with one command:

```bash
docker-compose up -d
```

This will:
- Build the application image
- Start PostgreSQL container with automatic health checks
- Run database migrations
- Make the API available at http://localhost:3000
- Database connection available at localhost:5433 (configurable via DB_PORT)

Wait for the application to be ready:
```bash
docker-compose logs app
```

View logs in real-time:
```bash
docker-compose logs -f
```

Stop the stack:
```bash
docker-compose down
```

Cleanup volumes (delete data):
```bash
docker-compose down -v
```

### Production Deployment with Docker Compose

For production environments, use the production-hardened compose file:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

The production configuration includes:
- All secrets required (no unsafe defaults)
- Database port not exposed to host
- Security restrictions (no new privileges)
- Production-grade PostgreSQL configuration

### Docker Configuration

**Dockerfile Details**
- Multi-stage build optimization (dependencies, builder, runner)
- Base image: node:22-alpine for minimal footprint
- Non-root user (node) for enhanced security
- Health check using HTTP endpoint verification
- Build-time Prisma client generation
- Output format set to standalone for single server binary

**Environment Variables**
- `DATABASE_URL`: Full PostgreSQL connection string with credentials
- `JWT_SECRET`: Secret key for signing JWT tokens (required in production)
- `JWT_EXPIRES_IN`: Token expiration time (default: 24h)
- `POSTGRES_USER`: Database user (default: postgres)
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name (default: anime_review)
- `APP_PORT`: Application listening port (default: 3000)
- `DB_PORT`: PostgreSQL host port mapping (default: 5433)

For development, default credentials are provided through environment interpolation in docker-compose.yml. Change `POSTGRES_PASSWORD` for production deployment.

## Available API Endpoints

For detailed API endpoint documentation, see [API_DOCS.md](API_DOCS.md).

Quick reference:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/animes` - List all anime
- `POST /api/animes` - Create anime (admin)
- `GET /api/animes/:id` - Get anime details
- `GET /api/animes/:id/reviews` - Get anime reviews
- `POST /api/animes/:id/reviews` - Create review (authenticated)
- `GET /api/reviews` - List all reviews (admin)
- `GET /api/reviews/:id` - Get review details
- `PUT /api/reviews/:id` - Update review (owner or admin)
- `DELETE /api/reviews/:id` - Delete review (owner or admin)
- `GET /api/users` - List users (admin)
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/reviews` - Get user reviews

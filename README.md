# PricePulse

PricePulse is a SaaS app for tracking product prices and alerting users when prices drop.

## Current Status

Phases 1-6 are implemented:
- Monorepo structure (`frontend`, `backend`, `infrastructure`, `docs`)
- Docker Compose with `postgres`, `redis`, `django`, `nextjs`, `celery_worker`, and `celery_beat`
- Django + DRF backend with PostgreSQL support
- Next.js + Tailwind frontend with login/register pages
- JWT authentication with custom user model
- Product tracking (create/list)
- Price history storage and retrieval
- Celery background workers with Redis broker
- Celery Beat scheduler for automated price checks every 2 hours
- BeautifulSoup + Playwright scraper support for Amazon and Flipkart

## Quick Start

1. Copy environment values:
   - Backend: `cp backend/.env.example backend/.env`
   - Frontend: `cp frontend/.env.example frontend/.env.local`
2. Run from repo root:
   - `docker compose up --build`
3. Open:
   - Frontend: `http://localhost:3000`
   - Backend health: `http://localhost:8000/api/health`

## Implemented APIs

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/products` - Create tracked product
- `GET /api/products` - List user's tracked products
- `GET /api/products/{id}/history` - Get price history for product

## Background Tasks

- **check_product_prices** - Runs every 2 hours via Celery Beat
  - Fetches current price from tracked product URLs
  - Updates product info (title, price, last_checked)
  - Creates price history entries
  - Retries up to 3 times on failure with 5-minute delay

## Notes

- Email notifications and dashboard are planned for later phases.
- Production hardening and monitoring are planned for Phase 9.

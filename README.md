# PricePulse

PricePulse is a full-stack SaaS app for tracking product prices and notifying users when prices drop.

## Project Status

Implemented through Phase 10:

- Monorepo layout with `frontend`, `backend`, `infrastructure`, and `docs`
- Dockerized local stack with PostgreSQL, Redis, Django, Next.js, Celery worker, and Celery Beat
- JWT authentication with custom email-based user model
- Product tracking and price history
- Background price checks and email alerts
- Production hardening: logging, validation, rate limiting, JWT security, health and metrics endpoints
- Scraper support for Amazon, Flipkart, Myntra, and Ajio
- GitHub Actions CI/CD workflow for tests, frontend build, and optional deploy hooks

## Tech Stack

- Backend: Django 5 + Django REST Framework + SimpleJWT
- Frontend: Next.js 14 + React 18 + Tailwind CSS
- Queue: Celery + Redis
- Database: PostgreSQL
- Scraping: BeautifulSoup + Playwright fallback

## Local Development

1. Copy environment files.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

2. Start services.

```bash
docker compose up --build
```

3. Open applications.

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/health/`

## API Endpoints

Authentication:

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`

Products:

- `POST /api/products/`
- `GET /api/products/`
- `GET /api/products/{id}/history/`

Monitoring:

- `GET /api/health/`
- `GET /api/metrics/`

## Background Jobs

- `check_product_prices` runs every 2 hours via Celery Beat.
- Job behavior:
- Detects scraper by product URL domain.
- Scrapes latest title and price.
- Updates `Product` and writes `PriceHistory`.
- Sends price drop alert if current price is below target.
- Retries on failures with exponential Celery retry controls.

## Supported Stores

- Amazon
- Flipkart
- Myntra
- Ajio

## Testing

Run backend tests:

```bash
docker compose run --rm django python manage.py test accounts api
```

Run frontend production build check:

```bash
docker compose run --rm nextjs npm run build
```

## CI/CD (GitHub Actions)

Workflow file: `.github/workflows/ci-cd.yml`

On pull requests and pushes to `main`:

- Runs backend test suite against PostgreSQL + Redis service containers
- Builds frontend with production `next build`

On push to `main` (optional deploy stage):

- Triggers Render deploy hook if `RENDER_DEPLOY_HOOK_URL` is configured
- Deploys frontend to Vercel if Vercel secrets are configured

Required GitHub secrets for deploy stage:

- `RENDER_DEPLOY_HOOK_URL`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Free Hosting Guide

Recommended setup for low-cost launch:

- Frontend: Vercel (free)
- Backend API: Render Web Service (free tier)
- Database: Neon PostgreSQL (free)
- Redis: Upstash Redis (free)

Deployment order:

1. Deploy backend service on Render from `backend` directory.
2. Configure backend environment variables from `backend/.env.example`.
3. Point backend database and Redis variables to Neon and Upstash.
4. Deploy frontend on Vercel from `frontend` directory.
5. Set `NEXT_PUBLIC_API_BASE_URL` to deployed backend URL + `/api`.
6. Add GitHub repository secrets for CI/CD deploy stage.

## Security Notes

- Use strong values for `SECRET_KEY` and `JWT_SECRET_KEY` in production.
- Keep `DEBUG=False` in production.
- Configure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` for deployed domains.
- Never commit `.env` or secret tokens.

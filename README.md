# ClothStore — Premium Fashion E-Commerce

Production-ready clothing e-commerce web application built with modern web technologies.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (access + refresh tokens) with httpOnly cookies |
| Payments | Razorpay payment gateway |
| Email | Nodemailer with SMTP |
| State | Zustand |
| Data Fetching | TanStack React Query |
| Charts | Recharts |

## Features

### Customer
- Product catalog with filters (price, size, color, brand, rating)
- Product detail with image gallery, size/color variants, reviews
- Shopping cart with coupon support
- 3-step checkout with Razorpay payment integration
- User accounts (profile, addresses, order history, wishlist)
- Search with autocomplete
- Responsive design (mobile-first)

### Admin Panel
- Dashboard with revenue charts and stats
- Product management with variant support
- Order management with status updates and email notifications
- Customer management
- Category tree management
- Coupon management
- Review moderation

### Technical
- JWT auth with auto-refresh tokens
- Email verification and password reset via OTP
- Beautiful responsive HTML email templates
- Razorpay webhook handling
- Rate limiting on auth routes
- Zod validation on all endpoints
- Global error handling
- Winston logging
- Image upload support

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay test account (https://dashboard.razorpay.com)
- SMTP credentials (Gmail app password works)

### Setup

1. Clone and install dependencies:
```bash
cd clothstore
npm run setup
```

2. Create `.env` file from template:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Seed the database:
```bash
npm run db:seed
```

4. Start development servers:
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Health: http://localhost:5000/api/health

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clothstore.com | Admin@123 |
| Customer | rahul.kumar@gmail.com | Test@123 |
| Customer | anita.patel@gmail.com | Test@123 |
| Customer | vikram.singh@gmail.com | Test@123 |

## Seed Data

- 4 users (1 admin + 3 customers)
- 22 categories (4 parent + 18 subcategories)
- 44 products with Indian brands (FabIndia, Allen Solly, Biba, Levi's, etc.)
- 150+ product variants (size/color combinations)
- 55+ reviews with realistic comments
- 3 coupons: WELCOME10, FLAT500, SUMMER20
- 13 orders in various statuses
- 6 addresses across 3 cities

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/clothstore

# JWT
JWT_ACCESS_SECRET=your-access-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="ClothStore <noreply@clothstore.com>"

# Server
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Install all dependencies and seed database |
| `npm run dev` | Start frontend + backend concurrently |
| `npm run build` | Production build |
| `npm run db:seed` | Seed database with sample data |

## Project Structure

```
clothstore/
├── server/                 # Express API server
│   └── src/
│       ├── config/         # DB, env, logger
│       ├── middleware/      # Auth, validation, rate limit, error handler
│       ├── models/         # 12 Mongoose models
│       ├── routes/         # 15 route files
│       ├── services/       # Email + Razorpay services
│       ├── utils/          # JWT, password, helpers
│       ├── types/          # TypeScript interfaces
│       ├── index.ts        # Entry point
│       └── seed.ts         # Database seeder
├── client/                 # React SPA
│   └── src/
│       ├── components/
│       │   ├── ui/         # 20 shadcn/ui components
│       │   ├── layout/     # Header, Footer, MegaMenu, CartDrawer
│       │   └── shared/     # Breadcrumbs, StarRating, PriceDisplay
│       ├── pages/          # 19 customer pages
│       │   ├── admin/      # 9 admin pages
│       │   └── static/     # 8 static pages
│       ├── stores/         # 3 Zustand stores
│       ├── hooks/          # Custom hooks
│       ├── lib/            # API, utils, constants
│       └── types/          # TypeScript interfaces
└── .env.example
```

## Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | #1a1f36 | Primary, headers, buttons |
| Gold | #c8a96e | Accent, CTAs, highlights |
| White | #ffffff | Background |
| Charcoal | #2d3436 | Body text |

## License

Private — built for client delivery.


## Deployment

### Docker Compose (Easiest)

```bash
# Clone the repository
git clone https://github.com/humanoidmaker/clothstore.git
cd clothstore

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### PM2 (Production Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Install dependencies
cd backend && pip install -r requirements.txt && cd ..


# Start all services
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs

# Stop all
pm2 stop all

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/backend-deployment.yaml

kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n clothstore

# View logs
kubectl logs -f deployment/backend -n clothstore

# Scale
kubectl scale deployment/backend --replicas=3 -n clothstore
```

### Manual Setup

**1. Database:**
```bash
# Start MongoDB
mongod --dbpath /data/db
```

**2. Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv/Scripts/activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database URL and secrets


uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**3. Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**4. Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## License

MIT License — Copyright (c) 2026 Humanoid Maker (www.humanoidmaker.com)

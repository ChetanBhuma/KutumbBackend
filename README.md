# Senior Citizen Portal - Backend

Enterprise-grade Node.js/Express backend for Delhi Police Senior Citizen Portal (Kutumb Portal).

## Features

- ✅ TypeScript for type safety
- ✅ Express.js web framework
- ✅ PostgreSQL database with Prisma ORM
- ✅ Redis for caching and sessions
- ✅ JWT authentication
- ✅ OWASP security best practices
- ✅ Winston logging with audit trail
- ✅ Docker containerization
- ✅ API documentation (Swagger)

## Prerequisites

- Node.js 20+ LTS
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# (Optional) Seed database
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## Docker Setup

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop containers
docker-compose down
```

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:5000/api/v1/docs`
- Health Check: `http://localhost:5000/health`

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── tests/               # Test files
├── .env.example         # Environment template
├── Dockerfile           # Docker configuration
├── package.json
└── tsconfig.json
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage

## Security

This backend implements:
- OWASP Top 10 protections
- CERT-In compliance requirements
- Helmet.js security headers
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

## License

UNLICENSED - Delhi Police Internal Use Only

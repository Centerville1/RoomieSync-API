# RoomieSync API

A NestJS backend API for managing shared expenses, payments, and multi-house roommate relationships.

## Features

- 🏠 **Multi-House Support** - Users can join multiple houses with different display names
- 💰 **Expense & Payment Tracking** - Track shared expenses and payments between roommates
- 🧾 **IOU Balance System** - Automatic balance calculation between roommate pairs
- 📊 **Custom Categories** - User-defined expense categories with colors and icons
- 🔐 **JWT Authentication** - Secure email-based authentication
- 📚 **Interactive API Documentation** - Built-in Swagger UI for testing endpoints
- 🐳 **Docker Development** - Containerized PostgreSQL for easy setup

## Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Documentation**: Swagger/OpenAPI
- **Development**: Docker Compose

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Setup & Run

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd RoomieSync-API
   npm run setup
   ```

2. **Start development:**
   ```bash
   npm run dev
   ```

3. **API will be available at:**
   - 🌐 **API Base URL**: http://localhost:3001
   - 📚 **Interactive Docs**: http://localhost:3001/api

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Install dependencies and copy environment file |
| `npm run dev` | Start database and development server |
| `npm run dev:fresh` | Reset database and start fresh development |
| `npm run db:up` | Start PostgreSQL database |
| `npm run db:down` | Stop PostgreSQL database |
| `npm run db:reset` | Reset database with fresh data |
| `npm run db:logs` | View database logs |
| `npm run db:shell` | Access database shell |
| `npm run build` | Build production bundle |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |

## Documentation

- **📋 [API.md](./API.md)** - Complete API reference with examples
- **📚 Interactive Docs** - Visit http://localhost:3001/api when running

### Using Swagger UI

The interactive Swagger documentation provides:
- ✅ **Test Endpoints** - Execute API calls directly from the browser
- 🔐 **Authentication** - Built-in JWT token management
- 📝 **Request/Response Examples** - See exact data formats
- 📊 **Schema Validation** - Real-time input validation

**Getting Started with Swagger:**
1. Visit http://localhost:3001/api
2. Test authentication endpoints (`/auth/register` or `/auth/login`)
3. Copy the JWT token from the response
4. Click **"Authorize"** button and paste: `Bearer <your-token>`
5. Now you can test protected endpoints like `/auth/profile`

## Database Schema

### Core Entities
- **User** - User accounts with email authentication
- **House** - Shared living spaces with invite codes
- **HouseMembership** - User-house relationships with roles
- **Expense** - Shared expenses with split information
- **Payment** - Payments between roommates
- **Balance** - Cached IOU balances between user pairs
- **Category** - Customizable expense categories

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user (optionally join house)
- `POST /auth/login` - Login with email/password
- `GET /auth/profile` - Get current user profile

### Health
- `GET /health` - Service health check
- `GET /` - Welcome message

## Environment Variables

The app uses these environment variables (configured in `.env`):

```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=roomiesync
DB_PASSWORD=password
DB_NAME=roomiesync_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Database Access

### Using External Database Tools

Connect to the PostgreSQL database using any PostgreSQL client:

**Connection Settings:**
- **Host**: `localhost`
- **Port**: `5433`
- **Database**: `roomiesync_db`
- **Username**: `roomiesync`
- **Password**: `password`

**Popular Database Tools:**
- **[pgAdmin](https://www.pgadmin.org/)** - Web-based PostgreSQL administration
- **[TablePlus](https://tableplus.com/)** - Native database client for Mac/Windows
- **[DBeaver](https://dbeaver.io/)** - Free universal database tool
- **[DataGrip](https://www.jetbrains.com/datagrip/)** - JetBrains database IDE
- **[Postico](https://eggerapps.at/postico2/)** - Mac PostgreSQL client

**Quick Connection URL:**
```
postgresql://roomiesync:password@localhost:5433/roomiesync_db
```

### Built-in Database Shell

Access PostgreSQL directly from terminal:
```bash
npm run db:shell
```

This connects you to the `psql` command line interface where you can run SQL queries directly.

## Development Notes

- **Database Port**: Uses port 5433 to avoid conflicts with local PostgreSQL
- **Auto-reload**: Development server watches for TypeScript changes
- **Interactive Testing**: Use Swagger UI at `/api` for endpoint testing
- **Database Management**: Use `npm run db:shell` to access PostgreSQL directly

## Architecture

The app uses a multi-house architecture where:
- Users can join multiple houses with unique display names per house
- Each house has its own expense categories and member relationships
- Balances are calculated and cached between user pairs within each house
- Authentication uses email but houses use display names for privacy

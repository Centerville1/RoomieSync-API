# About RoomieSync

RoomieSync is a mobile-first household management app designed for young professionals, college students, and young families living in shared housing situations. Unlike existing fragmented solutions, RoomieSync combines shopping list management with seamless expense tracking in one intuitive, modern interface.

It's designed to solve a problem I actually have, and to be a great way to learn full-stack mobile app development and deployment while leveraging AI workflows.

AI Assistance Attribution:
This project is largely made feasible as a solo developer by leveraging AI tools and workflows to greatly speed up the development process, allowing me to focus on high level design, product, and feature design rather than spending vast quantities of time on detailed implementation.  All code is reviewed and tested by me, and follows my design and specifications

🤖 Generated in-part with Claude Code

Co-Authored-By: Claude noreply@anthropic.com

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
| `npm run migration:generate <name>` | Generate new migration from entity changes |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:show` | Show migration status |
| `npm run build` | Build production bundle |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |

## Documentation

- **📋 [API.md](./API.md)** - Complete API reference with examples
- **⚙️ [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Environment configuration & deployment guide
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

## Environment Configuration

Environment variables are configured in `.env` files. See **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** for:

- 🔧 **Local development setup**
- 🚀 **Railway production deployment** 
- 🔐 **Secure JWT secret generation**
- 📝 **Complete environment variables reference**

**Quick setup:** `cp .env.example .env` then generate a secure JWT secret.

## Database Management

### Migrations

This project uses TypeORM migrations for database schema management in production. 

**Development Environment:**
- Database tables are automatically created via TypeORM's `synchronize: true` setting
- No migrations needed for local development

**Production Environment:**
- Uses proper database migrations for schema changes
- Migrations run automatically on deployment via `npm run migration:run`

**Migration Commands:**
```bash
# Generate a new migration after changing entities
npm run migration:generate src/migrations/DescriptiveName

# Run pending migrations (done automatically in production)
npm run migration:run

# Show migration status
npm run migration:show

# Revert last migration (if needed)
npm run migration:revert
```

**Migration Workflow:**
1. Make changes to your TypeORM entities
2. Generate migration: `npm run migration:generate src/migrations/YourChangeName`
3. Review the generated migration file
4. Test locally with `npm run migration:run`
5. Deploy to production (migrations run automatically)

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

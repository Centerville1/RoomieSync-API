# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run setup` - Initial setup: install dependencies and copy environment file
- `npm run dev` - Start database and development server (main development command)
- `npm run dev:fresh` - Reset database and start fresh development
- `npm run start:dev` - Start only the NestJS development server (without database)

### Database Management
- `npm run db:up` - Start PostgreSQL database container
- `npm run db:down` - Stop PostgreSQL database
- `npm run db:reset` - Reset database with fresh data (destroys all data)
- `npm run db:shell` - Access PostgreSQL shell for direct SQL queries
- `npm run db:logs` - View database container logs

### Testing & Quality
- `npm run test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint (with auto-fix)
- `npm run format` - Run Prettier formatting
- `npm run build` - Build production bundle

### Production
- `npm run start:prod` - Start production server (requires build first)

## Architecture Overview

RoomieSync API is a NestJS backend for a multi-house roommate management system with the following key architectural concepts:

### Multi-House Architecture
- Users can join multiple houses with unique display names per house
- Each house operates independently with its own expenses, categories, and member relationships
- Authentication uses email but houses use display names for privacy

### Core Domain Models
- **User**: Global user accounts with email authentication
- **House**: Shared living spaces with invite codes and member management
- **HouseMembership**: Junction entity managing user-house relationships with roles and display names
- **Expense**: Shared expenses with configurable split logic between house members
- **Payment**: Direct payments between roommates within a house
- **Balance**: Cached IOU balances calculated between user pairs within each house
- **Category**: User-customizable expense categories with colors and icons
- **Shopping Lists**: House-specific shopping lists with items and assignments

### Technology Stack
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport (local and JWT strategies)
- **Documentation**: Swagger/OpenAPI at `/api`
- **Development Environment**: Docker Compose for PostgreSQL

### Module Structure
```
src/
├── auth/           - JWT authentication, login/register, guards
├── categories/     - Expense category management
├── entities/       - TypeORM entity definitions
├── expenses/       - Expense tracking and splitting logic
├── house-memberships/ - User-house relationship management
├── houses/         - House creation, invite codes, member management
├── payments/       - Payment tracking between roommates
├── shopping-lists/ - Shared shopping list functionality
└── upload/         - File upload services (Cloudinary integration)
```

### Key Development Patterns
- All modules follow NestJS structure: controller, service, module pattern
- Entity relationships use TypeORM decorators for database mapping
- DTOs with class-validator for request validation
- JWT guards protect authenticated endpoints
- Balance calculations are cached and updated via expense/payment operations

### Database Connection
- Development database runs on port 5433 (avoiding conflicts with local PostgreSQL)
- Connection details: `postgresql://roomiesync:password@localhost:5433/roomiesync_db`

### Testing & Documentation
- Interactive API testing available at `http://localhost:3001/api` (Swagger UI)
- Comprehensive API documentation in `API.md`
- JWT token testing workflow built into Swagger interface
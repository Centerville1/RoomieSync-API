# Environment Configuration Guide

## Local Development Setup

### 1. Environment File Setup

```bash
# Copy environment template
cp .env.example .env

# Generate secure JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Copy the output and replace the JWT_SECRET line in .env file
```

### 2. Configure Database (PostgreSQL)

```bash
# Start PostgreSQL (using Docker)
docker run --name roomiesync-postgres \
  -e POSTGRES_USER=roomiesync \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=roomiesync_db \
  -p 5433:5432 \
  -d postgres:15

# Or use local PostgreSQL installation
# createdb roomiesync_db
# createuser roomiesync
```

### 3. Configure Cloudinary (Image Uploads)

```bash
# 1. Sign up for free Cloudinary account at https://cloudinary.com
# 2. Get your credentials from Dashboard > Settings
# 3. Update .env file with your credentials:

CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here  
CLOUDINARY_API_SECRET=your-api-secret-here

# Free tier includes:
# - 25GB storage
# - 25GB monthly bandwidth
# - Automatic image optimization
# - Global CDN delivery
```

### 4. Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev
```

### 5. Verify Setup

```bash
# Test health endpoint
curl http://localhost:3001/health

# Should return: {"status":"ok","timestamp":"...","service":"RoomieSync API"}
```

---

## Railway Production Deployment

### 1. Install Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### 2. Initialize Railway Project

```bash
# In your project directory
railway init

# Link to existing project (if already created)
# railway link [project-id]
```

### 3. Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add postgresql

# Railway automatically provides database variables
```

### 4. Set Environment Variables

```bash
# Generate production JWT secret
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Set production environment
railway variables set NODE_ENV=production
railway variables set PORT=3001

# Set frontend URL (replace with your actual frontend domain)
railway variables set FRONTEND_URL=https://your-frontend-domain.com

# Cloudinary configuration (get from your Cloudinary dashboard)
railway variables set CLOUDINARY_CLOUD_NAME=your-cloud-name
railway variables set CLOUDINARY_API_KEY=your-api-key
railway variables set CLOUDINARY_API_SECRET=your-api-secret

# Database variables (if not using Railway's auto-generated ones)
railway variables set DB_HOST=your-db-host
railway variables set DB_PORT=5432
railway variables set DB_USERNAME=your-db-user
railway variables set DB_PASSWORD=your-db-password
railway variables set DB_NAME=your-db-name
```

### 5. Deploy

```bash
# Deploy to Railway
railway up

# Monitor deployment
railway logs

# Get deployment URL
railway status
```

---

## Environment Variables Reference

| Variable | Local Development | Railway Production |
|----------|------------------|-------------------|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `3001` | `3001` |
| `JWT_SECRET` | Generated 64-byte hex | Generated 64-byte hex |
| `JWT_EXPIRES_IN` | `7d` | `7d` |
| `FRONTEND_URL` | `http://localhost:3000` | `https://yourdomain.com` |
| `DB_HOST` | `localhost` | Railway provided |
| `DB_PORT` | `5433` | `5432` |
| `DB_USERNAME` | `roomiesync` | Railway provided |
| `DB_PASSWORD` | `password` | Railway provided |
| `DB_NAME` | `roomiesync_db` | Railway provided |

---

## Quick Commands Reference

### Local Development
```bash
cp .env.example .env                    # Copy environment template
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # Generate JWT secret
npm install                             # Install dependencies  
npm run start:dev                       # Start development server
curl http://localhost:3001/health       # Test API
```

### Railway Deployment
```bash
railway login                           # Login to Railway
railway init                            # Initialize project
railway add postgresql                  # Add database
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://yourdomain.com
railway up                             # Deploy
```

---

## Security Notes

- ⚠️ **Never commit `.env` files** - they're in `.gitignore`
- 🔐 **Generate unique JWT secrets** for each environment
- 🛡️ **Use strong database passwords** in production
- 🔄 **Rotate JWT secrets regularly** (invalidates all user sessions)
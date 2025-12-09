# Production Setup Guide

## Default Admin Account

The ProsePolish backend automatically creates a default admin account on first deployment to production. This ensures you always have administrative access to the system.

### How It Works

1. **Automatic Creation**: When the production container starts for the first time, it automatically:
   - Runs database migrations
   - Creates a default admin account (if it doesn't already exist)
   - Sets up default user settings for the admin

2. **Idempotent**: The seeding process is safe to run multiple times. If an admin account already exists, it will skip creation and not duplicate data.

3. **Environment-Based Configuration**: Admin credentials are configured via environment variables for security.

## Configuration

### Step 1: Set Up Environment Variables

1. Edit the `.env.production` file in the backend directory:
   ```bash
   # The file is already present at backend/.env.production
   # Update the following values:
   ```

2. Configure the admin account in `.env.production`:
   ```env
   # Admin Account Configuration
   ADMIN_EMAIL=admin@prosepolish.com
   ADMIN_PASSWORD=YourSecureAdminPassword123!
   ADMIN_NAME=System Administrator
   ```

3. **IMPORTANT**: 
   - Use a strong, unique password
   - Change these credentials immediately after first login
   - Never commit `.env.production` with real credentials to version control
   - The Dockerfile automatically copies `.env.production` and renames it to `.env` inside the container

### Step 2: Deploy to Production

Using Docker Compose:

```bash
# Build and start the production containers
# The docker-compose.prod.yml uses .env.production for environment variables
# The Dockerfile copies .env.production as .env inside the container
docker-compose -f docker-compose.prod.yml up -d --build

# Check the logs to verify admin account creation
docker-compose -f docker-compose.prod.yml logs backend
```

You should see output like:
```
🌱 Running production database seeding...
👤 Creating admin user: admin@prosepolish.com...
✅ Admin user created successfully: admin@prosepolish.com
✅ Default settings created for admin user
✨ Production database seeding completed successfully!
```

### Step 3: First Login

1. Log in using your configured admin credentials:
   - Email: The value of `ADMIN_EMAIL` from your `.env.production`
   - Password: The value of `ADMIN_PASSWORD` from your `.env.production`

2. **IMMEDIATELY change the admin password** after first login for security.

## Manual Seeding

If you need to run the production seed script manually:

### Option 1: Using npm script (local development)
```bash
npm run db:seed:prod
```

### Option 2: Inside Docker container
```bash
# Execute inside the running backend container
docker exec prosepolish_backend_prod node dist/prisma/seed.prod.js
```

### Option 3: Using docker-compose
```bash
docker-compose -f docker-compose.prod.yml exec backend node dist/prisma/seed.prod.js
```

## Security Best Practices

1. **Strong Passwords**: 
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and special characters
   - Use a password manager to generate and store

2. **Environment Variables**:
   - Never hardcode credentials in the source code
   - Use `.env.production` for production (not committed to git)
   - Use secrets management in cloud deployments (AWS Secrets Manager, Azure Key Vault, etc.)

3. **Post-Deployment**:
   - Change the default admin password immediately
   - Set up 2FA if available
   - Regularly rotate credentials
   - Monitor admin account activity

4. **Access Control**:
   - Limit who has access to production environment variables
   - Use role-based access control (RBAC)
   - Regularly audit admin accounts

## Troubleshooting

### Admin account not created

1. Check the logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend
   ```

2. Verify environment variables are set:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend env | grep ADMIN
   ```

3. Manually run the seed script:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend node dist/prisma/seed.prod.js
   ```

### Admin account already exists

If you see the message "Admin user already exists", it means the account was already created. You can:

1. Use the existing credentials to log in
2. Reset the password through the application's password reset flow
3. Manually update the password in the database (if you have direct database access)

### Seeding fails during startup

The application will continue to start even if seeding fails. Check:

1. Database connection is working
2. All required environment variables are set
3. Database migrations have run successfully

## Files Reference

- `prisma/seed.prod.ts` - Production seeding script
- `docker/entrypoint.sh` - Production startup script
- `.env.production.example` - Example production environment configuration
- `docker-compose.prod.yml` - Production Docker Compose configuration

## Related Documentation

- [Development Seeding](prisma/seed.ts) - For development and testing
- [Database Migrations](docs/migrations.md) - Database schema changes
- [Deployment Guide](docs/deployment.md) - Full deployment instructions

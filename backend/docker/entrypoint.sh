#!/bin/sh
set -e

echo "========================================="
echo "ProsePolish Backend - Production Startup"
echo "========================================="

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

# Extract database connection details from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

echo "   Checking connection to ${DB_HOST}:${DB_PORT}..."

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # Use nc (netcat) to check if PostgreSQL port is accessible
  if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "   Attempt $RETRY_COUNT/$MAX_RETRIES - Database not ready yet, waiting..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Database failed to become ready after $MAX_RETRIES attempts"
  exit 1
fi

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations completed"

# Run production seeding (creates admin account if it doesn't exist)
echo "🌱 Running production database seeding..."
if [ -f "dist/prisma/seed.prod.js" ]; then
  node dist/prisma/seed.prod.js || {
    echo "⚠️  Seeding failed, but continuing startup..."
    echo "   You may need to create an admin account manually"
  }
else
  echo "⚠️  Compiled seed file not found, skipping seeding..."
  echo "   Run 'npm run db:seed:prod' manually after deployment"
fi

echo "========================================="
echo "🚀 Starting application..."
echo "========================================="

# Execute the main command (passed as arguments to this script)
exec "$@"

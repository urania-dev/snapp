#!/bin/sh

: ${DATABASE_PROVIDER:="sqlite"}
# Determine which schema to use
case "$DATABASE_PROVIDER" in
  "sqlite")
    echo "-- Default SQLITE Provider --"
    cp /app/zenstack/sqlite /app/node_modules/.zenstack -r
    bunx prisma generate --schema /app/dbschema/sqlite/prisma/schema.prisma

    # Extract path from DATABASE_URL (e.g., file:./db.sqlite)
    SQLITE_PATH="/app/dbschema/sqlite/prisma/db.sqlite"

    # Create sqlite file if it doesn't exist
    if [ ! -f "$SQLITE_PATH" ]; then
      echo "SQLite DB file not found at $SQLITE_PATH. Creating it..."
      touch "$SQLITE_PATH"
    fi
    bunx prisma migrate deploy --schema /app/dbschema/sqlite/prisma/schema.prisma
    ;;
  "mysql"|"mariadb")
    echo "######## This Configuration require to regenerate Prisma Client"
    cp /app/zenstack/mysql /app/node_modules/.zenstack -r
    bunx prisma generate --schema /app/dbschema/mysql/prisma/schema.prisma
    bunx prisma migrate deploy --schema /app/dbschema/mysql/prisma/schema.prisma
    ;;
  "postgres")
    echo "######## This Configuration require to regenerate Prisma Client"
    cp /app/zenstack/postgres /app/node_modules/.zenstack -r
    bunx prisma generate --schema /app/dbschema/postgres/prisma/schema.prisma
    bunx prisma migrate deploy --schema /app/dbschema/postgres/prisma/schema.prisma
    ;;
  *)
    echo "Unsupported DATABASE_PROVIDER: $DATABASE_PROVIDER"
    exit 1
    ;;
esac

# Welcome message with formatting
echo "-------------------------------------------"
echo "             Welcome to Snapp!"
echo "-------------------------------------------"
echo ""
echo "      Thank you for choosing this app."
echo ""
echo "      Have a great day and enjoy your"
echo "            experience with us!"
echo ""
echo "-------------------------------------------"

# Run the application
exec "$@"
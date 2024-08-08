#!/bin/sh

: ${DATABASE_PROVIDER:="sqlite"}

# Determine which schema to use
case "$DATABASE_PROVIDER" in
  "mysql")
    npx prisma generate --schema prisma/mysql/schema.prisma
    npx prisma migrate deploy --schema prisma/mysql/schema.prisma
    ;;
  "sqlite")
    npx prisma generate --schema prisma/sqlite/schema.prisma
    npx prisma migrate deploy --schema prisma/sqlite/schema.prisma
    ;;
  "postgres")
    npx prisma generate --schema prisma/postgres/schema.prisma
    npx prisma migrate deploy --schema prisma/postgres/schema.prisma
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

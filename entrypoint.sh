#!/bin/sh
rm prisma/schema.prisma
rm prisma/migrations -rf

: ${DATABASE_PROVIDER:="sqlite"}

# Determine which schema to use
case "$DATABASE_PROVIDER" in
  "mysql")
    cp prisma/schema.mysql.prisma prisma/schema.prisma
    ;;
  "sqlite")
    cp prisma/schema.sqlite.prisma prisma/schema.prisma
    ;;
  "postgres")
    cp prisma/schema.pg.prisma prisma/schema.prisma
    ;;
  *)
    echo "Unsupported DATABASE_PROVIDER: $DATABASE_PROVIDER"
    exit 1
    ;;
esac

# Generate Prisma client and suppress output
npx prisma generate > /dev/null 2>&1

# Apply existing migrations and suppress output
npx prisma migrate dev -n init > /dev/null 2>&1 
npx prisma migrate deploy  > /dev/null 2>&1 

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

# Build stage: install all dependencies and build the application
FROM oven/bun:slim AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN bun install

# Copy the rest of your application code
COPY . .
ENV LOG_LEVEL="debug" \
    HOST=0.0.0.0 \
    ORIGIN=http://localhost:3000 \
    PORT=3000 \
    TOKEN_SECRET=secret \
    ADMIN_USERNAME=admin \
    ADMIN_EMAIL=email@example.com \
    ADMIN_PASSWORD=password \
    ENABLE_SIGNUP=false \
    ENABLED_MFA=false \
    PUBLIC_URL=http://localhost:3000 \
    APPNAME="Snapp.li" \
    PUBLIC_SNAPP_VERSION="0.9-rc"
    
    
# Run build commands
ENV DATABASE_URL=mysql://root:password@localhost:3306/snapp \
    DATABASE_PROVIDER=mysql
RUN bunx zenstack generate --schema dbschema/mysql/schema.zmodel --output /app/zenstack/mysql

ENV DATABASE_URL=postgres://root:password@localhost:5432/snapp \
    DATABASE_PROVIDER=postgres
RUN bunx zenstack generate --schema dbschema/postgres/schema.zmodel --output /app/zenstack/postgres

ENV DATABASE_URL=file:./db.sqlite\
    DATABASE_PROVIDER=sqlite

RUN bunx zenstack generate --schema dbschema/sqlite/schema.zmodel

RUN bunx prisma migrate deploy --schema dbschema/sqlite/prisma/schema.prisma 

RUN bun run build

# Final stage: set up a lean runtime environment and reinstall production dependencies
FROM oven/bun:slim
WORKDIR /app

# Copy the built output (adjust path if necessary)
COPY --from=builder /app/build ./build
COPY --from=builder /app/src ./src
COPY --from=builder /app/dbschema ./dbschema
COPY --from=builder /app/maxmind ./maxmind
COPY --from=builder /app/static ./static
COPY --from=builder /app/zenstack ./zenstack
COPY --from=builder /app/node_modules/.zenstack ./zenstack/sqlite

# Copy package files to reinstall production dependencies
COPY package*.json ./

# Set NODE_ENV to production so that only production dependencies are installed
ENV NODE_ENV=production

# Reinstall production dependencies only
RUN bun install --production

# Copy the entrypoint script and make it executable
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set runtime environment variables
ENV DATABASE_URL=file:./db.sqlite \
    DATABASE_PROVIDER=sqlite \
    LOG_LEVEL="info" \
    HOST=0.0.0.0 \
    ORIGIN=http://localhost:3000 \
    PORT=3000 \
    TOKEN_SECRET=secret \
    ADMIN_USERNAME=admin \
    ADMIN_EMAIL=email@example.com \
    ADMIN_PASSWORD=password \
    ENABLE_SIGNUP=false \
    ENABLED_MFA=false \
    PUBLIC_URL=http://localhost:3000 \
    APPNAME="Snapp.li" \
    PUBLIC_SNAPP_VERSION="0.9-rc"

EXPOSE 3000

ENTRYPOINT ["entrypoint.sh"]
CMD ["bun", "./build"]

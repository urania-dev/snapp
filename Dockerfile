
# Build stage: install all dependencies and bu  ild the application
FROM oven/bun:slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl curl

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN bun install

# Copy the rest of your application code
COPY . .
ENV DATABASE_URL=file:./db.sqlite \
    DATABASE_PROVIDER=sqlite \
    LOG_LEVEL="debug" \
    HOST=0.0.0.0 \
    ORIGIN=http://localhost:3000 \
    PORT=3000 \
    ADMIN_USERNAME=admin \
    ADMIN_EMAIL=email@example.com \
    ENABLE_SIGNUP=false \
    ENABLED_MFA=false \
    PUBLIC_URL=http://localhost:3000 \
    PUBLIC_EXTRA_GROUPS_EDITABLE=false \
    URLS_VIA_GROUPS_ONLY=false \
    APPNAME="Snapp.li" \
    PUBLIC_SNAPP_VERSION="0.9-rc-026"
    
# Run build commands
ENV DATABASE_URL=mysql://root:password@localhost:3306/snapp \
    DATABASE_PROVIDER=mysql
RUN bunx zenstack generate --schema dbschema/mysql/schema.zmodel --output /app/zenstack/mysql 

ENV DATABASE_URL=postgres://root:password@localhost:5432/snapp \
    DATABASE_PROVIDER=postgres
RUN bunx zenstack generate --schema dbschema/postgres/schema.zmodel --output /app/zenstack/postgres 

ENV DATABASE_URL=file:./dev.sqlite\
    DATABASE_PROVIDER=sqlite 
RUN bunx zenstack generate --schema dbschema/sqlite/schema.zmodel 
RUN bunx zenstack generate --schema dbschema/sqlite/schema.zmodel --output /app/zenstack/sqlite 


RUN bunx prisma migrate deploy --schema dbschema/sqlite/prisma/schema.prisma 
RUN --mount=type=secret,id=ADMIN_PASSWORD \
    --mount=type=secret,id=TOKEN_SECRET \
    --mount=type=secret,id=DISABLED_EMAIL_AND_PASSWORD \
    ADMIN_PASSWORD=$(cat /run/secrets/ADMIN_PASSWORD) \
    TOKEN_SECRET=$(cat /run/secrets/TOKEN_SECRET) \
    DISABLED_EMAIL_AND_PASSWORD=$(cat /run/secrets/DISABLED_EMAIL_AND_PASSWORD) \
    bun run build
RUN touch /app/dbschema/sqlite/prisma/db.sqlite
# Final stage: set up a lean runtime environment and reinstall production dependencies
FROM oven/bun:slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl curl


# Copy the built output (adjust path if necessary)
COPY --from=builder /app/build ./build
COPY --from=builder /app/output ./output
COPY --from=builder /app/smtp.config.cjs ./smtp.config.cjs
COPY --from=builder /app/src ./src
COPY --from=builder /app/dbschema ./dbschema
COPY --from=builder /app/maxmind ./maxmind
COPY --from=builder /app/static ./static
COPY --from=builder /app/zenstack ./zenstack

# Copy package files to reinstall production dependencies
COPY package*.json ./

# Set NODE_ENV to production so that only production dependencies are installed
ENV NODE_ENV=production

# Reinstall production dependencies only
RUN bun install --production

# Copy the entrypoint script and make it executable
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
RUN rm /app/dbschema/sqlite/prisma/dev.sqlite
RUN rm /app/dbschema/sqlite/prisma/db.sqlite
RUN touch /app/dbschema/sqlite/prisma/db.sqlite

# Set runtime environment variables
ENV DATABASE_URL=file:./db.sqlite \
    DATABASE_PROVIDER=sqlite \
    LOG_LEVEL="info" \
    HOST=0.0.0.0 \
    ORIGIN=http://localhost:3000 \
    PORT=3000 \
    ADMIN_USERNAME=admin \
    ADMIN_EMAIL=email@example.org \
    ENABLE_SIGNUP=false \
    ENABLED_MFA=false \
    PUBLIC_URL=http://localhost:3000 \
    URLS_VIA_GROUPS_ONLY=false \
    PUBLIC_EXTRA_GROUPS_EDITABLE=false \
    APPNAME="Snapp.li" \
    PUBLIC_SNAPP_VERSION="0.9-rc-026"

EXPOSE 3000
    
ENTRYPOINT ["entrypoint.sh"]
CMD ["bun", "./build"]


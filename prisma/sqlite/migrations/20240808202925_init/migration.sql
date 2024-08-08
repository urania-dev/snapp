-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notes" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "password_reset" (
    "token_hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "userId" TEXT,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tokens" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vtapicache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "domain" TEXT NOT NULL,
    "result" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT,
    "domain" TEXT,
    "allowed" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "snapps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shortcode" TEXT NOT NULL,
    "original_url" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "secret" TEXT,
    "max_usages" INTEGER NOT NULL DEFAULT -1,
    "hit" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "expiration" DATETIME,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    CONSTRAINT "snapps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snappId" TEXT NOT NULL,
    "snappUserId" TEXT NOT NULL,
    "language" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,
    "device" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "cpu" TEXT,
    CONSTRAINT "usages_snappUserId_fkey" FOREIGN KEY ("snappUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "usages_snappId_fkey" FOREIGN KEY ("snappId") REFERENCES "snapps" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_hash_key" ON "password_reset"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_userId_idx" ON "password_reset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_id_key" ON "settings"("id");

-- CreateIndex
CREATE INDEX "settings_field_idx" ON "settings"("field");

-- CreateIndex
CREATE INDEX "settings_field_userId_idx" ON "settings"("field", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vtapicache_domain_key" ON "Vtapicache"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "snapps_shortcode_key" ON "snapps"("shortcode");

-- CreateIndex
CREATE INDEX "snapps_shortcode_idx" ON "snapps"("shortcode");

-- CreateIndex
CREATE INDEX "snapps_created_idx" ON "snapps"("created");

-- CreateIndex
CREATE INDEX "snapps_shortcode_created_idx" ON "snapps"("shortcode", "created");

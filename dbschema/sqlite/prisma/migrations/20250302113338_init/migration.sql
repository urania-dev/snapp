-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "notes" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tfs" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "tfs" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "passwordresets" (
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL PRIMARY KEY,
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
CREATE TABLE "token" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "snapps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shortcode" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    "utmParams" TEXT DEFAULT '[]',
    "secret" TEXT,
    "maxUsages" INTEGER NOT NULL DEFAULT -1,
    "hit" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT "snapps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "snapps_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("slug") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snappId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "language" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "device" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "cpu" TEXT,
    CONSTRAINT "usages_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "usages_snappId_fkey" FOREIGN KEY ("snappId") REFERENCES "snapps" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "groups" (
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL PRIMARY KEY,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "vtapicaches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "domain" TEXT NOT NULL,
    "result" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT,
    "domain" TEXT,
    "allowed" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "_snapptags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_snapptags_A_fkey" FOREIGN KEY ("A") REFERENCES "snapps" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_snapptags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_membership" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_membership_A_fkey" FOREIGN KEY ("A") REFERENCES "groups" ("slug") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_membership_B_fkey" FOREIGN KEY ("B") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "passwordresets_tokenHash_key" ON "passwordresets"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "settings_id_key" ON "settings"("id");

-- CreateIndex
CREATE INDEX "settings_field_idx" ON "settings"("field");

-- CreateIndex
CREATE INDEX "settings_field_userId_idx" ON "settings"("field", "userId");

-- CreateIndex
CREATE INDEX "settings_userId_idx" ON "settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "snapps_shortcode_key" ON "snapps"("shortcode");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "groups_slug_key" ON "groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vtapicaches_domain_key" ON "vtapicaches"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "_snapptags_AB_unique" ON "_snapptags"("A", "B");

-- CreateIndex
CREATE INDEX "_snapptags_B_index" ON "_snapptags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_membership_AB_unique" ON "_membership"("A", "B");

-- CreateIndex
CREATE INDEX "_membership_B_index" ON "_membership"("B");

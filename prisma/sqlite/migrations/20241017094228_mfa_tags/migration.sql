-- AlterTable
ALTER TABLE "users" ADD COLUMN "two_factor_secret" TEXT;

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "_snapp_tags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_snapp_tags_A_fkey" FOREIGN KEY ("A") REFERENCES "snapps" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_snapp_tags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_user_tags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_user_tags_A_fkey" FOREIGN KEY ("A") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_user_tags_B_fkey" FOREIGN KEY ("B") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "two_factor_verified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sessions" ("expiresAt", "id", "userId") SELECT "expiresAt", "id", "userId" FROM "sessions";
DROP TABLE "sessions";
ALTER TABLE "new_sessions" RENAME TO "sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_snapp_tags_AB_unique" ON "_snapp_tags"("A", "B");

-- CreateIndex
CREATE INDEX "_snapp_tags_B_index" ON "_snapp_tags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_user_tags_AB_unique" ON "_user_tags"("A", "B");

-- CreateIndex
CREATE INDEX "_user_tags_B_index" ON "_user_tags"("B");

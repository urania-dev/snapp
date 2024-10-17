-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "two_factor_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "two_factor_secret" TEXT;

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_snapp_tags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_user_tags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_notes_key" ON "tags"("notes");

-- CreateIndex
CREATE UNIQUE INDEX "_snapp_tags_AB_unique" ON "_snapp_tags"("A", "B");

-- CreateIndex
CREATE INDEX "_snapp_tags_B_index" ON "_snapp_tags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_user_tags_AB_unique" ON "_user_tags"("A", "B");

-- CreateIndex
CREATE INDEX "_user_tags_B_index" ON "_user_tags"("B");

-- AddForeignKey
ALTER TABLE "_snapp_tags" ADD CONSTRAINT "_snapp_tags_A_fkey" FOREIGN KEY ("A") REFERENCES "snapps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_snapp_tags" ADD CONSTRAINT "_snapp_tags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_user_tags" ADD CONSTRAINT "_user_tags_A_fkey" FOREIGN KEY ("A") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_user_tags" ADD CONSTRAINT "_user_tags_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

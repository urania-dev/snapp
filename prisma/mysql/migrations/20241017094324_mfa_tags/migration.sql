-- AlterTable
ALTER TABLE `sessions` ADD COLUMN `two_factor_verified` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `snapps` ADD COLUMN `tagId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `two_factor_secret` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `prefixes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `prefixes_name_key`(`name`),
    UNIQUE INDEX `prefixes_slug_key`(`slug`),
    UNIQUE INDEX `prefixes_notes_key`(`notes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_snapp_tags` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_snapp_tags_AB_unique`(`A`, `B`),
    INDEX `_snapp_tags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_user_tags` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_user_tags_AB_unique`(`A`, `B`),
    INDEX `_user_tags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_snapp_tags` ADD CONSTRAINT `_snapp_tags_A_fkey` FOREIGN KEY (`A`) REFERENCES `snapps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_snapp_tags` ADD CONSTRAINT `_snapp_tags_B_fkey` FOREIGN KEY (`B`) REFERENCES `prefixes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_user_tags` ADD CONSTRAINT `_user_tags_A_fkey` FOREIGN KEY (`A`) REFERENCES `prefixes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_user_tags` ADD CONSTRAINT `_user_tags_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[renewalOfSubscriptionId]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `subscriptions` ADD COLUMN `renewalOfSubscriptionId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `subscriptions_renewalOfSubscriptionId_key` ON `subscriptions`(`renewalOfSubscriptionId`);

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_renewalOfSubscriptionId_fkey` FOREIGN KEY (`renewalOfSubscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

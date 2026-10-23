-- AlterTable
ALTER TABLE `subscriptions` ADD COLUMN `scheduledPlanId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `subscriptions_scheduledPlanId_idx` ON `subscriptions`(`scheduledPlanId`);

-- CreateIndex
CREATE INDEX `subscriptions_status_currentPeriodEnd_idx` ON `subscriptions`(`status`, `currentPeriodEnd`);

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_scheduledPlanId_fkey` FOREIGN KEY (`scheduledPlanId`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

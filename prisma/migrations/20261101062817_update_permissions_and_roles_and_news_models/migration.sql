-- AlterTable
ALTER TABLE `subscriptions` MODIFY `restaurantId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `promotion_categories` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `promotion_categories_code_key`(`code`),
    INDEX `promotion_categories_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotions` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `name` VARCHAR(150) NOT NULL,
    `shortDescription` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `termsAndConditions` TEXT NULL,
    `type` ENUM('PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'TWO_FOR_ONE', 'FREE_PRODUCT', 'SPECIAL_COMBO', 'SPECIAL_PRICE', 'EXCLUSIVE_BENEFIT') NOT NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'EXHAUSTED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `discountPercentage` DECIMAL(5, 2) NULL,
    `discountAmount` DECIMAL(12, 2) NULL,
    `promotionalPrice` DECIMAL(12, 2) NULL,
    `benefitDescription` VARCHAR(500) NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `timezone` VARCHAR(100) NOT NULL DEFAULT 'America/Bogota',
    `coverImageUrl` VARCHAR(500) NULL,
    `globalRedemptionsCount` INTEGER NOT NULL DEFAULT 0,
    `minimumPurchaseAmount` DECIMAL(12, 2) NULL,
    `isCombinable` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `promotions_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `promotions_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `promotions_categoryId_idx`(`categoryId`),
    INDEX `promotions_startsAt_endsAt_idx`(`startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotion_restaurants` (
    `id` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `promotion_restaurants_restaurantId_idx`(`restaurantId`),
    UNIQUE INDEX `promotion_restaurants_promotionId_restaurantId_key`(`promotionId`, `restaurantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotion_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startsAt` VARCHAR(5) NOT NULL,
    `endsAt` VARCHAR(5) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `promotion_schedules_promotionId_dayOfWeek_isActive_idx`(`promotionId`, `dayOfWeek`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotion_usage_rules` (
    `id` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NOT NULL,
    `maxGlobalRedemptions` INTEGER NULL,
    `maxRedemptionsPerCustomer` INTEGER NULL,
    `frequency` ENUM('ONCE', 'DAILY', 'WEEKLY', 'CALENDAR_MONTH', 'EVERY_N_DAYS', 'UNLIMITED') NOT NULL DEFAULT 'UNLIMITED',
    `intervalDays` INTEGER NULL,
    `monthlyPeriod` ENUM('CALENDAR_MONTH', 'ROLLING_DAYS') NULL,
    `inventoryLimit` INTEGER NULL,
    `minimumPurchaseAmount` DECIMAL(12, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `promotion_usage_rules_promotionId_key`(`promotionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotion_images` (
    `id` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `storageKey` VARCHAR(255) NULL,
    `altText` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `promotion_images_promotionId_sortOrder_idx`(`promotionId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(30) NULL,
    `birthDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    `marketingConsent` BOOLEAN NOT NULL DEFAULT false,
    `marketingConsentAt` DATETIME(3) NULL,
    `privacyAcceptedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `customers_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `customers_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `customers_birthDate_idx`(`birthDate`),
    UNIQUE INDEX `customers_organizationId_email_key`(`organizationId`, `email`),
    UNIQUE INDEX `customers_organizationId_phone_key`(`organizationId`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_segments` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(500) NULL,
    `type` ENUM('STATIC', 'DYNAMIC') NOT NULL DEFAULT 'STATIC',
    `rules` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `customer_segments_organizationId_isActive_idx`(`organizationId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_segment_members` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `segmentId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `customer_segment_members_segmentId_idx`(`segmentId`),
    UNIQUE INDEX `customer_segment_members_customerId_segmentId_key`(`customerId`, `segmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotion_segments` (
    `id` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NOT NULL,
    `segmentId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `promotion_segments_segmentId_idx`(`segmentId`),
    UNIQUE INDEX `promotion_segments_promotionId_segmentId_key`(`promotionId`, `segmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `redemption_intents` (
    `id` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'VALIDATED', 'CONSUMED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `validatedAt` DATETIME(3) NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `redemption_intents_customerId_status_idx`(`customerId`, `status`),
    INDEX `redemption_intents_promotionId_status_idx`(`promotionId`, `status`),
    INDEX `redemption_intents_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `redemption_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `intentId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `redemption_tokens_intentId_key`(`intentId`),
    UNIQUE INDEX `redemption_tokens_tokenHash_key`(`tokenHash`),
    INDEX `redemption_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotion_redemptions` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `intentId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `status` ENUM('CONFIRMED', 'REVERSED') NOT NULL DEFAULT 'CONFIRMED',
    `redeemedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `reversedAt` DATETIME(3) NULL,
    `reversedById` VARCHAR(191) NULL,
    `reversalReason` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `promotion_redemptions_intentId_key`(`intentId`),
    UNIQUE INDEX `promotion_redemptions_idempotencyKey_key`(`idempotencyKey`),
    INDEX `promotion_redemptions_organizationId_redeemedAt_idx`(`organizationId`, `redeemedAt`),
    INDEX `promotion_redemptions_promotionId_redeemedAt_idx`(`promotionId`, `redeemedAt`),
    INDEX `promotion_redemptions_customerId_redeemedAt_idx`(`customerId`, `redeemedAt`),
    INDEX `promotion_redemptions_restaurantId_redeemedAt_idx`(`restaurantId`, `redeemedAt`),
    INDEX `promotion_redemptions_employeeId_redeemedAt_idx`(`employeeId`, `redeemedAt`),
    INDEX `promotion_redemptions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyalty_programs` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `pointsPerVisit` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `loyalty_programs_organizationId_status_idx`(`organizationId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyalty_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `pointsBalance` INTEGER NOT NULL DEFAULT 0,
    `level` VARCHAR(50) NULL,

    INDEX `loyalty_accounts_customerId_idx`(`customerId`),
    UNIQUE INDEX `loyalty_accounts_programId_customerId_key`(`programId`, `customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyalty_rewards` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `type` ENUM('DISCOUNT', 'FREE_PRODUCT', 'SPECIAL_BENEFIT', 'CUSTOM') NOT NULL,
    `requiredPoints` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `loyalty_rewards_programId_isActive_idx`(`programId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyalty_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `rewardId` VARCHAR(191) NULL,
    `type` ENUM('EARN', 'REDEEM', 'EXPIRE', 'ADJUSTMENT', 'REVERSAL') NOT NULL,
    `points` INTEGER NOT NULL,
    `description` VARCHAR(255) NULL,
    `referenceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `loyalty_transactions_accountId_createdAt_idx`(`accountId`, `createdAt`),
    INDEX `loyalty_transactions_referenceId_idx`(`referenceId`),
    INDEX `loyalty_transactions_rewardId_idx`(`rewardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotion_audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(100) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `previousData` JSON NULL,
    `newData` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `promotion_audit_logs_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `promotion_audit_logs_promotionId_createdAt_idx`(`promotionId`, `createdAt`),
    INDEX `promotion_audit_logs_actorId_createdAt_idx`(`actorId`, `createdAt`),
    INDEX `promotion_audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `promotions` ADD CONSTRAINT `promotions_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotions` ADD CONSTRAINT `promotions_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `promotion_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotions` ADD CONSTRAINT `promotions_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotions` ADD CONSTRAINT `promotions_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_restaurants` ADD CONSTRAINT `promotion_restaurants_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_restaurants` ADD CONSTRAINT `promotion_restaurants_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_schedules` ADD CONSTRAINT `promotion_schedules_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_usage_rules` ADD CONSTRAINT `promotion_usage_rules_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_images` ADD CONSTRAINT `promotion_images_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_segments` ADD CONSTRAINT `customer_segments_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_segment_members` ADD CONSTRAINT `customer_segment_members_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_segment_members` ADD CONSTRAINT `customer_segment_members_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `customer_segments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_segments` ADD CONSTRAINT `promotion_segments_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_segments` ADD CONSTRAINT `promotion_segments_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `customer_segments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redemption_intents` ADD CONSTRAINT `redemption_intents_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redemption_intents` ADD CONSTRAINT `redemption_intents_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redemption_tokens` ADD CONSTRAINT `redemption_tokens_intentId_fkey` FOREIGN KEY (`intentId`) REFERENCES `redemption_intents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_redemptions` ADD CONSTRAINT `promotion_redemptions_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_redemptions` ADD CONSTRAINT `promotion_redemptions_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_redemptions` ADD CONSTRAINT `promotion_redemptions_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_redemptions` ADD CONSTRAINT `promotion_redemptions_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_redemptions` ADD CONSTRAINT `promotion_redemptions_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_redemptions` ADD CONSTRAINT `promotion_redemptions_reversedById_fkey` FOREIGN KEY (`reversedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_redemptions` ADD CONSTRAINT `promotion_redemptions_intentId_fkey` FOREIGN KEY (`intentId`) REFERENCES `redemption_intents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_programs` ADD CONSTRAINT `loyalty_programs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_accounts` ADD CONSTRAINT `loyalty_accounts_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `loyalty_programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_accounts` ADD CONSTRAINT `loyalty_accounts_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_rewards` ADD CONSTRAINT `loyalty_rewards_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `loyalty_programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_transactions` ADD CONSTRAINT `loyalty_transactions_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `loyalty_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_transactions` ADD CONSTRAINT `loyalty_transactions_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `loyalty_rewards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_audit_logs` ADD CONSTRAINT `promotion_audit_logs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_audit_logs` ADD CONSTRAINT `promotion_audit_logs_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_audit_logs` ADD CONSTRAINT `promotion_audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

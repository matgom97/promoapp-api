-- ============================================================

-- 1. CREATE ORGANIZATIONS

-- ============================================================

CREATE TABLE `organizations` (

    `id` VARCHAR(191) NOT NULL,

    `name` VARCHAR(150) NOT NULL,

    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',

    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `organizations_status_idx` (`status`),

    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================

-- 2. CREATE ORGANIZATION MEMBERS

-- ============================================================

CREATE TABLE `organization_members` (

    `id` VARCHAR(191) NOT NULL,

    `userId` VARCHAR(191) NOT NULL,

    `organizationId` VARCHAR(191) NOT NULL,

    `role` ENUM('OWNER', 'ADMIN', 'MANAGER', 'STAFF') NOT NULL DEFAULT 'STAFF',

    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organization_members_userId_organizationId_key` (`userId`, `organizationId`),

    INDEX `organization_members_organizationId_role_idx` (`organizationId`, `role`),

    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================

-- 3. ADD NULLABLE ORGANIZATION REFERENCES

-- ============================================================

ALTER TABLE `restaurants`

    ADD COLUMN `organizationId` VARCHAR(191) NULL;

ALTER TABLE `subscriptions`

    ADD COLUMN `organizationId` VARCHAR(191) NULL;

ALTER TABLE `roles`

    ADD COLUMN `organizationId` VARCHAR(191) NULL;

-- ============================================================

-- 4. CREATE ONE ORGANIZATION PER EXISTING RESTAURANT

-- ============================================================

INSERT INTO `organizations` (

    `id`, `name`, `status`, `createdAt`, `updatedAt`

)

SELECT

    CONCAT('org_', r.`id`),

    r.`name`,

    r.`status`,

    CURRENT_TIMESTAMP(3),

    CURRENT_TIMESTAMP(3)

FROM `restaurants` r;

-- ============================================================

-- 5. ASSIGN RESTAURANTS TO ORGANIZATIONS

-- ============================================================

UPDATE `restaurants`

SET `organizationId` = CONCAT('org_', `id`);

-- ============================================================

-- 6. ASSIGN SUBSCRIPTIONS TO ORGANIZATIONS

-- PRESERVE restaurantId AND ITS EXISTING FOREIGN KEY

-- ============================================================

UPDATE `subscriptions`

SET `organizationId` = CONCAT('org_', `restaurantId`);

-- ============================================================

-- 7. CREATE ORGANIZATION MEMBERS FROM EXISTING OWNERS

-- ============================================================

INSERT INTO `organization_members` (

    `id`, `userId`, `organizationId`, `role`, `createdAt`, `updatedAt`

)

SELECT

    CONCAT('orgmem_', rm.`id`),

    rm.`userId`,

    CONCAT('org_', rm.`restaurantId`),

    'OWNER',

    CURRENT_TIMESTAMP(3),

    CURRENT_TIMESTAMP(3)

FROM `restaurant_members` rm

WHERE rm.`role` = 'OWNER';

-- ============================================================

-- 8. ADD INDEXES

-- ============================================================

CREATE INDEX `restaurants_organizationId_idx`

    ON `restaurants` (`organizationId`);

CREATE INDEX `subscriptions_organizationId_status_idx`

    ON `subscriptions` (`organizationId`, `status`);

CREATE INDEX `roles_organizationId_isActive_idx`

    ON `roles` (`organizationId`, `isActive`);

CREATE UNIQUE INDEX `roles_organizationId_code_key`
    ON `roles` (`organizationId`, `code`);

-- ============================================================

-- 9. ADD FOREIGN KEYS

-- ============================================================

ALTER TABLE `organization_members`

    ADD CONSTRAINT `organization_members_userId_fkey`

    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)

    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_members`

    ADD CONSTRAINT `organization_members_organizationId_fkey`

    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`)

    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `restaurants`

    ADD CONSTRAINT `restaurants_organizationId_fkey`

    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`)

    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `subscriptions`

    ADD CONSTRAINT `subscriptions_organizationId_fkey`

    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`)

    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `roles`

    ADD CONSTRAINT `roles_organizationId_fkey`

    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`)

    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================

-- 10. MAKE ORGANIZATION REFERENCES REQUIRED

-- ============================================================

ALTER TABLE `restaurants`

    MODIFY COLUMN `organizationId` VARCHAR(191) NOT NULL;

ALTER TABLE `subscriptions`

    MODIFY COLUMN `organizationId` VARCHAR(191) NOT NULL;


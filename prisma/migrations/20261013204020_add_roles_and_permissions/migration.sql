-- AlterTable
ALTER TABLE `restaurant_members` ADD COLUMN `roleId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `restaurantId` VARCHAR(191) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `roles_restaurantId_isActive_idx`(`restaurantId`, `isActive`),
    UNIQUE INDEX `roles_restaurantId_code_key`(`restaurantId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(255) NULL,
    `module` VARCHAR(50) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_module_isActive_idx`(`module`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `role_permissions_permissionId_idx`(`permissionId`),
    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `restaurant_members_roleId_idx` ON `restaurant_members`(`roleId`);

-- AddForeignKey
ALTER TABLE `restaurant_members` ADD CONSTRAINT `restaurant_members_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- SEED SYSTEM ROLES
-- ============================================================

INSERT INTO `roles` (
    `id`,
    `code`,
    `name`,
    `description`,
    `restaurantId`,
    `isSystem`,
    `isDefault`,
    `isActive`,
    `createdAt`,
    `updatedAt`
)
VALUES
    (
        'system_role_owner',
        'OWNER',
        'Propietario',
        'Propietario del restaurante',
        NULL,
        TRUE,
        FALSE,
        TRUE,
        CURRENT_TIMESTAMP(3),
        CURRENT_TIMESTAMP(3)
    ),
    (
        'system_role_admin',
        'ADMIN',
        'Administrador',
        'Administrador del restaurante',
        NULL,
        TRUE,
        FALSE,
        TRUE,
        CURRENT_TIMESTAMP(3),
        CURRENT_TIMESTAMP(3)
    ),
    (
        'system_role_manager',
        'MANAGER',
        'Gerente',
        'Gerente del restaurante',
        NULL,
        TRUE,
        FALSE,
        TRUE,
        CURRENT_TIMESTAMP(3),
        CURRENT_TIMESTAMP(3)
    ),
    (
        'system_role_staff',
        'STAFF',
        'Empleado',
        'Empleado del restaurante',
        NULL,
        TRUE,
        FALSE,
        TRUE,
        CURRENT_TIMESTAMP(3),
        CURRENT_TIMESTAMP(3)
    );

-- ============================================================
-- MIGRATE EXISTING MEMBERSHIPS
-- ============================================================

UPDATE `restaurant_members`
SET `roleId` = CASE `role`
    WHEN 'OWNER' THEN 'system_role_owner'
    WHEN 'ADMIN' THEN 'system_role_admin'
    WHEN 'MANAGER' THEN 'system_role_manager'
    WHEN 'STAFF' THEN 'system_role_staff'
END
WHERE `roleId` IS NULL;
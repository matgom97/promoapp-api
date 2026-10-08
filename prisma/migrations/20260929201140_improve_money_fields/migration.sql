/*
  Warnings:

  - You are about to drop the column `amountInCents` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `priceInCents` on the `plans` table. All the data in the column will be lost.
  - Added the required column `amount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceAmount` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `payments` DROP COLUMN `amountInCents`,
    ADD COLUMN `amount` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `plans` DROP COLUMN `priceInCents`,
    ADD COLUMN `priceAmount` BIGINT NOT NULL;

/*
  Warnings:

  - You are about to drop the column `siteUrl` on the `Submission` table. All the data in the column will be lost.
  - Added the required column `afterUrl` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `beforeUrl` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "siteUrl",
ADD COLUMN     "afterUrl" TEXT NOT NULL,
ADD COLUMN     "auditError" TEXT,
ADD COLUMN     "auditedAt" TIMESTAMP(3),
ADD COLUMN     "beforeUrl" TEXT NOT NULL,
ALTER COLUMN "beforeScreenshotUrl" DROP NOT NULL,
ALTER COLUMN "afterScreenshotUrl" DROP NOT NULL;

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('draft', 'submitted', 'needs_changes', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "hcaSub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slackId" TEXT,
    "isReviewer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "diffUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "beforeScreenshotUrl" TEXT NOT NULL,
    "afterScreenshotUrl" TEXT NOT NULL,
    "beforeAuditScore" DOUBLE PRECISION,
    "afterAuditScore" DOUBLE PRECISION,
    "auditDetails" JSONB,
    "hoursClaimed" DOUBLE PRECISION NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'submitted',
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_hcaSub_key" ON "User"("hcaSub");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

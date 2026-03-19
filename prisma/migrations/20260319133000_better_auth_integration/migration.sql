-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedBoolean" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill boolean email verification from legacy timestamp.
UPDATE "User"
SET "emailVerifiedBoolean" = true
WHERE "emailVerified" IS NOT NULL;

-- Backfill Better Auth credential accounts from legacy password hashes.
INSERT INTO "Account" (
  "id",
  "userId",
  "type",
  "provider",
  "providerAccountId",
  "password",
  "createdAt",
  "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || u."id"),
  u."id",
  'credentials',
  'credential',
  u."id",
  u."passwordHash",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User" u
WHERE
  u."passwordHash" IS NOT NULL
  AND u."email" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Account" a
    WHERE a."provider" = 'credential'
      AND a."providerAccountId" = u."id"
  );

-- Backfill primary key for legacy verification rows.
UPDATE "VerificationToken"
SET "id" = md5(random()::text || clock_timestamp()::text || "identifier" || "token")
WHERE "id" IS NULL;

ALTER TABLE "VerificationToken"
ALTER COLUMN "id" SET NOT NULL;

ALTER TABLE "VerificationToken"
ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id");

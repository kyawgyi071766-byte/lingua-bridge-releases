CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "plan" TEXT NOT NULL DEFAULT 'free',
  "emailVerifiedAt" TIMESTAMP(3),
  "verificationTokenHash" TEXT,
  "verificationExpiresAt" TIMESTAMP(3),
  "resetTokenHash" TEXT,
  "resetExpiresAt" TIMESTAMP(3),
  "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "usageChars" INTEGER NOT NULL DEFAULT 0,
  "usageResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportedApp" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "color" TEXT NOT NULL DEFAULT '#2563eb',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportedApp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_verificationTokenHash_key" ON "User"("verificationTokenHash");
CREATE UNIQUE INDEX "User_resetTokenHash_key" ON "User"("resetTokenHash");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");

CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'confirmed', 'failed');

ALTER TABLE "User"
  ADD COLUMN "paidUntil" TIMESTAMP(3),
  ADD COLUMN "suspended" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "chain" TEXT NOT NULL,
  "txHash" TEXT,
  "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  "matchKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Payment_txHash_key" ON "Payment"("txHash");
CREATE UNIQUE INDEX "Payment_matchKey_key" ON "Payment"("matchKey");
CREATE INDEX "Payment_userId_status_claimedAt_idx" ON "Payment"("userId", "status", "claimedAt");
CREATE INDEX "Payment_chain_status_claimedAt_idx" ON "Payment"("chain", "status", "claimedAt");

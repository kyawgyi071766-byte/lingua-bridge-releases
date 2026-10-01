ALTER TABLE "Payment"
  ADD COLUMN "receipt_hash" TEXT,
  ADD COLUMN "receipt_status" TEXT,
  ADD COLUMN "receipt_review" JSONB,
  ADD COLUMN "receipt_submitted_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "Payment_receipt_hash_key" ON "Payment"("receipt_hash");

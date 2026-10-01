-- Lingua Access Code + owner dashboard activity fields
ALTER TABLE "User"
  ADD COLUMN "grant_type" TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN "access_code_id" TEXT,
  ADD COLUMN "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Preserve existing paid customers as purchase grants.
UPDATE "User"
SET "grant_type" = CASE WHEN "plan" <> 'free' THEN 'purchase' ELSE 'free' END;

CREATE TABLE "access_codes" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "encrypted_code" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "max_uses" INTEGER NOT NULL DEFAULT 1,
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "expires_at" TIMESTAMP(3),
  "created_by" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "access_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "access_codes_code_key" ON "access_codes"("code");
CREATE INDEX "access_codes_is_active_expires_at_idx" ON "access_codes"("is_active", "expires_at");

CREATE TABLE "access_code_redemptions" (
  "id" TEXT NOT NULL,
  "access_code_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3),
  "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "access_code_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "access_code_redemptions_access_code_id_user_id_key"
  ON "access_code_redemptions"("access_code_id", "user_id");
CREATE INDEX "access_code_redemptions_user_id_redeemed_at_idx"
  ON "access_code_redemptions"("user_id", "redeemed_at");

ALTER TABLE "User"
  ADD CONSTRAINT "User_access_code_id_fkey"
  FOREIGN KEY ("access_code_id") REFERENCES "access_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_code_redemptions"
  ADD CONSTRAINT "access_code_redemptions_access_code_id_fkey"
  FOREIGN KEY ("access_code_id") REFERENCES "access_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_code_redemptions"
  ADD CONSTRAINT "access_code_redemptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

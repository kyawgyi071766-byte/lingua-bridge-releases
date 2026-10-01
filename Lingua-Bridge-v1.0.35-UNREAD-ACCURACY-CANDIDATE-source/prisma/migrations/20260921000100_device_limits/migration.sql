-- Lingua server-side device limits. Device fingerprints are never stored raw.
CREATE TABLE "user_devices" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "fingerprint_hash" TEXT NOT NULL,
  "device_name" TEXT NOT NULL,
  "device_type" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "app_version" TEXT,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_devices_user_id_fingerprint_hash_key"
  ON "user_devices"("user_id", "fingerprint_hash");
CREATE INDEX "user_devices_user_id_revoked_at_last_seen_at_idx"
  ON "user_devices"("user_id", "revoked_at", "last_seen_at");

ALTER TABLE "user_devices"
  ADD CONSTRAINT "user_devices_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

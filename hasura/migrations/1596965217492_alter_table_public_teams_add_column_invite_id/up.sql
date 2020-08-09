CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE "public"."teams" ADD COLUMN "invite_id" uuid NOT NULL DEFAULT gen_random_uuid();

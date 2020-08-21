
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."directory"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz, "title" text NOT NULL DEFAULT '"Untitled"', PRIMARY KEY ("id") , UNIQUE ("id"));
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_directory_updated_at"
BEFORE UPDATE ON "public"."directory"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_directory_updated_at" ON "public"."directory" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."directory" ADD COLUMN "doc" uuid NOT NULL;

alter table "public"."directory"
           add constraint "directory_doc_fkey"
           foreign key ("doc")
           references "public"."doc"
           ("id") on update restrict on delete restrict;

alter table "public"."directory" rename column "doc" to "doc_id";

ALTER TABLE "public"."page" ADD COLUMN "directory_id" uuid NULL;

alter table "public"."page"
           add constraint "page_directory_id_fkey"
           foreign key ("directory_id")
           references "public"."directory"
           ("id") on update restrict on delete restrict;

ALTER TABLE "public"."directory" ADD COLUMN "index" integer NOT NULL DEFAULT 0;

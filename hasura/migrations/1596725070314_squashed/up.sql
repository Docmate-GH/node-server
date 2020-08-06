
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."teams"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "master" uuid NOT NULL, "title" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz, PRIMARY KEY ("id") , UNIQUE ("id"));
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
CREATE TRIGGER "set_public_teams_updated_at"
BEFORE UPDATE ON "public"."teams"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_teams_updated_at" ON "public"."teams" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

CREATE TABLE "public"."doc_team"("team_id" uuid NOT NULL, "doc_id" uuid NOT NULL, PRIMARY KEY ("team_id","doc_id") , FOREIGN KEY ("doc_id") REFERENCES "public"."doc"("id") ON UPDATE restrict ON DELETE restrict, FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON UPDATE restrict ON DELETE restrict);

alter table "public"."teams"
           add constraint "teams_master_fkey"
           foreign key ("master")
           references "public"."users"
           ("id") on update restrict on delete restrict;

ALTER TABLE "public"."users" ADD COLUMN "username" text NULL;

CREATE TABLE "public"."user_team"("user_id" uuid NOT NULL, "team_id" uuid NOT NULL, PRIMARY KEY ("user_id","team_id") , FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE restrict ON DELETE restrict, FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON UPDATE restrict ON DELETE restrict);

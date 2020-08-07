
ALTER TABLE "public"."doc" ADD COLUMN "team_id" uuid NULL;

alter table "public"."doc"
           add constraint "doc_team_id_fkey"
           foreign key ("team_id")
           references "public"."teams"
           ("id") on update restrict on delete restrict;

ALTER TABLE "public"."teams" ADD COLUMN "is_personal" boolean NOT NULL DEFAULT true;

ALTER TABLE "public"."teams" ALTER COLUMN "is_personal" DROP DEFAULT;

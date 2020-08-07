
ALTER TABLE ONLY "public"."teams" ALTER COLUMN "is_personal" SET DEFAULT true;

ALTER TABLE "public"."teams" DROP COLUMN "is_personal";

alter table "public"."doc" drop constraint "doc_team_id_fkey";

ALTER TABLE "public"."doc" DROP COLUMN "team_id";

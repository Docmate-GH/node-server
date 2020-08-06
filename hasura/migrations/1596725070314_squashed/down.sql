
DROP TABLE "public"."user_team";

ALTER TABLE "public"."users" DROP COLUMN "username";

alter table "public"."teams" drop constraint "teams_master_fkey";

DROP TABLE "public"."doc_team";

DROP TABLE "public"."teams";

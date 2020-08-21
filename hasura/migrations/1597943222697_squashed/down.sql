
ALTER TABLE "public"."directory" DROP COLUMN "index";

alter table "public"."page" drop constraint "page_directory_id_fkey";

ALTER TABLE "public"."page" DROP COLUMN "directory_id";

alter table "public"."directory" rename column "doc_id" to "doc";

alter table "public"."directory" drop constraint "directory_doc_fkey";

ALTER TABLE "public"."directory" DROP COLUMN "doc";

DROP TABLE "public"."directory";

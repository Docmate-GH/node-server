
ALTER TABLE "public"."users" DROP COLUMN "password";

ALTER TABLE "public"."users" DROP COLUMN "email";

ALTER TABLE "public"."users" DROP COLUMN "verified";

DROP TABLE "public"."users";

ALTER TABLE "public"."doc" ADD COLUMN "code_highlights" jsonb NULL DEFAULT jsonb_build_array('json', 'bash');

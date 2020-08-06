CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE TABLE public.doc (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    title text NOT NULL
);
CREATE TABLE public.page (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text,
    content text,
    title text DEFAULT 'Untitled'::text,
    deleted_at timestamp with time zone,
    doc_id uuid
);
ALTER TABLE ONLY public.doc
    ADD CONSTRAINT doc_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.page
    ADD CONSTRAINT page_pkey PRIMARY KEY (id);
CREATE TRIGGER set_public_doc_updated_at BEFORE UPDATE ON public.doc FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_doc_updated_at ON public.doc IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_page_updated_at BEFORE UPDATE ON public.page FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_page_updated_at ON public.page IS 'trigger to set value of column "updated_at" to current timestamp on row update';
ALTER TABLE ONLY public.page
    ADD CONSTRAINT page_doc_id_fkey FOREIGN KEY (doc_id) REFERENCES public.doc(id) ON UPDATE RESTRICT ON DELETE RESTRICT;

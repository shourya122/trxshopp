CREATE TABLE public.banned_emails (
  email text PRIMARY KEY,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.banned_emails TO service_role;
ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.auth_email_attempts (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_email_attempts_email_time ON public.auth_email_attempts (email, created_at DESC);
GRANT ALL ON public.auth_email_attempts TO service_role;
GRANT USAGE ON SEQUENCE public.auth_email_attempts_id_seq TO service_role;
ALTER TABLE public.auth_email_attempts ENABLE ROW LEVEL SECURITY;
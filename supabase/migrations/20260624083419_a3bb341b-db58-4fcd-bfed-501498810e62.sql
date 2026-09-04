
-- Add 'customer' to app_role enum (must run before usage)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

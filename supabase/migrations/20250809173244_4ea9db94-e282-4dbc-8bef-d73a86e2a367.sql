-- Add unique constraint on user_id for business_setup table to enable upserts
ALTER TABLE public.business_setup 
ADD CONSTRAINT business_setup_user_id_unique UNIQUE (user_id);
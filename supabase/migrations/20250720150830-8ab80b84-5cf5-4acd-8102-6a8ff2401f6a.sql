-- Add the missing is_active column to stocks table
ALTER TABLE public.stocks ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update all existing stocks to be active
UPDATE public.stocks SET is_active = true;
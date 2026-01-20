-- Add 'type' column to categories table with default value 'errors'
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'errors';

-- Check constraint to ensure type is either 'errors' or 'guides'
ALTER TABLE categories 
ADD CONSTRAINT categories_type_check CHECK (type IN ('errors', 'guides'));

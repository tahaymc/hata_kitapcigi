-- Add 'code' column to 'guides' table if it doesn't exist
ALTER TABLE guides 
ADD COLUMN IF NOT EXISTS code TEXT;

-- Optional: Add an index for faster searching by code
CREATE INDEX IF NOT EXISTS idx_guides_code ON guides(code);

-- Comment
COMMENT ON COLUMN guides.code IS 'Short code/identifier for the guide (e.g. GUID-001)';

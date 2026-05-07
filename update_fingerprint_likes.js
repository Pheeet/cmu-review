import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const client = new pg.Client({ 
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});
await client.connect();

const sql = `
-- Drop current constraints if any
ALTER TABLE review_likes DROP CONSTRAINT IF EXISTS review_likes_pkey;

-- Add fingerprint_id columns
ALTER TABLE review_likes ADD COLUMN IF NOT EXISTS fingerprint_id TEXT;
ALTER TABLE review_reports ADD COLUMN IF NOT EXISTS fingerprint_id TEXT;

-- Clear old data because we don't have fingerprint_id for them
TRUNCATE TABLE review_likes;
TRUNCATE TABLE review_reports;

-- Set columns to NOT NULL after clearing
ALTER TABLE review_likes ALTER COLUMN fingerprint_id SET NOT NULL;
ALTER TABLE review_reports ALTER COLUMN fingerprint_id SET NOT NULL;

-- Allow IP to be null
ALTER TABLE review_likes ALTER COLUMN ip DROP NOT NULL;
ALTER TABLE review_reports ALTER COLUMN ip DROP NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_review_likes_fp ON review_likes(review_id, fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_fp ON review_reports(review_id, fingerprint_id);
`;

try {
  console.log("Updating tables for Fingerprint support...");
  await client.query(sql);
  console.log("Done! Database updated.");
} catch (error) {
  console.error("Failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}

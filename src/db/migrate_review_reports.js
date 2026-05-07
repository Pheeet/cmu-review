import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

const sql = `
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  ip TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (review_id, ip)
);

-- Index for faster check on IP and review
CREATE INDEX IF NOT EXISTS idx_review_reports_ip_review_id ON review_reports (ip, review_id);
`;

try {
    console.log("Creating review_reports table...");
    await client.query(sql);
    console.log("Table created successfully!");
} catch (error) {
    console.error("Failed to create table:");
    console.error(error);
    process.exit(1);
} finally {
    await client.end();
}

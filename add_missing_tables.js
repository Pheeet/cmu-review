import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

const client = new pg.Client({ 
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});
await client.connect();

const sql = `
-- review_reports table
CREATE TABLE IF NOT EXISTS review_reports (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  ip        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- review_likes table
CREATE TABLE IF NOT EXISTS review_likes (
  review_id  UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  ip         TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (review_id, ip)
);

-- rate_limit_logs table (if missing)
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip         TEXT NOT NULL,
  action     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

try {
  console.log("Creating missing tables...");
  await client.query(sql);
  console.log("Done! Tables created successfully.");
} catch (error) {
  console.error("Failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}

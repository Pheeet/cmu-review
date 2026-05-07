import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

const sql = `
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries on IP and created_at
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_created_at ON rate_limit_logs (ip, created_at);
`;

try {
    console.log("Creating rate_limit_logs table...");
    await client.query(sql);
    console.log("Table created successfully!");
} catch (error) {
    console.error("Failed to create table:");
    console.error(error);
    process.exit(1);
} finally {
    await client.end();
}

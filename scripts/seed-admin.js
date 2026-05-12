import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse .env.local manually
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required in .env.local');
  process.exit(1);
}

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD is required (set in .env.local or env)');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function seed() {
  console.log(`Creating admin: ${ADMIN_USERNAME}`);

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  try {
    await sql`
      INSERT INTO admins (id, username, password_hash, created_at)
      VALUES (gen_random_uuid(), ${ADMIN_USERNAME}, ${hash}, now())
      ON CONFLICT (username) DO NOTHING
    `;
    console.log(`Admin "${ADMIN_USERNAME}" created (or already exists).`);
  } catch (err) {
    console.error('Failed to create admin:', err);
    process.exit(1);
  }

  process.exit(0);
}

seed();

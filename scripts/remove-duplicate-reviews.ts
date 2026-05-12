import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const dbUrl = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=').slice(1).join('=')!;
process.env.DATABASE_URL = dbUrl;

const sql = neon(dbUrl);

async function main() {
  // Find duplicates: same fingerprint_id + course_id, keep earliest, delete rest
  const duplicates = await sql`
    SELECT fingerprint_id, course_id, array_agg(id ORDER BY created_at ASC) as ids, count(*)::int as cnt
    FROM reviews
    WHERE fingerprint_id IS NOT NULL
    GROUP BY fingerprint_id, course_id
    HAVING count(*) > 1
  `;

  console.log(`Found ${duplicates.length} groups of duplicates`);

  let totalDeleted = 0;

  for (const row of duplicates) {
    const ids = row.ids as string[];
    const keep = ids[0]; // keep oldest
    const remove = ids.slice(1);

    console.log(`fingerprint=${row.fingerprint_id} course=${row.course_id}: keeping ${keep}, removing ${remove.length}`);

    // Delete review_likes and review_reports for duplicate reviews first (FK constraints)
    for (const id of remove) {
      await sql`DELETE FROM review_likes WHERE review_id = ${id}`;
      await sql`DELETE FROM review_reports WHERE review_id = ${id}`;
      await sql`DELETE FROM reviews WHERE id = ${id}`;
    }

    totalDeleted += remove.length;
  }

  // Also find duplicates by exact same comment + course_id (no fingerprint)
  const contentDupes = await sql`
    SELECT comment, course_id, array_agg(id ORDER BY created_at ASC) as ids, count(*)::int as cnt
    FROM reviews
    WHERE fingerprint_id IS NULL
    GROUP BY comment, course_id
    HAVING count(*) > 1
  `;

  console.log(`Found ${contentDupes.length} groups of content duplicates (no fingerprint)`);

  for (const row of contentDupes) {
    const ids = row.ids as string[];
    const keep = ids[0];
    const remove = ids.slice(1);

    console.log(`course=${row.course_id}: keeping ${keep}, removing ${remove.length}`);

    for (const id of remove) {
      await sql`DELETE FROM review_likes WHERE review_id = ${id}`;
      await sql`DELETE FROM review_reports WHERE review_id = ${id}`;
      await sql`DELETE FROM reviews WHERE id = ${id}`;
    }

    totalDeleted += remove.length;
  }

  console.log(`\nDone. Total deleted: ${totalDeleted} duplicate reviews`);
}

main().catch(console.error);

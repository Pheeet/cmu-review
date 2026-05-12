import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const dbUrl = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=').slice(1).join('=')!;
const sql = neon(dbUrl);

function scoreReview(r: any): number {
  let s = 0;
  if (r.fingerprint_id) s++;
  if (r.reviewer_name) s++;
  if (r.grade && r.grade !== 'ไม่ระบุ') s++;
  if (r.rating !== null) s++;
  if (r.academic_year) s++;
  if (r.semester && r.semester !== 'ไม่ระบุ') s++;
  if (r.section_type && r.section_type !== 'ไม่ระบุ') s++;
  if (r.like_count > 0) s += r.like_count;
  return s;
}

async function main() {
  // Find reviews with exact same comment (trimmed) across same course
  const groups = await sql`
    SELECT
      trim(comment) as clean_comment,
      course_id,
      count(*)::int as cnt
    FROM reviews
    GROUP BY trim(comment), course_id
    HAVING count(*) > 1
    ORDER BY count(*) DESC
  `;

  console.log(`Found ${groups.length} groups with duplicate comments\n`);

  let totalDeleted = 0;

  for (const g of groups) {
    const reviews = await sql`
      SELECT * FROM reviews
      WHERE course_id = ${g.course_id} AND trim(comment) = ${g.clean_comment}
      ORDER BY created_at ASC
    `;

    console.log(`--- course=${g.course_id} (${reviews.length} reviews) ---`);
    for (const r of reviews) {
      console.log(`  id=${r.id} name=${r.reviewer_name || '-'} fp=${r.fingerprint_id || '-'} grade=${r.grade} rating=${r.rating} likes=${r.like_count} score=${scoreReview(r)}`);
      console.log(`  "${r.comment.substring(0, 80)}${r.comment.length > 80 ? '...' : ''}"`);
    }

    // Keep the one with highest score (most metadata), break ties by earliest created_at
    const sorted = [...reviews].sort((a, b) => {
      const diff = scoreReview(b) - scoreReview(a);
      if (diff !== 0) return diff;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const keep = sorted[0];
    const remove = reviews.filter((r: any) => r.id !== keep.id);

    console.log(`  KEEP: ${keep.id} (score ${scoreReview(keep)})`);

    for (const r of remove) {
      console.log(`  DELETE: ${r.id}`);
      await sql`DELETE FROM review_likes WHERE review_id = ${r.id}`;
      await sql`DELETE FROM review_reports WHERE review_id = ${r.id}`;
      await sql`DELETE FROM reviews WHERE id = ${r.id}`;
      totalDeleted++;
    }
    console.log('');
  }

  console.log(`Done. Deleted ${totalDeleted} duplicate reviews`);
}

main().catch(console.error);

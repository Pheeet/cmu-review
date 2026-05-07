import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './src/db/schema.ts';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

try {
  const env = readFileSync(".env.local", "utf-8");
  env.split("\n").forEach((line) => {
    const [key, ...vals] = line.split("=");
    if (key && vals.length) process.env[key.trim()] = vals.join("=").trim();
  });
} catch {}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function test() {
  try {
    const reviews = await db.select().from(schema.reviews).limit(1);
    if (reviews.length === 0) {
      console.log('No reviews found to test with.');
      return;
    }
    const reviewId = reviews[0].id;
    console.log('Testing with reviewId:', reviewId);

    console.log('Testing Report...');
    const existingReport = await db.select()
      .from(schema.review_reports)
      .where(and(eq(schema.review_reports.review_id, reviewId), eq(schema.review_reports.ip, 'test_ip')))
      .limit(1);
    console.log('Existing report query result:', existingReport);

    console.log('Testing Like...');
    const existingLike = await db.select()
      .from(schema.review_likes)
      .where(and(eq(schema.review_likes.review_id, reviewId), eq(schema.review_likes.ip, 'test_ip')))
      .limit(1);
    console.log('Existing like query result:', existingLike);
    
    console.log('Testing Insert Like (Dry run concept)...');
    try {
        await db.transaction(async (tx) => {
            await tx.insert(schema.review_likes).values({ review_id: reviewId, ip: 'test_ip_2' });
            throw new Error('Rollback intentional');
        });
    } catch(e) {
        console.log('Transaction result:', e.message);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

test();

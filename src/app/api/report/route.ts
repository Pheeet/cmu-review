import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews as reviewsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
    }

    // First get the current review
    const reviewData = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId)).limit(1);
    const review = reviewData[0];

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const newCount = (review.report_count || 0) + 1;

    if (newCount >= 15) {
      // Automatic deletion threshold met (Set to 15 based on user request)
      await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));
    } else {
      // Increment report count
      await db.update(reviewsTable)
        .set({ report_count: newCount })
        .where(eq(reviewsTable.id, reviewId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

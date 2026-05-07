import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews as reviewsTable, review_reports } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { reviewId } = await request.json();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

    if (!reviewId) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
    }

    // Check for duplicate report from this IP
    const existingReport = await db.select()
      .from(review_reports)
      .where(and(eq(review_reports.review_id, reviewId), eq(review_reports.ip, ip)))
      .limit(1);

    if (existingReport.length > 0) {
      return NextResponse.json({ error: 'Already reported' }, { status: 429 });
    }

    // Get the current review
    const reviewData = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId)).limit(1);
    const review = reviewData[0];

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const newCount = (review.report_count || 0) + 1;

    // 1. Log the report
    await db.insert(review_reports).values({ review_id: reviewId, ip });

    // 2. Update or Delete the review
    if (newCount >= 15) {
      await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));
    } else {
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

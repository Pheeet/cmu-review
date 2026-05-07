import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews as reviewsTable } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  }

  try {
    const data = await db.select()
      .from(reviewsTable)
      .where(and(eq(reviewsTable.course_id, courseId), eq(reviewsTable.hidden, false)))
      .orderBy(desc(reviewsTable.like_count), desc(reviewsTable.created_at));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

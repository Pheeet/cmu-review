import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews as reviewsTable } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
    return NextResponse.json({ error: 'Invalid courseId format' }, { status: 400 });
  }

  try {
    const data = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.course_id, courseId))
      .orderBy(asc(reviewsTable.report_count), desc(reviewsTable.like_count), desc(reviewsTable.created_at));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

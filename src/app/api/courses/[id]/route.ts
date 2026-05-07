import { NextResponse } from 'next/server';
import { db } from '@/db';
import { courses as coursesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const course = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, id))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(course[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

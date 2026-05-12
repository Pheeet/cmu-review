'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { courses, course_requests } from '@/db/schema';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function createCourse(data: {
  code: string;
  name_th: string;
  name_en: string;
  faculty: string;
  credits: number;
  description: string;
}) {
  await requireAdmin();
  await db.insert(courses).values({
    code: data.code,
    name_th: data.name_th || null,
    name_en: data.name_en || null,
    faculty: data.faculty || null,
    credits: data.credits || null,
    description: data.description || null,
  });

  // Remove matching course requests so sidebar dot disappears
  await db.delete(course_requests).where(eq(course_requests.code, data.code));

  revalidatePath('/admin/courses');
  revalidatePath('/admin');
  return { success: true };
}

export async function updateCourse(
  id: string,
  data: {
    code: string;
    name_th: string;
    name_en: string;
    faculty: string;
    credits: number;
    description: string;
  }
) {
  await requireAdmin();
  await db
    .update(courses)
    .set({
      code: data.code,
      name_th: data.name_th || null,
      name_en: data.name_en || null,
      faculty: data.faculty || null,
      credits: data.credits || null,
      description: data.description || null,
    })
    .where(eq(courses.id, id));
  revalidatePath('/admin/courses');
  return { success: true };
}

export async function deleteCourse(id: string) {
  await requireAdmin();
  await db.delete(courses).where(eq(courses.id, id));
  revalidatePath('/admin/courses');
  return { success: true };
}

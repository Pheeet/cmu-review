'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { courses } from '@/db/schema';

export async function createCourse(data: {
  code: string;
  name_th: string;
  name_en: string;
  faculty: string;
  credits: number;
  description: string;
}) {
  await db.insert(courses).values({
    code: data.code,
    name_th: data.name_th || null,
    name_en: data.name_en || null,
    faculty: data.faculty || null,
    credits: data.credits || null,
    description: data.description || null,
  });
  revalidatePath('/admin/courses');
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
  await db.delete(courses).where(eq(courses.id, id));
  revalidatePath('/admin/courses');
  return { success: true };
}

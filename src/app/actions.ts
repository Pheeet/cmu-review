'use server';

import { db } from '@/db';
import { reviews as reviewsTable } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function fetchCourseReviews(courseId: string) {
  try {
    const data = await db.select().from(reviewsTable)
      .where(and(eq(reviewsTable.course_id, courseId), eq(reviewsTable.hidden, false)))
      .orderBy(desc(reviewsTable.like_count), desc(reviewsTable.created_at));
    return data;
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return [];
  }
}

export async function checkFingerprintReview(courseId: string, fingerprintId: string) {
  try {
    const data = await db.select({ id: reviewsTable.id }).from(reviewsTable)
      .where(and(eq(reviewsTable.course_id, courseId), eq(reviewsTable.fingerprint_id, fingerprintId)))
      .limit(1);
    return data.length > 0;
  } catch (error) {
    console.error('Failed to check fingerprint:', error);
    return false;
  }
}

export async function submitReview(payload: {
  course_id: string;
  academic_year: string;
  semester: string;
  section_type: string;
  grade: string;
  comment: string;
  reviewer_name: string | null;
  fingerprint_id: string | null;
}) {
  // Server-side validation
  if (!payload.comment || payload.comment.trim().length < 20) {
    return { success: false, error: 'รีวิวต้องมีความยาวอย่างน้อย 20 ตัวอักษร' };
  }
  if (payload.comment.length > 3000) {
    return { success: false, error: 'รีวิวยาวเกินไป' };
  }
  if (!payload.course_id) {
    return { success: false, error: 'ไม่พบรหัสวิชา' };
  }

  // Rate limiting: Check if this fingerprint has submitted a review recently (last 60s)
  if (payload.fingerprint_id) {
    try {
      const lastReview = await db.select({ created_at: reviewsTable.created_at })
        .from(reviewsTable)
        .where(eq(reviewsTable.fingerprint_id, payload.fingerprint_id))
        .orderBy(desc(reviewsTable.created_at))
        .limit(1);

      if (lastReview.length > 0 && lastReview[0].created_at) {
        const now = new Date();
        const last = new Date(lastReview[0].created_at);
        const diffSeconds = (now.getTime() - last.getTime()) / 1000;
        
        if (diffSeconds < 60) {
          return { 
            success: false, 
            error: `กรุณารออีก ${Math.ceil(60 - diffSeconds)} วินาทีก่อนส่งรีวิวใหม่ (Rate Limit)` 
          };
        }
      }
    } catch (e) {
      console.error('Rate limit check failed:', e);
    }
  }

  try {
    await db.insert(reviewsTable).values(payload);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to submit review:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function likeReview(reviewId: string) {
  if (!reviewId) return { success: false };
  try {
    await db.update(reviewsTable)
      .set({ like_count: sql`${reviewsTable.like_count} + 1` })
      .where(eq(reviewsTable.id, reviewId));
    return { success: true };
  } catch (error) {
    console.error('Failed to like review:', error);
    return { success: false };
  }
}

export async function unlikeReview(reviewId: string) {
  if (!reviewId) return { success: false };
  try {
    await db.update(reviewsTable)
      .set({ like_count: sql`GREATEST(${reviewsTable.like_count} - 1, 0)` })
      .where(eq(reviewsTable.id, reviewId));
    return { success: true };
  } catch (error) {
    console.error('Failed to unlike review:', error);
    return { success: false };
  }
}

'use server';

import { db } from '@/db';
import { reviews as reviewsTable, rate_limit_logs, review_likes } from '@/db/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

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

  // Server-side IP Rate Limiting: Max 3 reviews per hour
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentLogs = await db.select({ id: rate_limit_logs.id })
      .from(rate_limit_logs)
      .where(and(
        eq(rate_limit_logs.ip, ip),
        eq(rate_limit_logs.action, 'review'),
        gte(rate_limit_logs.created_at, oneHourAgo)
      ));

    if (recentLogs.length >= 3) {
      return { 
        success: false, 
        error: 'คุณส่งรีวิวเกินกำหนด (สูงสุด 3 ครั้งต่อชั่วโมง) กรุณาลองใหม่ภายหลัง' 
      };
    }
  } catch (e) {
    console.error('IP Rate limit check failed:', e);
  }

  // Fingerprint Rate limiting (already exists, keeping it as an extra layer)
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
            error: `กรุณารออีก ${Math.ceil(60 - diffSeconds)} วินาทีก่อนส่งรีวิวใหม่` 
          };
        }
      }
    } catch (e) {
      console.error('Fingerprint rate limit check failed:', e);
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(reviewsTable).values(payload);
      await tx.insert(rate_limit_logs).values({
        ip,
        action: 'review'
      });
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to submit review:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}

export async function likeReview(reviewId: string) {
  if (!reviewId) return { success: false };
  
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

  try {
    // Check if already liked
    const existingLike = await db.select()
      .from(review_likes)
      .where(and(eq(review_likes.review_id, reviewId), eq(review_likes.ip, ip)))
      .limit(1);

    if (existingLike.length > 0) {
      return { success: false, error: 'คุณไลก์รีวิวนี้ไปแล้ว' };
    }

    await Promise.all([
      db.insert(review_likes).values({ review_id: reviewId, ip }),
      db.update(reviewsTable)
        .set({ like_count: sql`${reviewsTable.like_count} + 1` })
        .where(eq(reviewsTable.id, reviewId))
    ]);

    return { success: true };
  } catch (error) {
    console.error('Failed to like review:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการกดไลก์' };
  }
}

export async function unlikeReview(reviewId: string) {
  if (!reviewId) return { success: false };

  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

  try {
    // Check if liked before
    const existingLike = await db.select()
      .from(review_likes)
      .where(and(eq(review_likes.review_id, reviewId), eq(review_likes.ip, ip)))
      .limit(1);

    if (existingLike.length === 0) {
      return { success: false };
    }

    await Promise.all([
      db.delete(review_likes)
        .where(and(eq(review_likes.review_id, reviewId), eq(review_likes.ip, ip))),
      db.update(reviewsTable)
        .set({ like_count: sql`GREATEST(${reviewsTable.like_count} - 1, 0)` })
        .where(eq(reviewsTable.id, reviewId))
    ]);

    return { success: true };
  } catch (error) {
    console.error('Failed to unlike review:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการยกเลิกไลก์' };
  }
}

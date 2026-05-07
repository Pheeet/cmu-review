import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Course, Review } from '@/types';
import { X, AlertTriangle, BookOpen, Clock, Tag, MessageSquare, ThumbsUp, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { fetchCourseReviews, checkFingerprintReview, likeReview, unlikeReview } from '@/app/actions';
import { getFacultyColor } from '@/lib/facultyColors';

interface CourseModalProps {
  course: Course;
  onClose: () => void;
  onReviewAdded: () => void;
}

import { ReviewFormModal } from './ReviewFormModal';

export function CourseModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const [fullCourse, setFullCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('cmureview_liked');
    if (saved) {
      try {
        setLikedReviews(JSON.parse(saved));
      } catch {
        setLikedReviews({});
      }
    }
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Prevent scroll and layout jump
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  useEffect(() => {
    fetchData();
    checkFingerprintAndStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  const fetchData = async () => {
    setLoadingDetails(true);
    setLoadingReviews(true);

    // Fetch Details
    fetch(`/api/courses/${course.id}`)
      .then(res => res.json())
      .then(data => {
        setFullCourse(data);
        setLoadingDetails(false);
      });

    // Fetch Reviews
    fetch(`/api/reviews?courseId=${course.id}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoadingReviews(false);
      });
  };

  const checkFingerprintAndStatus = async () => {
    try {
      // 1. Check LocalStorage first (Most reliable for the current user)
      const localDoneStr = localStorage.getItem('cmureview_done');
      if (localDoneStr) {
        const localDone = JSON.parse(localDoneStr);
        if (localDone[course.id]) {
          setHasReviewed(true);
          setIsChecking(false);
          return;
        }
      }

      // 2. Set a timeout for FingerprintJS to avoid hanging in In-App Browsers
      const fpPromiseWithTimeout = Promise.race([
        fpPromise.load().then(fp => fp.get()),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
      ]) as Promise<any>;

      const result = await fpPromiseWithTimeout;
      const currentVisitorId = result.visitorId;
      setVisitorId(currentVisitorId);
      localStorage.setItem('cmureview_fp', currentVisitorId);

      // 3. Check DB
      const hasReviewedDb = await checkFingerprintReview(course.id, currentVisitorId);
      
      // IMPORTANT: If DB says they reviewed but local storage doesn't,
      // and they are in a potentially colliding environment, we be lenient on visibility
      // but strict on submission. For now, we trust DB but handle it gracefully.
      if (hasReviewedDb) {
        setHasReviewed(true);
        // Sync local storage if DB says yes
        const currentDoneStr = localStorage.getItem('cmureview_done');
        const currentDone = currentDoneStr ? JSON.parse(currentDoneStr) : {};
        currentDone[course.id] = true;
        localStorage.setItem('cmureview_done', JSON.stringify(currentDone));
      } else {
        setHasReviewed(false);
      }
    } catch (err) {
      console.warn('Review status check skipped or timed out', err);
      // If it fails or times out, we assume they haven't reviewed yet 
      // to let them see the button (UX First)
      setHasReviewed(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReport = async (reviewId: string) => {
    setReportingId(reviewId);
  };

  const confirmReport = async (reviewId: string) => {
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, fingerprintId: visitorId || localStorage.getItem('cmureview_fp') })
      });
      
      if (res.ok) {
        toast.success('แจ้งปัญหาสำเร็จ ทีมงานจะตรวจสอบโดยเร็ว');
        setReportingId(null);
        // Refresh reviews
        fetch(`/api/reviews?courseId=${course.id}`)
          .then(res => res.json())
          .then(data => setReviews(data));
      } else if (res.status === 429) {
        toast.error('คุณได้แจ้งปัญหาสำหรับรีวิวนี้ไปแล้ว');
        setReportingId(null);
      } else {
        toast.error('เกิดข้อผิดพลาดในการแจ้งปัญหา');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการแจ้งปัญหา');
    }
  };

  const handleLike = async (reviewId: string) => {
    const isLiked = likedReviews[reviewId];
    setReviews(prev => prev.map(r => 
      r.id === reviewId 
        ? { ...r, like_count: Math.max(0, (r.like_count || 0) + (isLiked ? -1 : 1)) } 
        : r
    ));

    const newLiked = { ...likedReviews };
    if (isLiked) {
      delete newLiked[reviewId];
    } else {
      newLiked[reviewId] = true;
    }
    setLikedReviews(newLiked);
    localStorage.setItem('cmureview_liked', JSON.stringify(newLiked));

    const currentFp = visitorId || localStorage.getItem('cmureview_fp');
    if (!currentFp) {
      toast.error('กำลังตรวจสอบสิทธิ์ กรุณารอสักครู่...');
      return;
    }

    const result = isLiked ? await unlikeReview(reviewId, currentFp) : await likeReview(reviewId, currentFp);
    if (!result.success) {
      setReviews(prev => prev.map(r => 
        r.id === reviewId 
          ? { ...r, like_count: Math.max(0, (r.like_count || 0) + (isLiked ? 1 : -1)) } 
          : r
      ));
      const rolledBackLiked = { ...likedReviews };
      if (isLiked) { rolledBackLiked[reviewId] = true; } 
      else { delete rolledBackLiked[reviewId]; }
      setLikedReviews(rolledBackLiked);
      localStorage.setItem('cmureview_liked', JSON.stringify(rolledBackLiked));
      toast.error((result as any).error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const fc = getFacultyColor(course.faculty);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="relative rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-3xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col bg-[#F9F8F6]"
      >
        <div className="overflow-y-auto overflow-x-hidden flex-1 pb-4 rounded-t-3xl sm:rounded-t-2xl">
          {/* Mobile Handle */}
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-neutral-300 rounded-full" />
          </div>

        {/* ── ZONE 1: Header Strip ── */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 bg-white border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            {/* Course code pill — purple accent */}
            <span className="font-mono font-bold text-sm tracking-widest text-[#9E76B4] bg-purple-50 border border-purple-200 px-3.5 py-1.5 rounded-full leading-none">
              {course.code}
            </span>
            {course.credits !== null && (
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 leading-none">
                <BookOpen className="w-3.5 h-3.5" />
                {course.credits} หน่วยกิต
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── ZONE 2: Course Info ── */}
        <div className="px-5 sm:px-8 pt-6 pb-6 bg-white border-b border-neutral-200">
          {loadingDetails ? (
            <div className="animate-pulse space-y-4">
              <div className="h-9 bg-neutral-100 rounded-xl w-3/4" />
              <div className="h-5 bg-neutral-100 rounded-xl w-1/2" />
              <div className="h-24 bg-neutral-50 rounded-2xl w-full" />
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-tight tracking-tight mb-1">
                {fullCourse?.name_en || course.name_en || 'Unknown Course'}
              </h2>
              {(fullCourse?.name_th || course.name_th) && (
                <p className="text-base text-neutral-400 font-medium mb-4">
                  {fullCourse?.name_th || course.name_th}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full leading-none"
                  style={{ backgroundColor: fc.bg, color: fc.text }}
                >
                  {fullCourse?.faculty || course.faculty || 'ไม่ระบุคณะ'}
                </span>
              </div>
              {fullCourse?.description && (
                <div
                  className="rounded-xl px-5 py-4"
                  style={{ backgroundColor: fc.bg }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: fc.text }}>
                    {fullCourse.description}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── ZONE 3: Reviews + Form ── */}
        <div className="px-5 sm:px-8 py-7 space-y-8" style={{ background: '#F9F8F6' }}>

          {/* Reviews list */}
          <div>
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              รีวิวจากนักศึกษา ({loadingReviews ? '...' : reviews.length})
            </h4>

            {loadingReviews ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-neutral-150 animate-pulse shadow-sm">
                    <div className="flex gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-neutral-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-100 rounded-lg w-1/4" />
                        <div className="h-3 bg-neutral-100 rounded-lg w-1/3" />
                      </div>
                    </div>
                    <div className="space-y-2 pl-0 sm:pl-11">
                      <div className="h-4 bg-neutral-100 rounded-lg w-full" />
                      <div className="h-4 bg-neutral-100 rounded-lg w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-neutral-100 shadow-sm">
                <p className="text-neutral-400 font-medium text-sm">ยังไม่มีรีวิว — เป็นคนแรกได้เลย!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white p-5 rounded-xl border border-neutral-150 shadow-sm relative group"
                    style={{ borderColor: '#E8E8E6' }}
                  >
                    <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                          {(review.reviewer_name || 'ม').charAt(0)}
                        </div>
                        <span className="font-semibold text-neutral-900 text-sm">
                          {review.reviewer_name || 'ไม่ระบุชื่อ'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-center">
                        {review.grade !== 'ไม่ระบุ' && (
                          <span className="text-xs font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100">
                            เกรด {review.grade}
                          </span>
                        )}
                        {review.semester !== 'ไม่ระบุ' && (
                          <span className="text-xs font-medium bg-neutral-50 text-neutral-500 px-2.5 py-1 rounded-full border border-neutral-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ปี {review.academic_year} เทอม {review.semester}
                          </span>
                        )}
                        {review.section_type !== 'ไม่ระบุ' && (
                          <span className="text-xs font-medium bg-neutral-50 text-neutral-500 px-2.5 py-1 rounded-full border border-neutral-200 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {review.section_type}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap break-words pl-0 sm:pl-11">
                        {review.comment}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-50 sm:ml-11">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleLike(review.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                              likedReviews[review.id]
                                ? 'bg-purple-50 text-[#9E76B4]'
                                : 'bg-neutral-50 text-neutral-400 hover:bg-purple-50 hover:text-[#9E76B4]'
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${likedReviews[review.id] ? 'fill-current' : ''}`} />
                            <span>{review.like_count || 0}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleReport(review.id)}
                          className="text-[10px] font-medium text-neutral-400 hover:text-red-500 transition-colors flex items-center"
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          แจ้งปัญหา
                        </button>
                      </div>
                    </div>

                    {/* Confirmation Overlay for Reporting */}
                    <AnimatePresence>
                      {reportingId === review.id && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-white/95 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 rounded-xl"
                        >
                          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                          <p className="text-sm font-bold text-neutral-900 mb-4 text-center">
                            ยืนยันการรายงานรีวิวนี้ว่าไม่เหมาะสม?
                          </p>
                          <div className="flex gap-2 w-full max-w-[240px]">
                            <button
                              onClick={() => setReportingId(null)}
                              className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-colors"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={() => confirmReport(review.id)}
                              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-red-200"
                            >
                              ตกลง
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Sticky Footer */}
        <div 
          className="sticky bottom-0 border-t border-neutral-100 bg-white px-4 py-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {isChecking ? (
            <div className="flex justify-center py-2">
              <div className="w-full max-w-sm h-12 bg-neutral-100 animate-pulse rounded-xl" />
            </div>
          ) : !hasReviewed ? (
            <div className="flex justify-center">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full bg-[#9E76B4] hover:bg-[#8A5DA1] text-white py-3 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                เขียนรีวิววิชานี้
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-2 text-center">
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium text-xs">คุณรีวิววิชานี้ไปแล้ว</span>
              </div>
              <p className="text-xs text-neutral-400">ขอบคุณที่ช่วยแชร์ประสบการณ์</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>

    <ReviewFormModal
      courseId={course.id}
      courseName={course.name_th || course.name_en || 'Unknown Course'}
      isOpen={isReviewModalOpen}
      onClose={() => setIsReviewModalOpen(false)}
      onSuccess={() => {
        setHasReviewed(true);
        // Refresh reviews
        fetch(`/api/reviews?courseId=${course.id}`)
          .then(res => res.json())
          .then(data => setReviews(data));
      }}
    />
  </>
  );
}

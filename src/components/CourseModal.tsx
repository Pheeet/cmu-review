import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Course, Review } from '@/types';
import { X, AlertTriangle, BookOpen, Clock, Tag, MessageSquare, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { fetchCourseReviews, checkFingerprintReview, submitReview, likeReview, unlikeReview } from '@/app/actions';
import { getFacultyColor } from '@/lib/facultyColors';

interface CourseModalProps {
  course: Course;
  onClose: () => void;
  onReviewAdded: () => void;
}

const BANNED_WORDS = ['คำหยาบ1', 'คำหยาบ2', 'ไอ้สัส', 'ควย', 'เหี้ย'];

export function CourseModal({ course, onClose, onReviewAdded }: CourseModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // Form state
  const [hasReviewed, setHasReviewed] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  
  const [reviewerName, setReviewerName] = useState('');
  const [academicYear, setAcademicYear] = useState('2566');
  const [semester, setSemester] = useState('1');
  const [sectionType, setSectionType] = useState('ปกติ');
  const [grade, setGrade] = useState('ไม่ระบุ');
  const [comment, setComment] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});
  const [reportingId, setReportingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cmureview_liked');
    if (saved) {
      try {
        setLikedReviews(JSON.parse(saved));
      } catch (e) {
        setLikedReviews({});
      }
    }
  }, []);

  useEffect(() => {
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    fetchReviews();
    checkFingerprintAndStatus();
  }, [course.id]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    const data = await fetchCourseReviews(course.id);
    setReviews(data);
    setLoadingReviews(false);
  };

  const checkFingerprintAndStatus = async () => {
    try {
      // 1. Check local storage
      const localDoneStr = localStorage.getItem('cmureview_done');
      if (localDoneStr) {
        const localDone = JSON.parse(localDoneStr);
        if (localDone[course.id]) {
          setHasReviewed(true);
          return;
        }
      }

      // 2. Get Fingerprint
      const fp = await fpPromise.load();
      const result = await fp.get();
      const currentVisitorId = result.visitorId;
      setVisitorId(currentVisitorId);
      localStorage.setItem('cmureview_fp', currentVisitorId);

      // 3. Check Database to see if this fingerprint already reviewed this course
      const hasReviewedDb = await checkFingerprintReview(course.id, currentVisitorId);
        
      if (hasReviewedDb) {
        setHasReviewed(true);
        // Also update local storage
        const currentDoneStr = localStorage.getItem('cmureview_done');
        const currentDone = currentDoneStr ? JSON.parse(currentDoneStr) : {};
        currentDone[course.id] = true;
        localStorage.setItem('cmureview_done', JSON.stringify(currentDone));
      }

    } catch (err) {
      console.error('Error checking fingerprint', err);
    }
  };

  const containsBannedWords = (text: string) => {
    return BANNED_WORDS.some(word => text.includes(word));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.length < 20) {
      toast.error('กรุณาเขียนรีวิวอย่างน้อย 20 ตัวอักษร');
      return;
    }
    if (containsBannedWords(comment)) {
      toast.error('กรุณาใช้ภาษาที่สุภาพ');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitReview({
        course_id: course.id,
        academic_year: academicYear,
        semester,
        section_type: sectionType,
        grade,
        comment,
        reviewer_name: reviewerName || null,
        fingerprint_id: visitorId,
      });

      if (!result.success) throw new Error(result.error);

      toast.success('ส่งรีวิวสำเร็จ ขอบคุณ!');
      
      // Update local storage
      const localDoneStr = localStorage.getItem('cmureview_done');
      const localDone = localDoneStr ? JSON.parse(localDoneStr) : {};
      localDone[course.id] = true;
      localStorage.setItem('cmureview_done', JSON.stringify(localDone));
      
      setHasReviewed(true);
      fetchReviews();
      onReviewAdded();
      
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการส่งรีวิว');
    } finally {
      setIsSubmitting(false);
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
        body: JSON.stringify({ reviewId })
      });
      
      if (res.ok) {
        toast.success('แจ้งปัญหาสำเร็จ ทีมงานจะตรวจสอบโดยเร็ว');
        setReportingId(null);
        fetchReviews(); // Refresh list to hide if deleted
      } else {
        toast.error('เกิดข้อผิดพลาดในการแจ้งปัญหา');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการแจ้งปัญหา');
    }
  };

  const handleLike = async (reviewId: string) => {
    const isLiked = likedReviews[reviewId];
    
    // 1. Optimistic UI update
    setReviews(prev => prev.map(r => 
      r.id === reviewId 
        ? { ...r, like_count: Math.max(0, (r.like_count || 0) + (isLiked ? -1 : 1)) } 
        : r
    ));

    // 2. Update local state & localStorage
    const newLiked = { ...likedReviews };
    if (isLiked) {
      delete newLiked[reviewId];
    } else {
      newLiked[reviewId] = true;
    }
    setLikedReviews(newLiked);
    localStorage.setItem('cmureview_liked', JSON.stringify(newLiked));

    // 3. API Call
    const result = isLiked ? await unlikeReview(reviewId) : await likeReview(reviewId);
    
    if (!result.success) {
      // Rollback on failure
      setReviews(prev => prev.map(r => 
        r.id === reviewId 
          ? { ...r, like_count: Math.max(0, (r.like_count || 0) + (isLiked ? 1 : -1)) } 
          : r
      ));
      const rolledBackLiked = { ...likedReviews };
      if (isLiked) {
        rolledBackLiked[reviewId] = true;
      } else {
        delete rolledBackLiked[reviewId];
      }
      setLikedReviews(rolledBackLiked);
      localStorage.setItem('cmureview_liked', JSON.stringify(rolledBackLiked));
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const fc = getFacultyColor(course.faculty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ background: '#F9F8F6' }}
      >

        {/* ── ZONE 1: Header Strip ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-8 py-4 bg-white border-b border-neutral-200">
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
        <div className="flex-shrink-0 px-5 sm:px-8 pt-6 pb-6 bg-white border-b border-neutral-200">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-tight tracking-tight mb-1">
            {course.name_en || 'Unknown Course'}
          </h2>
          {course.name_th && (
            <p className="text-base text-neutral-400 font-medium mb-4">
              {course.name_th}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Faculty badge — soft fill only, no border */}
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full leading-none"
              style={{ backgroundColor: fc.bg, color: fc.text }}
            >
              {course.faculty || 'ไม่ระบุคณะ'}
            </span>
          </div>
          {course.description && (
            <div
              className="rounded-xl px-5 py-4"
              style={{ backgroundColor: fc.bg }}
            >
              <p className="text-sm leading-relaxed" style={{ color: fc.text }}>
                {course.description}
              </p>
            </div>
          )}
        </div>

        {/* ── ZONE 3: Reviews + Form (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-7 space-y-8" style={{ background: '#F9F8F6' }}>

          {/* Reviews list */}
          <div>
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              รีวิวจากนักศึกษา ({reviews.length})
            </h4>

            {loadingReviews ? (
              <div className="text-center py-10 text-neutral-400">
                <div className="animate-spin w-7 h-7 border-2 border-[#9E76B4] border-t-transparent rounded-full mx-auto mb-3" />
                <span className="text-sm">กำลังโหลดรีวิว...</span>
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
                        <span className="text-xs font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100">
                          เกรด {review.grade}
                        </span>
                        <span className="text-xs font-medium bg-neutral-50 text-neutral-500 px-2.5 py-1 rounded-full border border-neutral-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ปี {review.academic_year} เทอม {review.semester}
                        </span>
                        <span className="text-xs font-medium bg-neutral-50 text-neutral-500 px-2.5 py-1 rounded-full border border-neutral-200 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {review.section_type}
                        </span>
                      </div>
                    </div>

                    <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap pl-0 sm:pl-10">
                      {review.comment}
                    </p>

                    <div className="absolute bottom-4 right-4 flex items-center gap-3">
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

                      <button
                        onClick={() => handleReport(review.id)}
                        className="text-[10px] font-medium text-neutral-400 hover:text-red-500 transition-colors flex items-center"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        แจ้งปัญหา
                      </button>
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

          {/* Review form card — pure white, clear layer */}
          <div
            className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            style={{ borderColor: '#E8E8E6' }}
          >
            {/* Form header */}
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: '#F0F0EE' }}>
              <h4 className="text-lg font-extrabold text-neutral-900 tracking-tight">เขียนรีวิววิชานี้</h4>
              <p className="text-xs text-neutral-400 mt-0.5">รีวิวของคุณจะช่วยนักศึกษาคนอื่นตัดสินใจ</p>
            </div>

            {hasReviewed ? (
              <div className="px-6 py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-5 h-5 text-[#9E76B4]" />
                </div>
                <p className="text-[#9E76B4] font-semibold">คุณรีวิววิชานี้ไปแล้ว</p>
                <p className="text-neutral-400 text-sm mt-1">ขอบคุณที่ร่วมแบ่งปันประสบการณ์!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

                {/* Row 1: Name + Academic Year */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                      ชื่อ (ไม่บังคับ)
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={e => setReviewerName(e.target.value)}
                      placeholder="นามแฝงของคุณ"
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                      ปีการศึกษา
                    </label>
                    <select
                      value={academicYear}
                      onChange={e => setAcademicYear(e.target.value)}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all text-sm appearance-none cursor-pointer"
                    >
                      {['2567', '2566', '2565', '2564', '2563'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Semester / Section / Grade — unified tinted card */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                    รายละเอียดการเรียน
                  </label>
                  <div className="grid grid-cols-3 gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        ภาคเรียน
                      </label>
                      <select
                        value={semester}
                        onChange={e => setSemester(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="ไม่ระบุ">ไม่ระบุ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        ประเภท
                      </label>
                      <select
                        value={sectionType}
                        onChange={e => setSectionType(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="ปกติ">ปกติ</option>
                        <option value="พิเศษ">พิเศษ</option>
                        <option value="ไม่ระบุ">ไม่ระบุ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        เกรดที่ได้
                      </label>
                      <select
                        value={grade}
                        onChange={e => setGrade(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all text-sm appearance-none cursor-pointer"
                      >
                        {['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'W', 'ไม่ระบุ'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      รีวิว
                    </label>
                    <span className={`text-[10px] font-bold transition-colors ${comment.length < 20 ? 'text-neutral-300' : 'text-green-500'}`}>
                      {comment.length} / 20 ตัวอักษรขั้นต่ำ
                    </span>
                  </div>
                  <textarea
                    required
                    minLength={20}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="วิชานี้เรียนเกี่ยวกับอะไร? อาจารย์สอนดีไหม? การให้คะแนนเป็นยังไง? มีทิปอะไรแนะนำ?"
                    rows={5}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all text-sm resize-y leading-relaxed"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1.5 tracking-wide">
                    แชร์ประสบการณ์จริง เพื่อเพื่อนนักศึกษาคนอื่น
                  </p>
                </div>

                {/* Submit — full width, prominent */}
                <button
                  type="submit"
                  disabled={isSubmitting || comment.length < 20}
                  className="w-full bg-[#9E76B4] hover:bg-[#8A5DA1] active:bg-[#7A4E91] text-white font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm tracking-wide"
                >
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งรีวิว →'}
                </button>
              </form>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}

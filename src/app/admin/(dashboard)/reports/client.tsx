'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Trash2, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { dismissReport, deleteReview } from '@/app/admin/actions';

interface ReviewItem {
  id: string;
  course_code: string | null;
  course_name: string | null;
  reviewer_name: string | null;
  grade: string | null;
  academic_year: string | null;
  semester: string | null;
  comment: string;
  report_count: number | null;
  like_count: number | null;
  created_at: string | null;
}

export function ReportsClient({
  reviews,
}: {
  reviews: ReviewItem[];
}) {
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDismiss = (id: string) => {
    setOptimisticIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      try {
        await dismissReport(id);
        toast.success('ปล่อยผ่านสำเร็จ');
      } catch {
        toast.error('เกิดข้อผิดพลาด');
        setOptimisticIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  const handleDelete = (id: string) => {
    setOptimisticIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      try {
        await deleteReview(id);
        toast.success('ลบรีวิวสำเร็จ');
        setDeleteConfirm(null);
      } catch {
        toast.error('เกิดข้อผิดพลาด');
        setOptimisticIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">รีวิวที่ถูกรายงาน</h1>
        <p className="text-sm text-neutral-400 mt-1">ตรวจสอบและจัดการรีวิวที่ถูกรายงานโดยผู้ใช้</p>
      </div>

      {/* Review Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {reviews.map((r) => {
            const isOptimistic = optimisticIds.has(r.id);
            return (
              <motion.div
                key={r.id}
                layout="position"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: isOptimistic ? 0.4 : 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-neutral-50 bg-neutral-50/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-sm text-[#9E76B4]">{r.course_code}</span>
                    <span className="text-sm text-neutral-500 truncate">{r.course_name}</span>
                  </div>
                  <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                    <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5 hidden sm:inline" />
                    {r.report_count} <span className="hidden sm:inline">รายงาน</span>
                  </span>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-medium text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-full">
                      {r.reviewer_name || 'ไม่ระบุ'}
                    </span>
                    {r.grade && r.grade !== 'ไม่ระบุ' && (
                      <span className="text-xs font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100">
                        เกรด {r.grade}
                      </span>
                    )}
                    {r.semester && r.semester !== 'ไม่ระบุ' && (
                      <span className="text-xs font-medium text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ปี {r.academic_year} เทอม {r.semester}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400">{formatDate(r.created_at)}</span>
                  </div>

                  <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap break-words">{r.comment}</p>

                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-50">
                    <button
                      onClick={() => handleDismiss(r.id)}
                      disabled={isOptimistic}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      ปล่อยผ่าน
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(r.id)}
                      disabled={isOptimistic}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      ลบถาวร
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {reviews.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200/80">
            <AlertTriangle className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm font-medium">ไม่มีรีวิวที่ถูกรายงาน</p>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-neutral-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">ลบรีวิวถาวร?</h3>
                <p className="text-sm text-neutral-500 mb-6">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={isPending}
                    className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isPending ? 'กำลังลบ...' : 'ลบถาวร'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

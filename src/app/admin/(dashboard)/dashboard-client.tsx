'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, MessageSquare, AlertTriangle, ArrowRight, X, Trash2 } from 'lucide-react';
import { deleteReview } from '@/app/admin/actions';

interface Stats {
  courses: number;
  reviews: number;
  reported: number;
}

interface RecentReview {
  id: string;
  course_code: string | null;
  course_name: string | null;
  reviewer_name: string | null;
  grade: string | null;
  comment: string;
  created_at: string | null;
}

interface TopReported {
  id: string;
  course_code: string | null;
  course_name: string | null;
  reviewer_name: string | null;
  comment: string;
  report_count: number | null;
  grade: string | null;
  created_at: string | null;
}

const statCards = [
  {
    key: 'courses' as const,
    label: 'รายวิชาทั้งหมด',
    href: '/admin/courses',
    icon: BookOpen,
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-t-blue-500',
  },
  {
    key: 'reviews' as const,
    label: 'รีวิวทั้งหมด',
    href: '/admin/reviews',
    icon: MessageSquare,
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-t-emerald-500',
  },
  {
    key: 'reported' as const,
    label: 'รีวิวที่ถูกรายงาน',
    href: '/admin/reports',
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-t-amber-500',
  },
];

function formatDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

const gradeColor: Record<string, string> = {
  'A': 'bg-emerald-50 text-emerald-700',
  'B+': 'bg-emerald-50 text-emerald-700',
  'B': 'bg-green-50 text-green-700',
  'C+': 'bg-green-50 text-green-700',
  'C': 'bg-yellow-50 text-yellow-700',
  'D+': 'bg-yellow-50 text-yellow-700',
  'D': 'bg-orange-50 text-orange-700',
  'F': 'bg-red-50 text-red-700',
  'W': 'bg-neutral-100 text-neutral-600',
  'S': 'bg-blue-50 text-blue-700',
  'U': 'bg-red-50 text-red-700',
};

export function DashboardClient({
  stats,
  recentReviews,
  topReported,
}: {
  stats: Stats;
  recentReviews: RecentReview[];
  topReported: TopReported[];
}) {
  type ReviewItem = RecentReview | TopReported;
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteReview(id);
      setConfirmDeleteId(null);
      setSelectedReview(null);
    } catch { setDeletingId(null); }
  };

  useEffect(() => {
    if (selectedReview || confirmDeleteId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedReview, confirmDeleteId]);

  return (
    <div className="space-y-6 lg:space-y-8 pt-14 lg:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">ภาพรวมทั้งหมด</h1>
        <p className="text-sm text-neutral-400 mt-1">สรุปจำนวนรายวิชา รีวิว และรีวิวที่ถูกรายงานในระบบ</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.06 }}
          >
            <Link
              href={card.href}
              className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all px-5 py-4 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} flex-shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.text}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-neutral-900 tracking-tight">{stats[card.key].toLocaleString()}</span>
                <span className="text-sm text-neutral-400 font-medium">{card.label}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Reviews - Table (desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden"
      >
        <div className="px-5 lg:px-6 py-4 lg:py-5 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900">รีวิวล่าสุด</h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">วิชา</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">ผู้รีวิว</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">เกรด</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">วันที่</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {recentReviews.map((r) => (
                <tr key={r.id} className="border-t border-neutral-50 hover:bg-[#FAF9F5] transition-colors cursor-pointer" onClick={() => setSelectedReview(r)}>
                  <td className="px-6 py-3.5">
                    <span className="font-mono font-semibold text-[#9E76B4]">{r.course_code}</span>
                    <span className="text-neutral-400 ml-2 text-xs">{r.course_name}</span>
                  </td>
                  <td className="px-6 py-3.5 text-neutral-600">{r.reviewer_name || 'ไม่ระบุ'}</td>
                  <td className="px-6 py-3.5">
                    {r.grade && r.grade !== 'ไม่ระบุ' ? (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${gradeColor[r.grade] || 'bg-purple-50 text-purple-700'}`}>
                        {r.grade}
                      </span>
                    ) : (
                      <span className="text-neutral-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-neutral-400 text-xs">{formatDate(r.created_at)}</td>
                  <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setConfirmDeleteId(r.id)}
                      disabled={deletingId === r.id}
                      className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-neutral-50">
          {recentReviews.map((r) => (
            <div key={r.id} className="px-5 py-3.5 cursor-pointer active:bg-neutral-50" onClick={() => setSelectedReview(r)}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className="font-mono font-bold text-[#9E76B4] text-sm">{r.course_code}</span>
                  <span className="text-neutral-400 text-xs ml-1.5">{r.course_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {r.grade && r.grade !== 'ไม่ระบุ' && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${gradeColor[r.grade] || 'bg-purple-50 text-purple-700'}`}>
                      {r.grade}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(r.id); }}
                    disabled={deletingId === r.id}
                    className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>{r.reviewer_name || 'ไม่ระบุ'}</span>
                <span>{formatDate(r.created_at)}</span>
              </div>
            </div>
          ))}
          {recentReviews.length === 0 && (
            <div className="px-5 py-10 text-center text-neutral-400 text-sm">ไม่มีรีวิว</div>
          )}
        </div>
      </motion.div>

      {/* Top Reported - Table (desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden"
      >
        <div className="px-5 lg:px-6 py-4 lg:py-5 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900">รีวิวที่ถูกรายงานมากที่สุด</h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">วิชา</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">ผู้รีวิว</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Comment</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Report</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {topReported.map((r) => (
                <tr key={r.id} className="border-t border-neutral-50 hover:bg-[#FAF9F5] transition-colors cursor-pointer" onClick={() => setSelectedReview(r)}>
                  <td className="px-6 py-3.5">
                    <span className="font-mono font-semibold text-[#9E76B4]">{r.course_code}</span>
                    <span className="text-neutral-400 ml-2 text-xs">{r.course_name}</span>
                  </td>
                  <td className="px-6 py-3.5 text-neutral-600">{r.reviewer_name || 'ไม่ระบุ'}</td>
                  <td className="px-6 py-3.5 text-neutral-500 text-xs max-w-[200px] truncate">{truncate(r.comment, 80)}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-bold bg-red-500 text-white px-2.5 py-1 rounded-full">{r.report_count}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setConfirmDeleteId(r.id)}
                      disabled={deletingId === r.id}
                      className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {topReported.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-neutral-400 text-sm">
                    ไม่มีรีวิวที่ถูกรายงาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-neutral-50">
          {topReported.map((r) => (
            <div key={r.id} className="px-5 py-3.5 cursor-pointer active:bg-neutral-50" onClick={() => setSelectedReview(r)}>
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <span className="font-mono font-bold text-[#9E76B4] text-sm">{r.course_code}</span>
                  <span className="text-neutral-400 text-xs ml-1.5">{r.course_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{r.report_count}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(r.id); }}
                    disabled={deletingId === r.id}
                    className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mb-1 line-clamp-2">{truncate(r.comment, 80)}</p>
              <span className="text-xs text-neutral-400">{r.reviewer_name || 'ไม่ระบุ'}</span>
            </div>
          ))}
          {topReported.length === 0 && (
            <div className="px-5 py-10 text-center text-neutral-400 text-sm">ไม่มีรีวิวที่ถูกรายงาน</div>
          )}
        </div>
      </motion.div>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 text-center mb-1">ลบรีวิว</h3>
              <p className="text-sm text-neutral-500 text-center mb-6">ต้องการลบรีวิวนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-neutral-500 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deletingId === confirmDeleteId}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deletingId === confirmDeleteId ? 'กำลังลบ...' : 'ลบ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReview(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between px-5 py-4 border-b border-neutral-100">
                <div>
                  <span className="font-mono font-bold text-[#9E76B4] text-lg">{selectedReview.course_code}</span>
                  <span className="text-neutral-400 text-sm ml-2">{selectedReview.course_name}</span>
                </div>
                <button onClick={() => setSelectedReview(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <div className="flex items-center flex-wrap gap-2 text-sm text-neutral-500">
                  <span>{selectedReview.reviewer_name || 'ไม่ระบุ'}</span>
                  {selectedReview.created_at && (
                    <>
                      <span className="text-neutral-200">|</span>
                      <span>{formatDate(selectedReview.created_at)}</span>
                    </>
                  )}
                  {selectedReview.grade && selectedReview.grade !== 'ไม่ระบุ' && (
                    <>
                      <span className="text-neutral-200">|</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${gradeColor[selectedReview.grade] || 'bg-purple-50 text-purple-700'}`}>
                        {selectedReview.grade}
                      </span>
                    </>
                  )}
                  {'report_count' in selectedReview && selectedReview.report_count != null && selectedReview.report_count > 0 && (
                    <>
                      <span className="text-neutral-200">|</span>
                      <span className="text-xs font-bold bg-red-500 text-white px-2.5 py-1 rounded-full">
                        ถูกรายงาน {selectedReview.report_count}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">{selectedReview.comment}</p>
              </div>
              <div className="px-5 py-3 border-t border-neutral-100 flex justify-end">
                <button
                  onClick={() => setConfirmDeleteId(selectedReview.id)}
                  disabled={deletingId === selectedReview.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบรีวิว
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

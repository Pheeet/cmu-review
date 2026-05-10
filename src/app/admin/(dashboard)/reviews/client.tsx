'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Trash2, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteReview, bulkDeleteReviews } from '@/app/admin/actions';

interface ReviewRow {
  id: string;
  course_code: string | null;
  course_name: string | null;
  reviewer_name: string | null;
  grade: string | null;
  academic_year: string | null;
  comment: string;
  report_count: number | null;
  like_count: number | null;
  created_at: string | null;
}

const grades = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'W'];
const sorts = [
  { value: 'recent', label: 'วันที่ล่าสุด' },
  { value: 'likes', label: 'Like มากสุด' },
  { value: 'reports', label: 'Report มากสุด' },
];

export function ReviewsClient({
  reviews,
  total,
  page,
  limit,
  search: initialSearch,
  grade,
  sort,
}: {
  reviews: ReviewRow[];
  total: number;
  page: number;
  limit: number;
  search: string;
  grade: string;
  sort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);

  const totalPages = Math.ceil(total / limit);
  const allSelected = reviews.length > 0 && reviews.every((r) => selected.has(r.id));

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val) params.set(key, val);
        else params.delete(key);
      }
      router.push(`/admin/reviews?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(reviews.map((r) => r.id)));
  };

  const handleDelete = (ids: string[]) => {
    startTransition(async () => {
      try {
        if (ids.length === 1) await deleteReview(ids[0]);
        else await bulkDeleteReviews(ids);
        toast.success(`ลบ${ids.length > 1 ? ` ${ids.length} รีวิว` : 'รีวิว'}สำเร็จ`);
        setSelected(new Set());
        setDeleteConfirm(null);
        router.refresh();
      } catch {
        toast.error('เกิดข้อผิดพลาด');
      }
    });
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">จัดการรีวิว</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm px-4 py-3">
        <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateParams({ search: searchQuery, page: '1' })}
              placeholder="ค้นหา comment, รหัสวิชา, ชื่อวิชา..."
              className="w-full h-11 pl-10 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); updateParams({ search: '', page: '1' }); }}
                className="absolute right-1 inset-y-0 w-9 flex items-center justify-center text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={grade}
            onChange={(e) => updateParams({ grade: e.target.value, page: '1' })}
            className="h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="all">ทุกเกรด</option>
            {grades.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all appearance-none cursor-pointer"
          >
            {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5"
        >
          <span className="text-sm font-semibold text-red-600">เลือก {selected.size} รายการ</span>
          <div className="flex-1" />
          <button
            onClick={() => setDeleteConfirm({ type: 'bulk' })}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ลบที่เลือก
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-neutral-400 hover:text-neutral-600 ml-1">
            ยกเลิก
          </button>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleAll} className="text-neutral-400 hover:text-[#9E76B4] transition-colors">
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">วิชา</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ผู้รีวิว</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">เกรด</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ปี</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Like</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Report</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">วันที่</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {reviews.map((r) => {
                  const isSelected = selected.has(r.id);
                  return (
                    <motion.tr
                      key={r.id}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                      className={`border-b border-neutral-50 transition-colors ${
                        isSelected ? 'bg-purple-50/50' : 'hover:bg-neutral-50/50'
                      }`}
                    >
                      <td className="px-3 py-3">
                        <button onClick={() => toggleSelect(r.id)} className="text-neutral-400 hover:text-[#9E76B4] transition-colors">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-[#9E76B4]" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-[#9E76B4] text-xs">{r.course_code}</span>
                        <span className="text-neutral-400 ml-1.5 text-xs truncate max-w-[120px] inline-block align-bottom">{r.course_name}</span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 text-xs">{r.reviewer_name || 'ไม่ระบุ'}</td>
                      <td className="px-4 py-3">
                        {r.grade && r.grade !== 'ไม่ระบุ' ? (
                          <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{r.grade}</span>
                        ) : <span className="text-neutral-300 text-xs">-</span>}
                      </td>
                      <td className="px-4 py-3 text-neutral-400 text-xs">{r.academic_year || '-'}</td>
                      <td className="px-4 py-3 text-neutral-600 text-xs font-semibold">{r.like_count ?? 0}</td>
                      <td className="px-4 py-3">
                        {(r.report_count ?? 0) > 0 ? (
                          <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{r.report_count}</span>
                        ) : <span className="text-neutral-300 text-xs">0</span>}
                      </td>
                      <td className="px-4 py-3 text-neutral-400 text-xs">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteConfirm({ type: 'single', id: r.id })}
                          disabled={isPending}
                          title="ลบ"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-neutral-400 text-sm">ไม่พบรีวิว</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-400">{total} รีวิว · หน้า {page}/{totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => updateParams({ page: String(page - 1) })} disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4 text-neutral-500" />
              </button>
              <button onClick={() => updateParams({ page: String(page + 1) })} disabled={page >= totalPages}
                className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-neutral-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">
                  {deleteConfirm.type === 'bulk' ? `ลบ ${selected.size} รีวิว?` : 'ลบรีวิวถาวร?'}
                </h3>
                <p className="text-sm text-neutral-500 mb-6">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                <div className="flex gap-2 w-full">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors">
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => {
                      const ids = deleteConfirm.type === 'bulk'
                        ? Array.from(selected)
                        : deleteConfirm.id ? [deleteConfirm.id] : [];
                      handleDelete(ids);
                    }}
                    disabled={isPending}
                    className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm">
                    {isPending ? 'กำลังลบ...' : 'ลบ'}
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

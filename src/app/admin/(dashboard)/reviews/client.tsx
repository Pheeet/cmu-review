'use client';

import { useState, useTransition, useCallback, Fragment, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Listbox, Transition } from '@headlessui/react';
import { Search, X, Trash2, ChevronDown, ChevronLeft, ChevronRight, CheckSquare, Square, Check, SlidersHorizontal, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteReview, bulkDeleteReviews } from '@/app/admin/actions';

interface ReviewRow {
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

const grades = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'W'];
const sorts = [
  { value: 'recent', label: 'วันที่ล่าสุด' },
  { value: 'likes', label: 'Like มากสุด' },
  { value: 'reports', label: 'Report มากสุด' },
];

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
};

function Dropdown<T extends string>({
  value,
  onChange,
  options,
  icon,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  icon?: React.ReactNode;
}) {
  const label = options.find(o => o.value === value)?.label ?? value;
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative w-full">
        <Listbox.Button className="flex items-center gap-2 h-11 px-3 pr-8 w-full text-sm text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E76B4]/40 cursor-pointer border border-neutral-200 bg-neutral-50">
          {icon && <span className="text-neutral-400 flex-shrink-0">{icon}</span>}
          <span className="truncate flex-1 text-left">{label}</span>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
        </Listbox.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-150"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-100"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Listbox.Options className="absolute left-0 top-full z-50 mt-2 min-w-[200px] max-h-[236px] overflow-y-auto overscroll-contain bg-white border border-neutral-200 rounded-2xl shadow-xl focus:outline-none p-2">
            {options.map(opt => (
              <Listbox.Option
                key={opt.value}
                value={opt.value}
                className={({ active }) =>
                  `flex items-center min-h-[44px] py-2 gap-2 px-4 text-sm cursor-pointer select-none transition-colors rounded-xl ${active ? 'bg-purple-50 text-[#9E76B4]' : 'text-neutral-700'}`
                }
              >
                {({ selected }) => (
                  <>
                    <span className="flex-1 truncate font-medium leading-snug">{opt.label}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-[#9E76B4] flex-shrink-0" />}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

export function ReviewsClient({
  reviews,
  faculties,
  total,
  page,
  limit,
  search: initialSearch,
  faculty: initialFaculty,
  grade: initialGrade,
  sort: initialSort,
}: {
  reviews: ReviewRow[];
  faculties: string[];
  total: number;
  page: number;
  limit: number;
  search: string;
  faculty: string;
  grade: string;
  sort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit);
  const allSelected = reviews.length > 0 && reviews.every((r) => selected.has(r.id));

  const modalOpen = !!deleteConfirm;

  useEffect(() => {
    if (modalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const facultyOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'ทุกคณะ' },
    ...faculties.map(f => ({ value: f, label: f })),
  ];

  const gradeOpts: { value: string; label: string }[] = [
    { value: 'all', label: 'ทุกเกรด' },
    ...grades.map(g => ({ value: g, label: g })),
  ];

  const sortOpts: { value: string; label: string }[] = [
    { value: 'recent', label: 'วันที่ล่าสุด' },
    { value: 'likes', label: 'ไลค์มากที่สุด' },
    { value: 'reports', label: 'รายงานมากที่สุด' },
  ];

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

  const handleFilterChange = (key: string, value: string) => {
    updateParams({ [key]: value, page: '1' });
  };

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
    <div className="space-y-6 pt-14 lg:pt-0">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">จัดการรีวิว</h1>
          <p className="text-sm text-neutral-400 mt-1">เรียกดู ค้นหา และจัดการข้อมูลรีวิวทั้งหมดในระบบ</p>
        </div>
        <motion.span
          key={total}
          initial={{ scale: 0.85, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="hidden sm:block text-sm font-semibold text-[#9E76B4] bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full flex-shrink-0"
        >
          {total} รีวิว
        </motion.span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm px-4 sm:px-5 py-3">
        <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
          {/* Search + Faculty */}
          <div className="flex flex-row gap-2 md:flex-1 md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateParams({ search: searchQuery, page: '1' })}
                placeholder="ค้นหา comment, รหัสวิชา..."
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
            <div className="w-28 md:w-auto flex-shrink-0">
              <Dropdown value={initialFaculty} onChange={(v) => handleFilterChange('faculty', v)} options={facultyOptions} />
            </div>
          </div>

          <div className="hidden md:block w-px h-6 bg-neutral-200 self-center" />

          {/* Grade + Sort */}
          <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-2">
            <Dropdown value={initialGrade} onChange={(v) => handleFilterChange('grade', v)} options={gradeOpts} />
            <Dropdown value={initialSort} onChange={(v) => handleFilterChange('sort', v)} options={sortOpts} icon={<SlidersHorizontal className="w-3.5 h-3.5" />} />
          </div>
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

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleAll} className="text-neutral-400 hover:text-[#9E76B4] transition-colors">
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">วิชา</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">ผู้รีวิว</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">เกรด</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">ปี</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Like</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Report</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">วันที่</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => {
                  const isSelected = selected.has(r.id);
                  const isExpanded = expandedId === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr
                        className={`border-t border-neutral-50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-purple-50/30' : isSelected ? 'bg-purple-50/50' : 'hover:bg-[#FAF9F5]'
                        }`}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSelect(r.id)} className="text-neutral-400 hover:text-[#9E76B4] transition-colors">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-[#9E76B4]" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                          <span className="font-mono font-bold text-[#9E76B4] text-xs">{r.course_code}</span>
                          <span className="text-neutral-400 ml-1.5 text-xs truncate max-w-[120px] inline-block align-bottom">{r.course_name}</span>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 text-xs" onClick={() => setExpandedId(isExpanded ? null : r.id)}>{r.reviewer_name || 'ไม่ระบุ'}</td>
                        <td className="px-4 py-3" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                          {r.grade && r.grade !== 'ไม่ระบุ' ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gradeColor[r.grade] || 'bg-green-50 text-green-700'}`}>{r.grade}</span>
                          ) : <span className="text-neutral-300 text-xs">-</span>}
                        </td>
                        <td className="px-4 py-3 text-neutral-400 text-xs" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                          {r.semester && r.semester !== 'ไม่ระบุ' ? `ปี ${r.academic_year} เทอม ${r.semester}` : r.academic_year || '-'}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 text-xs font-semibold" onClick={() => setExpandedId(isExpanded ? null : r.id)}>{r.like_count ?? 0}</td>
                        <td className="px-4 py-3" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                          {(r.report_count ?? 0) > 0 ? (
                            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{r.report_count}</span>
                          ) : <span className="text-neutral-300 text-xs">0</span>}
                        </td>
                        <td className="px-4 py-3 text-neutral-400 text-xs" onClick={() => setExpandedId(isExpanded ? null : r.id)}>{formatDate(r.created_at)}</td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'single', id: r.id })}
                            disabled={isPending}
                            title="ลบ"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-neutral-50/50"
                        >
                          <td colSpan={9} className="px-5 py-4">
                            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap break-words max-w-3xl">{r.comment}</p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-14 text-center text-neutral-400 text-sm">ไม่พบรีวิว</td>
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

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        <AnimatePresence mode="popLayout">
          {reviews.map((r) => {
            const isSelected = selected.has(r.id);
            const isExpanded = expandedId === r.id;
            return (
              <motion.div
                key={r.id}
                layout="position"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className={`bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden ${isExpanded ? 'ring-1 ring-[#9E76B4]/20' : ''}`}
              >
                <div
                  className="px-5 py-3.5 cursor-pointer active:bg-neutral-50"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(r.id); }}
                        className="text-neutral-400 hover:text-[#9E76B4] transition-colors flex-shrink-0"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-[#9E76B4]" /> : <Square className="w-4 h-4" />}
                      </button>
                      <span className="font-mono font-bold text-[#9E76B4] text-sm">{r.course_code}</span>
                      {r.grade && r.grade !== 'ไม่ระบุ' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gradeColor[r.grade] || 'bg-green-50 text-green-700'}`}>{r.grade}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(r.report_count ?? 0) > 0 && (
                        <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{r.report_count}</span>
                      )}
                      <span className="text-[10px] text-neutral-300">♥ {r.like_count ?? 0}</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500">{r.reviewer_name || 'ไม่ระบุ'} · {formatDate(r.created_at)}</p>
                  {!isExpanded && (
                    <p className="text-sm text-neutral-600 mt-1.5 line-clamp-2">{r.comment}</p>
                  )}
                </div>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-5 pb-3.5 border-t border-neutral-100 mt-0"
                  >
                    <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap break-words pt-3">{r.comment}</p>
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => setDeleteConfirm({ type: 'single', id: r.id })}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        ลบรีวิว
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {reviews.length === 0 && (
          <div className="text-center py-14 bg-white rounded-2xl border border-neutral-200/80">
            <p className="text-neutral-400 text-sm">ไม่พบรีวิว</p>
          </div>
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-1 py-2">
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

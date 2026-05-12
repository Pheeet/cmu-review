'use client';

import { useState, useCallback, Fragment, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Listbox, Transition, Combobox } from '@headlessui/react';
import { Plus, Pencil, Trash2, Search, X, ChevronDown, ChevronLeft, ChevronRight, Check, SlidersHorizontal, Eye, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCourse, updateCourse, deleteCourse } from './actions';
import { deleteReview } from '@/app/admin/actions';

interface CourseRow {
  id: string;
  code: string;
  name_th: string | null;
  name_en: string | null;
  faculty: string | null;
  credits: number | null;
  description: string | null;
  review_count: number;
}

interface FormData {
  code: string;
  name_th: string;
  name_en: string;
  faculty: string;
  credits: string;
  description: string;
}

const emptyForm: FormData = {
  code: '',
  name_th: '',
  name_en: '',
  faculty: '',
  credits: '',
  description: '',
};

type SortKey = 'code' | 'reviews' | 'name';

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

export function CoursesClient({
  courses,
  faculties,
  creditOptions,
  total,
  page,
  limit,
  search: initialSearch,
  faculty: initialFaculty,
  credits: initialCredits,
  sort: initialSort,
}: {
  courses: CourseRow[];
  faculties: string[];
  creditOptions: number[];
  total: number;
  page: number;
  limit: number;
  search: string;
  faculty: string;
  credits: string;
  sort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [facultyQuery, setFacultyQuery] = useState('');
  const [reviewsModal, setReviewsModal] = useState<{ courseId: string; courseCode: string } | null>(null);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [deletingReview, setDeletingReview] = useState(false);
  const [requestedCourses, setRequestedCourses] = useState<{ code: string; count: number }[]>([]);

  const modalOpen = isModalOpen || !!deleteConfirm || !!reviewsModal || !!deleteReviewId;

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const totalPages = Math.ceil(total / limit);

  const facultyOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'ทุกคณะ' },
    ...faculties.map(f => ({ value: f, label: f })),
  ];

  const creditOpts: { value: string; label: string }[] = [
    { value: 'all', label: 'ทุกหน่วยกิต' },
    ...creditOptions.map(c => ({ value: String(c), label: `${c} หน่วยกิต` })),
  ];

  const sortOptions: { value: string; label: string }[] = [
    { value: 'code', label: 'เรียงตามรหัส' },
    { value: 'reviews', label: 'รีวิวมากที่สุด' },
    { value: 'name', label: 'เรียงตามชื่อ A–Z' },
  ];

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val) params.set(key, val);
        else params.delete(key);
      }
      router.push(`/admin/courses?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateParams({ search: searchQuery, page: '1' });
  };

  const handleFilterChange = (key: string, value: string) => {
    updateParams({ [key]: value, page: '1' });
  };

  const openReviews = async (courseId: string, courseCode: string) => {
    setReviewsModal({ courseId, courseCode });
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?courseId=${courseId}`);
      const data = await res.json();
      setReviewsList(data.reviews || data || []);
    } catch {
      toast.error('โหลดรีวิวไม่สำเร็จ');
    } finally {
      setLoadingReviews(false);
    }
  };

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

  const openCreate = async () => {
    setEditingId(null);
    setForm(emptyForm);
    setFacultyQuery('');
    setIsModalOpen(true);
    try {
      const res = await fetch('/api/course-requests');
      if (res.ok) {
        const data = await res.json();
        setRequestedCourses(data);
      }
    } catch {}
  };

  const openEdit = (c: CourseRow) => {
    setEditingId(c.id);
    setFacultyQuery('');
    setForm({
      code: c.code,
      name_th: c.name_th || '',
      name_en: c.name_en || '',
      faculty: c.faculty || '',
      credits: c.credits?.toString() || '',
      description: c.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) {
      toast.error('กรุณากรอกรหัสวิชา');
      return;
    }
    if (!form.name_th.trim()) {
      toast.error('กรุณากรอกชื่อไทย');
      return;
    }
    if (!form.name_en.trim()) {
      toast.error('กรุณากรอกชื่ออังกฤษ');
      return;
    }
    if (!form.faculty.trim()) {
      toast.error('กรุณาเลือกคณะ');
      return;
    }
    if (!form.credits) {
      toast.error('กรุณาเลือกหน่วยกิต');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        name_th: form.name_th.trim(),
        name_en: form.name_en.trim(),
        faculty: form.faculty.trim(),
        credits: parseInt(form.credits) || 0,
        description: form.description.trim(),
      };
      if (editingId) {
        await updateCourse(editingId, payload);
        toast.success('แก้ไขวิชาสำเร็จ');
      } else {
        await createCourse(payload);
        toast.success('เพิ่มวิชาสำเร็จ');
      }
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteCourse(id);
      toast.success('ลบวิชาสำเร็จ');
      setDeleteConfirm(null);
      router.refresh();
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลบ');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteReviewId) return;
    setDeletingReview(true);
    try {
      await deleteReview(deleteReviewId);
      toast.success('ลบรีวิวสำเร็จ');
      setReviewsList((prev) => prev.filter((r) => r.id !== deleteReviewId));
      setDeleteReviewId(null);
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลบรีวิว');
    } finally {
      setDeletingReview(false);
    }
  };

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">จัดการรายวิชา</h1>
          <p className="text-sm text-neutral-400 mt-1">เพิ่ม แก้ไข หรือลบรายวิชาในระบบ</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <motion.span
            key={total}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="hidden sm:block text-sm font-semibold text-[#9E76B4] bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full"
          >
            {total} วิชา
          </motion.span>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-b from-[#9E76B4] to-[#8A5DA1] hover:from-[#8A5DA1] hover:to-[#7B5A94] text-white font-bold text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">เพิ่มวิชา</span>
            <span className="sm:hidden">เพิ่ม</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm px-4 sm:px-5 py-3">
        <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
          {/* Row 1: Search + Faculty */}
          <div className="flex flex-row gap-2 lg:flex-1 lg:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ค้นหารหัสวิชา ชื่อไทย..."
                className="w-full h-11 pl-10 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    updateParams({ search: '', page: '1' });
                  }}
                  className="absolute right-1 inset-y-0 w-9 flex items-center justify-center text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="w-32 sm:w-auto flex-shrink-0">
              <Dropdown
                value={initialFaculty}
                onChange={(v) => handleFilterChange('faculty', v)}
                options={facultyOptions}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-6 bg-neutral-200 self-center" />

          {/* Row 2: Credits + Sort */}
          <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center lg:gap-2">
            <Dropdown
              value={initialCredits}
              onChange={(v) => handleFilterChange('credits', v)}
              options={creditOpts}
            />
            <Dropdown
              value={initialSort}
              onChange={(v) => handleFilterChange('sort', v)}
              options={sortOptions}
              icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            />
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">รหัส</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">ชื่อไทย</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">คณะ</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">หน่วยกิต</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">รีวิว</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} onClick={() => openReviews(c.id, c.code)} className="border-t border-neutral-50 hover:bg-[#FAF9F5] transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-[#9E76B4]">{c.code}</span>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700 max-w-[200px] truncate">{c.name_th || '-'}</td>
                  <td className="px-5 py-3.5 text-neutral-400 text-xs max-w-[150px] truncate">{c.faculty || '-'}</td>
                  <td className="px-5 py-3.5 text-neutral-600">{c.credits ?? '-'}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-bold bg-[#9E76B4]/10 text-[#9E76B4] px-2.5 py-1 rounded-full">
                      {c.review_count}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openReviews(c.id, c.code)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-500 transition-colors"
                        title="ดูรีวิว"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="p-2 rounded-lg hover:bg-[#9E76B4]/10 text-neutral-400 hover:text-[#9E76B4] transition-colors"
                        title="แก้ไข"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(c.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-neutral-400">
                    ไม่พบรายวิชา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="lg:hidden divide-y divide-neutral-50">
          {courses.map((c) => (
            <div key={c.id} className="px-5 py-3.5 cursor-pointer active:bg-neutral-50" onClick={() => openReviews(c.id, c.code)}>
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-[#9E76B4] text-sm">{c.code}</span>
                    <span className="text-xs font-bold bg-[#9E76B4]/10 text-[#9E76B4] px-2 py-0.5 rounded-full">
                      {c.review_count}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 truncate">{c.name_th || '-'}</p>
                </div>
                <div className="flex items-center gap-1 ml-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 rounded-lg hover:bg-[#9E76B4]/10 text-neutral-400 hover:text-[#9E76B4] transition-colors"
                    title="แก้ไข"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(c.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span>{c.faculty || '-'}</span>
                <span>·</span>
                <span>{c.credits ?? '-'} หน่วยกิต</span>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="px-5 py-14 text-center text-neutral-400 text-sm">
              ไม่พบรายวิชา
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-400">
              {total} วิชา · หน้า {page}/{totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateParams({ page: String(page - 1) })}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-500" />
              </button>
              <button
                onClick={() => updateParams({ page: String(page + 1) })}
                disabled={page >= totalPages}
                className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-neutral-100"
            >
              <div className="flex items-center justify-between px-5 sm:px-6 pt-6 pb-4 border-b border-neutral-100">
                <h3 className="text-lg font-extrabold text-neutral-900">
                  {editingId ? 'แก้ไขวิชา' : 'เพิ่มวิชาใหม่'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
                {/* Requested Courses */}
                {!editingId && requestedCourses.length > 0 && (
                  <div className="bg-purple-50/50 rounded-xl border border-purple-100 p-4">
                    <p className="text-xs font-bold text-[#9E76B4] uppercase tracking-wider mb-3">วิชาที่นักศึกษาร้องขอ</p>
                    <div className="flex flex-wrap gap-2">
                      {requestedCourses.map((r) => (
                        <button
                          key={r.code}
                          onClick={() => setForm({ ...form, code: r.code })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm font-mono font-semibold text-[#9E76B4] hover:bg-purple-100 transition-colors"
                        >
                          {r.code}
                          <span className="text-[10px] font-bold text-purple-400">×{r.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                      รหัสวิชา *
                    </label>
                    <input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      maxLength={6}
                      placeholder="เช่น 204111"
                      className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                      หน่วยกิต
                    </label>
                    <Listbox
                      value={form.credits}
                      onChange={(v) => setForm({ ...form, credits: v })}
                    >
                      <div className="relative">
                        <Listbox.Button className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 text-left focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all flex items-center justify-between">
                          <span>{form.credits === '' ? 'เลือก' : form.credits}</span>
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg py-1 focus:outline-none">
                          {['0', '1', '2', '3'].map((val) => (
                            <Listbox.Option
                              key={val}
                              value={val}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2.5 pl-10 pr-4 text-sm ${
                                  active ? 'bg-[#9E76B4]/10 text-[#9E76B4]' : 'text-neutral-900'
                                }`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>{val}</span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9E76B4]">
                                      <Check className="w-4 h-4" />
                                    </span>
                                  )}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                    ชื่อไทย
                  </label>
                  <input
                    value={form.name_th}
                    onChange={(e) => setForm({ ...form, name_th: e.target.value })}
                    placeholder="เช่น แคลคูลัสและเรขาคณิตวิเคราะห์"
                    className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                    ชื่ออังกฤษ
                  </label>
                  <input
                    value={form.name_en}
                    onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                    placeholder="เช่น Calculus and Analytic Geometry"
                    className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                    คณะ
                  </label>
                  <Combobox
                    value={form.faculty}
                    onChange={(v) => setForm({ ...form, faculty: v ?? '' })}
                  >
                    <div className="relative">
                      <Combobox.Input
                        onChange={(e) => setFacultyQuery(e.target.value)}
                        displayValue={(v: string) => v}
                        placeholder="เลือกหรือพิมพ์ชื่อคณะ"
                        className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all pr-8"
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      </Combobox.Button>
                      <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto focus:outline-none">
                        {faculties
                          .filter((f) =>
                            f.toLowerCase().includes(facultyQuery.toLowerCase())
                          )
                          .map((f) => (
                            <Combobox.Option
                              key={f}
                              value={f}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2.5 pl-10 pr-4 text-sm ${
                                  active ? 'bg-[#9E76B4]/10 text-[#9E76B4]' : 'text-neutral-900'
                                }`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>{f}</span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9E76B4]">
                                      <Check className="w-4 h-4" />
                                    </span>
                                  )}
                                </>
                              )}
                            </Combobox.Option>
                          ))}
                        {faculties.filter((f) =>
                          f.toLowerCase().includes(facultyQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-2.5 text-sm text-neutral-400">ไม่พบคณะ</div>
                        )}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="อธิบายเนื้อหาวิชาโดยย่อ (ไม่บังคับ)"
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all resize-y"
                  />
                </div>
              </div>

              <div className="px-5 sm:px-6 py-4 border-t border-neutral-100 flex gap-2 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !form.code.trim() || !form.name_th.trim() || !form.name_en.trim() || !form.faculty.trim() || !form.credits}
                  className="px-6 py-2.5 bg-[#9E76B4] hover:bg-[#8A5DA1] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึก' : 'เพิ่มวิชา'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <h3 className="text-lg font-bold text-neutral-900 mb-2">ยืนยันการลบ</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  การลบวิชานี้จะลบรีวิวทั้งหมดที่เกี่ยวข้องด้วย ต้องการดำเนินการต่อ?
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={deleting}
                    className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {deleting ? 'กำลังลบ...' : 'ลบ'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reviews Modal */}
      <AnimatePresence>
        {reviewsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setReviewsModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-neutral-100"
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900">
                    รีวิวของ {reviewsModal.courseCode}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{reviewsList.length} รีวิว</p>
                </div>
                <button
                  onClick={() => setReviewsModal(null)}
                  className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4">
                {loadingReviews ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-[#9E76B4]/30 border-t-[#9E76B4] rounded-full animate-spin" />
                  </div>
                ) : reviewsList.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400 text-sm">ไม่มีรีวิว</div>
                ) : (
                  <div className="space-y-3">
                    {reviewsList.map((r: any) => (
                      <div key={r.id} className="bg-neutral-50 rounded-xl p-4 group relative">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-neutral-700 bg-white px-2.5 py-1 rounded-full border border-neutral-100">
                            {r.reviewer_name || 'ไม่ระบุ'}
                          </span>
                          {r.grade && r.grade !== 'ไม่ระบุ' && (
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${gradeColor[r.grade] || 'bg-purple-50 text-purple-700'}`}>
                              เกรด {r.grade}
                            </span>
                          )}
                          {r.semester && r.semester !== 'ไม่ระบุ' && (
                            <span className="text-xs text-neutral-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ปี {r.academic_year} เทอม {r.semester}
                            </span>
                          )}
                          <span className="text-xs text-neutral-300 ml-auto">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap break-words">{r.comment}</p>
                        <div className="flex justify-end mt-2 pt-2 border-t border-neutral-100">
                          <button
                            onClick={() => setDeleteReviewId(r.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            ลบรีวิว
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Review Confirm */}
      <AnimatePresence>
        {deleteReviewId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteReviewId(null)}
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
                <h3 className="text-lg font-bold text-neutral-900 mb-2">ลบรีวิวนี้?</h3>
                <p className="text-sm text-neutral-500 mb-6">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setDeleteReviewId(null)}
                    className="flex-1 py-2.5 text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleDeleteReview}
                    disabled={deletingReview}
                    className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {deletingReview ? 'กำลังลบ...' : 'ลบรีวิว'}
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

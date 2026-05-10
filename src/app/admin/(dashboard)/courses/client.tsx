'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCourse, updateCourse, deleteCourse } from './actions';

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

export function CoursesClient({
  courses,
  faculties,
  total,
  page,
  limit,
  search: initialSearch,
  faculty: initialFaculty,
}: {
  courses: CourseRow[];
  faculties: string[];
  total: number;
  page: number;
  limit: number;
  search: string;
  faculty: string;
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

  const totalPages = Math.ceil(total / limit);

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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (c: CourseRow) => {
    setEditingId(c.id);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">จัดการวิชา</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#9E76B4] hover:bg-[#8A5DA1] text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          เพิ่มวิชา
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="ค้นหารหัสวิชา ชื่อไทย..."
              className="w-full h-11 pl-10 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] transition-all"
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

          <select
            value={initialFaculty}
            onChange={(e) => updateParams({ faculty: e.target.value, page: '1' })}
            className="h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="all">ทุกคณะ</option>
            {faculties.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            className="h-11 px-5 bg-[#9E76B4] hover:bg-[#8A5DA1] text-white font-bold text-sm rounded-xl transition-all"
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">รหัส</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ชื่อไทย</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">คณะ</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">หน่วยกิต</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">รีวิว</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono font-semibold text-[#9E76B4]">{c.code}</span>
                  </td>
                  <td className="px-5 py-3 text-neutral-700 max-w-[200px] truncate">{c.name_th || '-'}</td>
                  <td className="px-5 py-3 text-neutral-500 text-xs max-w-[150px] truncate">{c.faculty || '-'}</td>
                  <td className="px-5 py-3 text-neutral-600">{c.credits ?? '-'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold bg-purple-50 text-[#9E76B4] px-2.5 py-1 rounded-full">
                      {c.review_count}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-2 rounded-lg hover:bg-purple-50 text-neutral-400 hover:text-[#9E76B4] transition-colors"
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
                  <td colSpan={6} className="px-5 py-12 text-center text-neutral-400">
                    ไม่พบรายวิชา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
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

              <div className="overflow-y-auto px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                      รหัสวิชา *
                    </label>
                    <input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                      หน่วยกิต
                    </label>
                    <input
                      type="number"
                      value={form.credits}
                      onChange={(e) => setForm({ ...form, credits: e.target.value })}
                      className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                    ชื่อไทย
                  </label>
                  <input
                    value={form.name_th}
                    onChange={(e) => setForm({ ...form, name_th: e.target.value })}
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
                    className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                    คณะ
                  </label>
                  <input
                    value={form.faculty}
                    onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                    list="faculty-list"
                    className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all"
                  />
                  <datalist id="faculty-list">
                    {faculties.map((f) => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-widest mb-2">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all resize-y"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-100 flex gap-2 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !form.code.trim()}
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
    </div>
  );
}

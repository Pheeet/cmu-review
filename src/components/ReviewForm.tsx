import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { submitReview } from '@/app/actions';

const BANNED_WORDS = ['คำหยาบ1', 'คำหยาว2', 'ไอ้สัส', 'ควย', 'เหี้ย'];

const currentYear = new Date().getFullYear() + 543;
const availableYears = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

interface ReviewFormProps {
  courseId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const selectCls = 'w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all pr-8';

function SelectField({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const selected = options.find(o => o.value === value);
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={selectCls}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
        <ChevronDown className="w-3.5 h-3.5" />
      </span>
      {/* Overlay to show selected label instead of raw value */}
    </div>
  );
}

export function ReviewForm({ courseId, onSuccess, onCancel }: ReviewFormProps) {
  const [reviewerName, setReviewerName] = useState('');
  const [academicYear, setAcademicYear] = useState(availableYears[0]);
  const [semester, setSemester] = useState('1');
  const [sectionType, setSectionType] = useState('ไม่ระบุ');
  const [grade, setGrade] = useState('ไม่ระบุ');
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFp() {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        setVisitorId(result.visitorId);
      } catch (err) {
        console.error('Error loading fingerprint in form', err);
      }
    }
    loadFp();
  }, []);

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
    if (hasSubmitted) return;
    setHasSubmitted(true);
    try {
      const result = await submitReview({
        course_id: courseId,
        academic_year: academicYear,
        semester,
        section_type: sectionType,
        grade,
        comment,
        reviewer_name: reviewerName || null,
        fingerprint_id: visitorId,
        rating: rating ? parseInt(rating) : null,
      });

      if (!result.success) throw new Error(result.error);

      toast.success('ส่งรีวิวสำเร็จ ขอบคุณ!');

      const localDoneStr = localStorage.getItem('cmureview_done');
      const localDone = localDoneStr ? JSON.parse(localDoneStr) : {};
      localDone[courseId] = true;
      localStorage.setItem('cmureview_done', JSON.stringify(localDone));

      onSuccess();

    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการส่งรีวิว');
    } finally {
      setIsSubmitting(false);
    }
  };

  const semesterOpts = [
    { value: '1', label: 'เทอม 1' },
    { value: '2', label: 'เทอม 2' },
    { value: '3', label: 'เทอม 3' },
    { value: 'ไม่ระบุ', label: 'ไม่ระบุ' },
  ];

  const sectionOpts = [
    { value: 'ภาคปกติ', label: 'ภาคปกติ' },
    { value: 'ภาคพิเศษ', label: 'ภาคพิเศษ' },
    { value: 'นานาชาติ', label: 'นานาชาติ' },
    { value: 'ไม่ระบุ', label: 'ไม่ระบุ' },
  ];

  const gradeOpts = [
    ...['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'W'].map(g => ({ value: g, label: g })),
    { value: 'ไม่ระบุ', label: 'ไม่ระบุ' },
  ];

  const ratingOpts = [
    { value: '', label: 'ไม่ระบุ' },
    ...Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) })),
  ];

  return (
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
          <SelectField
            value={academicYear}
            onChange={setAcademicYear}
            options={availableYears.map(y => ({ value: y, label: y }))}
          />
        </div>
      </div>

      {/* Row 2: Semester / Section / Grade / Rating */}
      <div>
        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
          รายละเอียดการเรียน
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              ภาคเรียน
            </label>
            <SelectField value={semester} onChange={setSemester} options={semesterOpts} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              ประเภท
            </label>
            <SelectField value={sectionType} onChange={setSectionType} options={sectionOpts} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              เกรดที่ได้
            </label>
            <SelectField value={grade} onChange={setGrade} options={gradeOpts} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              ความน่าเรียน
            </label>
            <SelectField value={rating} onChange={setRating} options={ratingOpts} />
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
        <p className="text-[10px] text-red-500 mt-1.5 tracking-wide font-medium">
          กรุณาแบ่งปันความคิดเห็นอย่างสุภาพ เพื่อร่วมกันสร้างสังคมการรีวิวที่ดี
        </p>
      </div>

      {/* Actions */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || comment.length < 20}
          className="w-full bg-[#9E76B4] hover:bg-[#8A5DA1] active:bg-[#7A4E91] text-white font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm tracking-wide"
        >
          {isSubmitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
        </button>
      </div>
    </form>
  );
}

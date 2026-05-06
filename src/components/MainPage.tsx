'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, GraduationCap, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { CourseCard } from '@/components/CourseCard';
import { CourseModal } from '@/components/CourseModal';
import { Course } from '@/types';
import { Toaster } from 'react-hot-toast';

interface MainPageProps {
  initialCourses: Course[];
  initialStats: Record<string, { count: number; avg: string | null }>;
}

type SortKey = 'code' | 'reviews' | 'name' | 'grade';

// ─── Headless dropdown ─────────────────────────────────────────────
import { Listbox, Transition } from '@headlessui/react';
import { Check } from 'lucide-react';
import { Fragment } from 'react';

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
      <div className="relative">
        <Listbox.Button className="flex items-center gap-2 h-11 px-3 pr-8 w-full sm:w-auto text-sm text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E76B4]/40 cursor-pointer">
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
                  `flex items-center h-11 gap-2 px-4 text-sm cursor-pointer select-none transition-colors rounded-xl ${active ? 'bg-purple-50 text-[#9E76B4]' : 'text-neutral-700'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span className="flex-1 truncate leading-none font-medium">{opt.label}</span>
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

// ─── FilterBar sub-component ───────────────────────────────────────
function FilterBar({
  query, setQuery,
  faculty, setFaculty,
  credits, setCredits,
  sort, setSort,
  faculties, creditOptions,
  count,
}: {
  query: string; setQuery: (v: string) => void;
  faculty: string; setFaculty: (v: string) => void;
  credits: string; setCredits: (v: string) => void;
  sort: SortKey; setSort: (v: SortKey) => void;
  faculties: string[]; creditOptions: number[];
  count: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const facultyOptions = [
    { value: 'all', label: 'ทุกคณะ' },
    ...faculties.map(f => ({ value: f, label: f })),
  ];

  const creditOpts = [
    { value: 'all', label: 'ทุกหน่วยกิต' },
    ...creditOptions.map(c => ({ value: String(c), label: `${c} หน่วยกิต` })),
  ];

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'code', label: 'เรียงตามรหัส' },
    { value: 'reviews', label: 'รีวิวมากที่สุด' },
    { value: 'name', label: 'เรียงตามชื่อ A–Z' },
    { value: 'grade', label: 'เรียงตามเกรด' },
  ];

  return (
    <div className="flex-shrink-0 sticky top-0 z-20 bg-[#FAF9F5]/95 backdrop-blur-md py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-4 sm:space-y-6">

        {/* Row 1: title/subtitle ← → count badge */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              รายวิชาทั้งหมด
            </h2>
            <p className="text-sm text-neutral-400 mt-2">
              ค้นหา กรอง และสำรวจวิชาเรียนทั้งหมด
            </p>
          </div>
          <motion.span
            key={count}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="mt-1 text-sm font-semibold text-[#9E76B4] bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full flex-shrink-0"
          >
            {count} วิชา
          </motion.span>
        </div>

        {/* Row 2: controls inside a white card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">

            {/* Search — flex-1 */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..."
                className="w-full h-11 pl-10 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] transition-all"
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-neutral-200 self-center" />

            {/* Dropdowns */}
            <Dropdown
              value={faculty}
              onChange={setFaculty}
              options={facultyOptions}
            />
            <Dropdown
              value={credits}
              onChange={setCredits}
              options={creditOpts}
            />
            <Dropdown
              value={sort}
              onChange={setSort}
              options={sortOptions}
              icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            />

          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────
export function MainPage({ initialCourses, initialStats }: MainPageProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [reviewStats, setReviewStats] = useState(initialStats);
  const [selected, setSelected] = useState<Course | null>(null);

  // Filter/sort state
  const [query, setQuery] = useState('');
  const [localQuery, setLocalQuery] = useState('');
  const [faculty, setFaculty] = useState('all');
  const [credits, setCredits] = useState('all');
  const [sort, setSort] = useState<SortKey>('code');

  const handleSearch = (q: string) => {
    const val = q.trim();
    if (val) {
      setQuery(val);
      // Latch logic will hide hero
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
    }
  };


  async function loadAll() {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const { courses: c, stats: s } = await res.json();
        setCourses(c);
        setReviewStats(s);
      }
    } catch { }
  }

  const faculties = useMemo(() => {
    const s = new Set(courses.map(c => c.faculty).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [courses]);

  const creditOptions = useMemo(() => {
    const s = new Set(courses.map(c => c.credits).filter((v): v is number => v !== null));
    return Array.from(s).sort((a, b) => a - b);
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = courses
      .filter(c => faculty === 'all' || c.faculty === faculty)
      .filter(c => credits === 'all' || String(c.credits) === credits)
      .filter(c =>
        !q ||
        c.code.toLowerCase().includes(q) ||
        (c.name_en && c.name_en.toLowerCase().includes(q)) ||
        (c.name_th && c.name_th.toLowerCase().includes(q))
      );

    if (sort === 'reviews') {
      list = [...list].sort((a, b) => (reviewStats[b.id]?.count || 0) - (reviewStats[a.id]?.count || 0));
    } else if (sort === 'name') {
      list = [...list].sort((a, b) => (a.name_en || '').localeCompare(b.name_en || ''));
    } else if (sort === 'grade') {
      list = [...list].sort((a, b) => {
        const ga = parseFloat(reviewStats[a.id]?.avg ?? '');
        const gb = parseFloat(reviewStats[b.id]?.avg ?? '');
        const hasA = !isNaN(ga);
        const hasB = !isNaN(gb);
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;  // no grade → go last
        if (!hasB) return -1;
        return gb - ga; // descending: A (4.0) first
      });
    } else {
      list = [...list].sort((a, b) => a.code.localeCompare(b.code));
    }

    return list;
  }, [courses, query, faculty, credits, sort, reviewStats]);

  // True when user has any active filter/search
  const isFiltering = query.trim().length > 0 || faculty !== 'all' || credits !== 'all';

  // Latch: once user interacts with filter, hero stays hidden for the session
  const [hasFiltered, setHasFiltered] = useState(false);
  useEffect(() => {
    if (isFiltering) setHasFiltered(true);
  }, [isFiltering]);

  // Hero is visible only before user has ever filtered
  const showHero = !hasFiltered;

  return (
    <main className="min-h-screen flex flex-col bg-[#FAF9F5] text-neutral-900">
      <Toaster position="bottom-center" />

      {/* ── Hero — hidden while searching/filtering ── */}
      <AnimatePresence>
        {showHero && (
          <motion.section
            key="hero"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="relative overflow-hidden border-b border-neutral-200 min-h-screen flex items-center"
            style={{
              backgroundImage: 'url(/namwan2.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/40 z-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none z-0" />

            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#9E76B4]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-[#9E76B4]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto px-5 py-20 w-full text-white">
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2 text-white font-semibold mb-4 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-white/20"
                >
                  <GraduationCap className="w-5 h-5 text-purple-300" />
                  <span className="text-sm tracking-wide">CMU Course Review</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                  className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 tracking-tight text-white"
                >
                  รีวิว ตัวฟรี <span className="text-purple-300">มช.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                  className="text-lg md:text-xl text-white/80 max-w-xl mb-10 leading-relaxed"
                >
                  ค้นหาและอ่านรีวิวจากรุ่นพี่ก่อนลงทะเบียน เพื่อประกอบการตัดสินใจ
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                  className="relative w-full max-w-xl group"
                >
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#9E76B4] transition-colors" />
                  <input
                    type="text"
                    value={localQuery}
                    onChange={e => setLocalQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch(localQuery)}
                    placeholder="ค้นหารหัสวิชา ชื่อไทย หรืออังกฤษ..."
                    className="w-full pl-12 pr-[110px] h-14 bg-white border border-neutral-200 rounded-2xl text-base text-neutral-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] transition-all"
                  />
                  <button
                    onClick={() => handleSearch(localQuery)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 bg-[#9E76B4] hover:bg-[#8A62A0] text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>ค้นหา</span>
                  </button>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 text-xs text-white/50"
                >
                  ข้อมูลรายวิชาอ้างอิงจาก ทีมมช by AutoBot
                </motion.p>
              </div>
            </div>

            <button
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors animate-bounce cursor-pointer z-10"
              aria-label="เลื่อนไปดูรายวิชา"
            >
              <span className="text-xs font-medium tracking-wide uppercase">ดูรายวิชา</span>
              <ChevronDown className="w-5 h-5" />
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Course section ── */}
      <section id="courses" className="scroll-mt-0 flex-1">
        {/* Sticky filter bar */}
        <FilterBar
          query={query} setQuery={setQuery}
          faculty={faculty} setFaculty={setFaculty}
          credits={credits} setCredits={setCredits}
          sort={sort} setSort={setSort}
          faculties={faculties} creditOptions={creditOptions}
          count={filtered.length}
        />

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-8">

          {/* Empty state — own AnimatePresence so it fades in/out independently */}
          <AnimatePresence>
            {filtered.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="text-center py-24 text-neutral-500 bg-neutral-50 rounded-3xl border border-neutral-100 flex flex-col items-center"
              >
                <Search className="w-12 h-12 text-neutral-300 mb-4" />
                <p className="text-lg font-medium text-neutral-800">ไม่พบรายวิชาที่ค้นหา</p>
                <p className="text-neutral-400 text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกทุกคณะ</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card grid — plain div so layout prop works correctly inside CSS Grid */}
          {filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((c, i) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    transition={{
                      duration: 0.28,
                      delay: Math.min(i * 0.03, 0.3),
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <CourseCard
                      course={c}
                      reviewCount={reviewStats[c.id]?.count || 0}
                      avgGrade={reviewStats[c.id]?.avg}
                      onClick={() => setSelected(c)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-[#FAF9F5] py-6 text-center text-sm text-neutral-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4 text-neutral-400" />
          <span className="font-semibold text-neutral-700">รีวิวรายวิชา มช.</span>
        </div>
        สำหรับนักศึกษามหาวิทยาลัยเชียงใหม่
      </footer>

      <AnimatePresence>
        {selected && (
          <CourseModal
            course={selected}
            onClose={() => setSelected(null)}
            onReviewAdded={loadAll}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

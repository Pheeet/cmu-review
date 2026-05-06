/**
 * CMU Faculty soft-tint palette.
 * All tones are low-saturation — safe on white backgrounds.
 * Each faculty: bg (very light tint), text (dark muted), border (soft mid)
 */
export interface FacultyColor {
  bg: string;     // light tint — used for pill bg, card hover bg-tint
  text: string;   // muted dark — readable on bg
  border: string; // soft — card hover border, subtle pill stroke
}

const PALETTE: Record<string, FacultyColor> = {
  // 01 มนุษยศาสตร์ — ขาว → warm stone
  'มนุษยศาสตร์': { bg: '#F5F4F2', text: '#4B4640', border: '#D6D2CB' },

  // 02 ศึกษาศาสตร์ — ฟ้าอ่อน → muted sky
  'ศึกษาศาสตร์': { bg: '#EFF8FF', text: '#1D6FA4', border: '#BAE0FA' },

  // 03 วิจิตรศิลป์ — แดงชาด → soft rose-red
  'วิจิตรศิลป์': { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },

  // 04 สังคมศาสตร์ — ฟ้าแก่ → muted cobalt
  'สังคมศาสตร์': { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },

  // 05 วิทยาศาสตร์ — เหลือง → warm amber tint
  'วิทยาศาสตร์': { bg: '#FFF4E8', text: '#9A5A12', border: '#F1C38C' },

  // 06 วิศวกรรมศาสตร์ — เลือดหมู → soft maroon
  'วิศวกรรมศาสตร์': { bg: '#FFF1F2', text: '#881337', border: '#FECDD3' },

  // 07 แพทยศาสตร์ — เขียวแก่ → soft forest
  'แพทยศาสตร์': { bg: '#F0FDF4', text: '#14532D', border: '#BBF7D0' },

  // 08 เกษตรศาสตร์ — เหลืองข้าวโพด → soft warm amber
  'เกษตรศาสตร์': { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },

  // 09 ทันตแพทยศาสตร์ — ม่วงแก่ → soft violet
  'ทันตแพทยศาสตร์': { bg: '#F5F3FF', text: '#4C1D95', border: '#DDD6FE' },

  // 10 เภสัชศาสตร์ — เขียวมะกอก → soft olive
  'เภสัชศาสตร์': { bg: '#F3F8EC', text: '#3A5C1A', border: '#C5DFA0' },

  // 11 เทคนิคการแพทย์ — น้ำเงิน → soft indigo
  'เทคนิคการแพทย์': { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' },

  // 12 พยาบาลศาสตร์ — แสด → soft orange
  'พยาบาลศาสตร์': { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },

  // 13 อุตสาหกรรมการเกษตร — ทอง → soft gold
  'อุตสาหกรรมการเกษตร': { bg: '#FEFCE8', text: '#713F12', border: '#FDE68A' },

  // 14 สัตวแพทยศาสตร์ — ฟ้าหม่น → soft cyan
  'สัตวแพทยศาสตร์': { bg: '#F0FBFE', text: '#0E7490', border: '#A5F3FC' },

  // 15 บริหารธุรกิจ — เทาอมฟ้า → soft slate
  'บริหารธุรกิจ': { bg: '#F8FAFC', text: '#334155', border: '#CBD5E1' },

  // 16 เศรษฐศาสตร์ — บานเย็นแก่ → soft fuchsia
  'เศรษฐศาสตร์': { bg: '#FDF2FF', text: '#701A75', border: '#E9D5FF' },

  // 17 สถาปัตยกรรมศาสตร์ — เหลืองทราย → soft sand
  'สถาปัตยกรรมศาสตร์': { bg: '#FDFAF3', text: '#78350F', border: '#E0CFA0' },

  // 18 สื่อสารมวลชน — เทาเงิน → cool gray
  'สื่อสารมวลชน': { bg: '#F8F9FA', text: '#374151', border: '#D1D5DB' },

  // 19 รัฐศาสตร์ — กรมท่า → deep navy tint
  'รัฐศาสตร์': { bg: '#F0F4FF', text: '#1E2F6E', border: '#C8D6FA' },
  'รัฐศาสตร์และรัฐประศาสนศาสตร์': { bg: '#F0F4FF', text: '#1E2F6E', border: '#C8D6FA' },

  // 20 นิติศาสตร์ — ม่วง → soft grape
  'นิติศาสตร์': { bg: '#FAF5FF', text: '#581C87', border: '#E9D5FF' },

  // 21 CAMT — รำข้าว → soft warm brown
  'CAMT': { bg: '#FBF6F1', text: '#6B4226', border: '#D4B896' },
  'วิทยาลัยศิลปะ สื่อ และเทคโนโลยี': { bg: '#FBF6F1', text: '#6B4226', border: '#D4B896' },

  // 22 สาธารณสุขศาสตร์ — เขียวใบตองอ่อน → soft lime
  'สาธารณสุขศาสตร์': { bg: '#F4FAE8', text: '#3F6015', border: '#BBDA82' },

  // 99 บัณฑิตวิทยาลัย — บานเย็น → soft pink
  'บัณฑิตวิทยาลัย': { bg: '#FFF0F6', text: '#9D174D', border: '#FBCFE8' },
};

/** Default — neutral warm gray (matches มนุษยศาสตร์ feel) */
const DEFAULT: FacultyColor = { bg: '#F5F4F2', text: '#4B4640', border: '#D6D2CB' };

/**
 * Returns soft-tint color tokens for a given faculty name.
 * Handles "คณะ" prefix and partial matches from the DB.
 */
export function getFacultyColor(faculty: string | null | undefined): FacultyColor {
  if (!faculty) return DEFAULT;

  // Strip common Thai prefixes before matching
  const normalized = faculty
    .replace(/^คณะ/, '')
    .replace(/^วิทยาลัย/, '')
    .trim();

  // 1. Exact on normalized
  if (PALETTE[normalized]) return PALETTE[normalized];

  // 2. Exact on original
  if (PALETTE[faculty]) return PALETTE[faculty];

  // 3. Partial match — normalized key inside faculty string (or vice versa)
  const key = Object.keys(PALETTE).find(
    k => faculty.includes(k) || normalized.includes(k) || k.includes(normalized)
  );
  return key ? PALETTE[key] : DEFAULT;
}

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse .env.local manually
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required in .env.local');
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npx tsx scripts/import-csv-reviews.ts <path-to-csv>');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// --- Helpers ---

function parseCSV(content: string): string[][] {
  const lines: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field);
        field = '';
      } else if (ch === '\n' || (ch === '\r' && content[i + 1] === '\n')) {
        current.push(field);
        field = '';
        if (current.some(f => f.trim())) lines.push(current);
        current = [];
        if (ch === '\r') i++;
      } else {
        field += ch;
      }
    }
  }
  // Last field/line
  current.push(field);
  if (current.some(f => f.trim())) lines.push(current);

  return lines;
}

function normalizeGrade(raw: string | null): string {
  if (!raw) return 'ไม่ระบุ';
  const trimmed = raw.trim();
  if (!trimmed) return 'ไม่ระบุ';

  const skipPatterns = ['ยังไม่', 'ไม่บอก', 'จำไม่', 'ดรอป', 'ไม่ระบุ'];
  if (skipPatterns.some(p => trimmed.includes(p))) return 'ไม่ระบุ';

  const match = trimmed.match(/^[A-FS][+]?/i);
  if (match) return match[0].toUpperCase();

  return 'ไม่ระบุ';
}

function mapSectionType(raw: string | null): string {
  if (!raw) return 'ไม่ระบุ';
  const trimmed = raw.trim();
  if (trimmed === 'ภาคปกติ' || trimmed === 'ปกติ') return 'ภาคปกติ';
  if (trimmed === 'ภาคพิเศษ' || trimmed === 'พิเศษ') return 'ภาคพิเศษ';
  if (trimmed === 'นานาชาติ') return 'นานาชาติ';
  if (trimmed === 'ไม่แน่ใจ') return 'ไม่แน่ใจ';
  return 'ไม่ระบุ';
}

function convertRate(raw: string | null): number | null {
  if (!raw || !raw.trim()) return null;
  const val = parseFloat(raw.trim());
  if (isNaN(val) || val < 1 || val > 10) return null;
  return Math.round(val / 2);
}

// --- Main ---

async function main() {
  const fileContent = readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(fileContent);

  if (rows.length === 0) {
    console.error('CSV is empty');
    process.exit(1);
  }

  // Skip header row
  const dataRows = rows.slice(1);
  console.log(`Found ${dataRows.length} rows (excluding header)`);

  // Load course code → id map
  const courses = await sql`SELECT id, code FROM courses`;
  const courseMap = new Map<string, string>();
  for (const c of courses) {
    courseMap.set(c.code.trim().toLowerCase(), c.id);
  }
  console.log(`Loaded ${courseMap.size} courses`);

  let inserted = 0;
  let skippedNoCourse = 0;
  let skippedNoComment = 0;
  let skippedDuplicate = 0;

  for (const row of dataRows) {
    const [rawCode, rawComment, rawGrade, rawSection, rawRate] = row;

    // Lookup course
    const code = (rawCode || '').trim().toLowerCase();
    const courseId = courseMap.get(code);
    if (!courseId) {
      skippedNoCourse++;
      continue;
    }

    // Validate comment + strip CSV injection chars
    const comment = (rawComment || '').trim().replace(/^[=+\-@\t\r]/, "'$&");
    if (!comment) {
      skippedNoComment++;
      continue;
    }

    // Duplicate check
    const existing = await sql`
      SELECT id FROM reviews
      WHERE course_id = ${courseId} AND comment = ${comment}
      LIMIT 1
    `;
    if (existing.length > 0) {
      skippedDuplicate++;
      continue;
    }

    // Normalize fields
    const grade = normalizeGrade(rawGrade);
    const sectionType = mapSectionType(rawSection);
    const rating = convertRate(rawRate);

    // Insert
    await sql`
      INSERT INTO reviews (id, course_id, comment, grade, section_type, rating, report_count, like_count, created_at)
      VALUES (gen_random_uuid(), ${courseId}, ${comment}, ${grade}, ${sectionType}, ${rating}, 0, 0, now())
    `;
    inserted++;
  }

  console.log('\n--- Import Summary ---');
  console.log(`Total rows:     ${dataRows.length}`);
  console.log(`Inserted:       ${inserted}`);
  console.log(`Skipped (no course match): ${skippedNoCourse}`);
  console.log(`Skipped (no comment):      ${skippedNoComment}`);
  console.log(`Skipped (duplicate):        ${skippedDuplicate}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});

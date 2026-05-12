# Implementation Roadmap

## Priority 1 — ควรทำก่อน

### Debounce Search
- [x] ช่องค้นหาหน้าหลัก — ใช้ `useDebounce(query, 300)` จาก `use-debounce` แล้ว
- [x] Hero search + FilterBar search ผ่าน `query` state เดียวกัน → debounce → API call

### Approval System สำหรับวิชาใหม่
- [x] Student หาไม่เจอ → ร้องขอผ่าน modal (course_requests table)
- [x] Admin เห็น tag วิชาที่ร้องขอใน modal เพิ่มวิชา → auto-fill รหัส
- [x] Admin กรอกชื่อ/คณะ/รายละเอียดเอง — ไม่ต้องมี `pending` status
- [x] ป้องกัน desc แปลกๆ จาก student เพราะ admin ควบคุมข้อมูลตั้งแต่ต้น

## Priority 2 — ทำรองลงมา

### Tag System
- [ ] สร้าง `course_tags` table (many-to-many: courses ↔ tags)
- [ ] ตัวอย่าง tag: เรียนชิล, งานกลุ่ม, เน้นเนื้อหา, สอบตอนเดียว, มีโปรเจกต์
- [ ] ใครติด tag? → reviewer เลือกตอนเขียนรีวิว (tag เฉพาะรีวิวนั้น)
- [ ] หรือ admin ติดที่ระดับวิชาโดยรวม
- [ ] เพิ่ม filter ค้นหาจาก tag ได้

### สัดส่วนเกรด (Grade Distribution)
- [x] Aggregate `grade` จาก reviews ใน CourseModal (useMemo, ไม่ต้องเพิ่ม API)
- [x] แสดงเป็น horizontal bar chart พร้อม % และจำนวน
- [x] ระบุจำนวนรีวิวที่ระบุเกรด เช่น "จาก 40 รีวิวที่ระบุเกรด"
- [x] ซ่อน section ถ้าไม่มีรีวิวที่ระบุเกรดเลย

### ซ่อนรีวิวที่ถูกรายงานอัตโนมัติ
- [x] เรียง `report_count` น้อยก่อน (ต่ำสุดขึ้นบน, สูงสุดล่างสุด)
- [x] ไม่ต้องเพิ่ม `hidden` column — แค่ sort order
- [x] แก้ที่ `/api/reviews` route: `orderBy(asc(report_count), desc(like_count), desc(created_at))`
- [x] Auto-delete เมื่อ `report_count >= 15` (ที่ `/api/report`)

## Priority 3 — Nice to have

### ดาว Rating (แทนคะแนนความน่าเรียน)
- [x] `rating` column (1-5) เพิ่มใน reviews table แล้ว
- [x] CourseCard: โชว์ avg rating (ดาว) + mode grade badge (เกรดที่พบมากสุด)
- [x] API `/api/courses` + `page.tsx`: เพิ่ม mode_grade, avg_rating, rating_count
- [ ] UI ดาวตอนเขียนรีวิว (ยังไม่มี input)
- [ ] Filter/sort by rating

### เงื่อนไขวิชา / ประเภทหลักสูตร
- [ ] เพิ่ม column `prerequisites` (text), `program_type` (enum: ภาคปกติ/พิเศษ/นานาชาติ)
- [ ] ข้อมูลต้องเก็บเองหรือ import จากแหล่งอื่น

### เรียงลำดับ default
- [ ] ตอนนี้หน้าหลักเรียงตามจำนวนรีวิว
- [ ] ถ้าอยาก "ล่าสุดก่อน" ต้องเปลี่ยน default sort → `created_at DESC`

### ปีการศึกษาเพิ่มกว่า 6 ปี
- [ ] `academic_year` เก็บเป็น text อยู่แล้ว ไม่มีปัญหาด้าน tech
- [ ] แค่เพิ่มตัวเลือกใน dropdown
- [ ] **ข้อคิด**: รีวิวเก่ากว่า 6 ปี อาจารย์/เนื้อหาอาจเปลี่ยนไปแล้ว

### ข้อมูลทีมงาน / About
- [ ] เพิ่ม static page หรือ section ง่ายๆ
- [ ] ช่องทางติดต่อ, ข้อมูลโปรเจกต์

## ทำไปแล้ว
- [x] Pagination (เปลี่ยนจาก "โหลดเพิ่ม" เป็นเลขหน้า)
- [x] Admin dashboard + ภาพรวม
- [x] Quick delete button ที่ dashboard (modal confirm)
- [x] Course requests (ร้องขอวิชาใหม่)
- [x] Responsive admin panel (mobile + desktop)
- [x] Dashboard: กดแถวรีวิว → modal detail, quick delete ท้ายแถว
- [x] Dashboard: stat cards → grid 3 inline `[icon] number label`
- [x] Reports: badge responsive (< sm ตัวเลขอย่างเดียว, sm+ full text)
- [x] Courses: limit 15/หน้า, mobile card click → reviews, responsive filter
- [x] Admins: mobile card list, responsive header
- [x] Actions revalidate dashboard หลัง mutation
- [x] Debounce search หน้าหลัก (300ms)
- [x] Approval system: student ร้องขอ → admin เพิ่มเอง (ไม่มี pending status)
- [x] Reported reviews sort ล่างสุด (sort by report_count asc, ไม่ต้องมี hidden column)
- [x] Grade distribution stacked bar ใน CourseModal (สี emerald→amber→orange→red)
- [x] CourseModal responsive: fixed positioning บน mobile (fit 320px+), flex centered บน sm+
- [x] Hero section: `h-[100dvh] flex-shrink-0` แทน `min-h-screen` แก้ body ยาวเกิน (5996px→100dvh)
- [x] Hero background: `backgroundPosition: 'center center'` + `backgroundRepeat: 'no-repeat'`
- [x] Rating column + mode grade + avg rating ใน CourseCard
- [x] Section type: ภาคปกติ, ภาคพิเศษ, นานาชาติ, ไม่ระบุ (4 options)
- [x] Semester badge แยก "ปี XXXX" / "เทอม 1" / "Summer" + null check
- [x] Rate limit login: 5 attempts / 15 min / IP (ใช้ rate_limit_logs table)
- [x] ลบหน้าจัดการแอดมิน (route + sidebar link)
- [x] Import CSV reviews script (scripts/import-csv-reviews.ts) — 371 inserted

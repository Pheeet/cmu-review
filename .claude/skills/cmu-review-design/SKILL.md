---
name: cmu-review-design
description: "Design system and UI patterns reference for cmu-review project. Use when adding new components, modifying existing UI, or ensuring design consistency. Covers animations, colors, layout patterns, and component conventions."
trigger: /cmu-review-design
---

# CMU Review — Design System & UI Patterns

## Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#9E76B4` | Buttons, links, active states, accents |
| Primary Hover | `#8A5DA1` | Button hover |
| Primary Active | `#7A4E91` | Button active/pressed |
| Primary Light | `purple-50` / `#F3E8FF` | Backgrounds, highlights |
| Primary Ring | `ring-[#9E76B4]/20` | Focus rings |
| Background | `#FAF9F5` | Page background (warm off-white) |
| Card BG | `white` | Cards, modals, dropdowns |
| Text Primary | `neutral-900` | Headings, body text |
| Text Secondary | `neutral-400` | Labels, hints, metadata |
| Text Muted | `neutral-500` | Descriptions, captions |
| Border | `neutral-200` | Cards, inputs, dividers |
| Border Light | `neutral-100` / `#E8E8E6` | Subtle separators |
| Success | `emerald-500` | Grade badges |
| Success BG | `green-50` | Grade tag backgrounds |
| Danger | `red-500` | Report, destructive actions |

## Typography

| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| Hero H1 | `text-5xl md:text-6xl` | `font-extrabold` | `tracking-tight` |
| Modal H2 | `text-2xl sm:text-3xl` | `font-extrabold` | `tracking-tight` |
| Card H3 | `text-base` | `font-bold` | default |
| Section Label | `text-[10px]` | `font-bold` | `tracking-widest uppercase` |
| Body | `text-sm` | `font-medium` | default |
| Badge | `text-xs` / `text-[10px]` | `font-bold` / `font-semibold` | default |
| Mono (course code) | `font-mono` | `font-bold` | `tracking-wide` |

Font: **Sarabun** (Google Fonts, Thai-optimized) via `next/font/google`

## Spacing & Radius

| Token | Value |
|-------|-------|
| Card Padding | `p-5` |
| Section Padding | `px-5 sm:px-8 py-7` |
| Modal Padding | `px-5 sm:px-8` |
| Input Height | `h-11` |
| Button Height | `py-3` (main), `py-2.5` (form), `py-1.5` (small) |
| Card Radius | `rounded-2xl` |
| Input Radius | `rounded-xl` / `rounded-lg` |
| Badge/Pill Radius | `rounded-full` |
| Modal Radius | `rounded-t-3xl sm:rounded-2xl` (bottom sheet), `rounded-2xl` (center modal) |
| Grid Gap | `gap-5` |
| Container Max | `max-w-7xl` |

## Animation Patterns (Framer Motion)

### Entrance — Fade Up
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ duration: 0.28, delay: Math.min(i % 24 * 0.03, 0.3), ease: [0.25, 0.46, 0.45, 0.94] }}
>
```

### Modal Entrance — Bottom Sheet (Mobile) / Center (Desktop)
```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 40 }}
  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
>
```

### Nested Modal (on top of modal)
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.96, y: 8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.96, y: 8 }}
  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
>
```

### Badge Count Change
```tsx
<motion.span
  key={count}
  initial={{ scale: 0.85, opacity: 0.6 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
>
```

### Card Hover
```tsx
whileHover={{ y: -4, borderColor: fc.border, transition: { duration: 0.2, ease: 'easeOut' } }}
whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
```

### Layout Shift (grid reflow)
```tsx
<motion.div layout="position" ...>
```

### AnimatePresence
- Always wrap mount/unmount elements with `<AnimatePresence>`
- Grid uses `mode="popLayout"` for exit + layout shift simultaneously
- Hero uses latch pattern: exit once, never re-enter during session

## Component Patterns

### Course Card
- Flex column `h-full` — content pushes footer to bottom
- Faculty color pill (code) + credits badge top row
- Title (en) + subtitle (th, `line-clamp-1`) + faculty tag
- Footer: grade badge (green) left, review count right
- Hover: lift `-4px` + border color change + shadow upgrade
- Group hover: title color → `#9E76B4`

### Course Modal (Bottom Sheet)
- **Mobile**: full-width, `h-[92vh]`, `rounded-t-3xl`, drag handle
- **Desktop**: `max-w-3xl`, `max-h-[90vh]`, centered, `rounded-2xl`
- 3 zones: header strip → course info → reviews list
- Sticky footer: submit button / "already reviewed" state
- Safe area: `paddingBottom: max(0.75rem, env(safe-area-inset-bottom))`
- Scroll lock on body while open

### Review Card (inside modal)
- Avatar circle: first letter of name, `bg-purple-100 text-purple-700`
- Metadata pills: grade (green), semester (neutral), section type (neutral)
- Comment: `whitespace-pre-wrap break-words`, indented on desktop `sm:pl-11`
- Like button: toggle state → `bg-purple-50 text-[#9E76B4]` with filled icon
- Report: overlay confirmation with `<AnimatePresence>` + backdrop blur

### Dropdown (Headless UI Listbox)
- Generic `<Dropdown<T>>` component
- Mobile: full width with border; Desktop: transparent bg, border on hover only
- Option list: `rounded-2xl shadow-xl p-2`, max height 236px
- Active option: `bg-purple-50 text-[#9E76B4]`
- Selected: checkmark icon

### Filter Bar
- `sticky top-0 z-20` with glassmorphism: `bg-[#FAF9F5]/95 backdrop-blur-md`
- Controls inside white card: `bg-white rounded-2xl border shadow-sm`
- Mobile: stacked rows; Desktop: single row with vertical dividers

### Skeleton Loading
- `animate-pulse` on placeholder divs
- Match real component structure (same grid, same card shape)
- 24 skeletons on initial load, 2 skeletons in modal review list

### Hero Section
- Full viewport: `min-h-screen`
- Background image with dark overlay: `bg-black/40` + gradient
- Decorative blur circles: `bg-[#9E76B4]/10 rounded-full blur-3xl`
- Staggered entrance: badge → h1 → subtitle → search (50ms delay each)
- Scroll-down CTA with `animate-bounce`
- Latch: hidden permanently after first filter/search

### Review Form Modal
- Z-index `z-[60]` (stacks on CourseModal's `z-50`)
- Extra darkening backdrop `bg-black/30` on top of existing `bg-black/60`
- Form fields: 10px uppercase bold labels with wide tracking
- Semester/Section/Grade: grouped in tinted card `bg-neutral-50 border rounded-xl`
- Comment counter: red→green transition at 20 chars
- Submit: disabled state `opacity-40` when invalid or submitting

## Z-Index Stack

| Layer | Z-Index | Element |
|-------|---------|---------|
| Filter Bar | `z-20` | Sticky filter |
| Report Overlay | `z-20` | Per-card confirmation |
| Course Modal | `z-50` | Main modal |
| Review Form Modal | `z-[60]` | Nested modal |
| Dropdown Options | `z-50` | Listbox popup |

## Optimistic Update Pattern

Used for like/unlike:
1. Update state immediately (count + liked map)
2. Persist to `localStorage('cmureview_liked')`
3. Call server action
4. On failure: rollback both state + localStorage + show error toast

## Debounce Pattern

```tsx
const [query, setQuery] = useState('');
const [debouncedQuery] = useDebounce(query, 300);

useEffect(() => {
  fetchData(1, true, { search: debouncedQuery, ... });
}, [debouncedQuery, faculty, credits, sort]);
```

## Faculty Color Mapping

23 CMU faculties mapped to `{ bg, text, border }` triplets in `src/lib/facultyColors.ts`. Used via `getFacultyColor(facultyName)` with fuzzy matching and warm-gray fallback.

## Responsive Breakpoints

| Breakpoint | Usage |
|------------|-------|
| Default (mobile) | Single column, bottom sheet, stacked filters |
| `sm` (640px) | 2-col grid, centered modal, wider padding |
| `md` (768px) | Horizontal filter bar, grid dividers |
| `lg` (1024px) | 3-col grid |
| `xl` (1280px) | 4-col grid |

## Interaction States

| State | Pattern |
|-------|---------|
| Hover (cards) | `whileHover` lift + border color change |
| Hover (buttons) | Darker shade, shadow upgrade |
| Active/Tap | `whileTap={{ scale: 0.98 }}`, `active:scale-95` |
| Focus (inputs) | `focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4]` |
| Disabled | `opacity-40 cursor-not-allowed` |
| Loading | `animate-spin` border spinner or `animate-pulse` skeleton |
| Selected (dropdown) | `bg-purple-50 text-[#9E76B4]` + checkmark |

## Notification Pattern

All feedback via `react-hot-toast`:
- Position: `bottom-center`
- Success: green toast
- Error: red toast
- Thai messages throughout

# Academic Dashboard - Developer Handoff Notes

## 📋 Overview
A comprehensive academic performance tracking dashboard built with React, TypeScript, Tailwind CSS v4, and Recharts. Features dark/light theme switching, interactive charts, GPA calculations, and responsive design (desktop-first at 1440px).

---

## 🎨 Design System

### Color Tokens (CSS Variables)

#### Dark Theme (Default)
```css
--bg: #0f172a           /* Main background */
--surface: #1e293b      /* Topbar, sidebar, panels */
--card: #1e293b         /* Card backgrounds */
--text-primary: #f1f5f9 /* Primary text */
--text-secondary: #cbd5e1 /* Muted/secondary text */
--accent: #06b6d4       /* Primary accent (cyan) */
--accent-2: #a855f7     /* Secondary accent (purple) */
--muted: #334155        /* Borders, dividers */
--success: #10b981      /* Success states */
--danger: #ef4444       /* Error/warning states */
--warning: #f59e0b      /* Warning states */
```

#### Light Theme
```css
--bg: #f8fafc           /* Main background */
--surface: #ffffff      /* Topbar, sidebar, panels */
--card: #ffffff         /* Card backgrounds */
--text-primary: #1f2937 /* Primary text */
--text-secondary: #6b7280 /* Muted/secondary text */
--accent: #0c4a6e       /* Primary accent (blue) */
--accent-2: #0d9488     /* Secondary accent (teal) */
--muted: #e5e7eb        /* Borders, dividers */
--success: #059669      /* Success states */
--danger: #dc2626       /* Error/warning states */
--warning: #d97706      /* Warning states */
```

#### Grade-Specific Colors
```css
--grade-o: #a855f7 / #7c3aed       /* O (10 points) - Purple */
--grade-a-plus: #06b6d4 / #0c4a6e  /* A+ (9 points) - Cyan/Blue */
--grade-a: #10b981 / #059669       /* A (8 points) - Green */
--grade-b-plus: #f59e0b / #d97706  /* B+ (7 points) - Amber */
--grade-b: #fb923c / #ea580c       /* B (6 points) - Orange */
--grade-c: #ef4444 / #dc2626       /* C (5 points) - Red */
```

### Typography

**Font Stack:**
- Primary: `Inter` (Variable weight 100-900) from Google Fonts
- Monospace: `Source Code Pro`

**Font Sizes & Weights:**
- h1: 2.25rem (36px), 700 weight, -0.02em letter-spacing
- h2: 1.875rem (30px), 700 weight, -0.01em letter-spacing
- h3: 1.5rem (24px), 600 weight
- h4: 1.25rem (20px), 600 weight
- h5: 1.125rem (18px), 600 weight
- h6: 1rem (16px), 600 weight
- p: 0.875rem (14px)
- small: 0.75rem (12px)

### Spacing Scale (4px base)
```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
```

### Border Radius
```
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
```

### Shadows
```
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3/0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4/0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5/0.15)
```

### Transitions
```
--transition-fast: 150ms ease
--transition-base: 250ms ease
--transition-slow: 400ms ease
```

---

## 📐 Layout Structure

### Sidebar
- **Expanded**: 280px width
- **Collapsed**: 72px width
- **Position**: Sticky, left-aligned
- **Animation**: 300ms ease-in-out width transition
- **Components**: Logo, 4 nav items, collapse toggle

### Topbar
- **Height**: 64px (h-16)
- **Position**: Sticky top
- **Components**: Search bar, theme toggle, user avatar

### Main Content
- **Padding**: 24px (p-6)
- **Max width**: Fluid, responsive to viewport
- **Scroll**: Vertical with custom scrollbar styling

---

## 🧮 GPA Calculation Formulas

### Semester GPA
```
GPA = Σ(credits × gradePoint) / Σ(credits)
```

### Cumulative GPA (CGPA)
```
CGPA = Σ(all semester credits × gradePoint) / Σ(all semester credits)
```

### Target GPA Calculator
```
Required Avg GPA = (targetCGPA × totalCredits - currentPoints) / remainingCredits
```

**Feasibility Check:**
- Achievable: Required Avg <= 10
- Challenging: Required Avg > 9 && <= 10
- Impossible: Required Avg > 10

### Grade Mapping
```typescript
{
  'O': 10,   // Outstanding
  'A+': 9,   // Excellent
  'A': 8,    // Very Good
  'B+': 7,   // Good
  'B': 6,    // Average
  'C': 5,    // Pass
}
```

---

## 📊 Data Structure

### Semester Object
```typescript
interface Semester {
  id: string;
  name: string;         // "Semester 1"
  year: number;         // 2023
  term: 'Fall' | 'Spring';
  gpa: number;          // Semester GPA (0-10)
  cgpa: number;         // Cumulative GPA at end of semester
  subjects: Subject[];
}
```

### Subject Object
```typescript
interface Subject {
  id: string;
  name: string;         // "Data Structures"
  credits: number;      // Supports floats (e.g., 3.5)
  grade: string;        // 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C'
  gradePoint: number;   // 5-10
  tag: 'Core' | 'PE' | 'CE' | 'Lab' | 'Other';
}
```

### Goal Object
```typescript
interface Goal {
  id: string;
  title: string;
  targetSemester: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}
```

---

## 🎯 Component Library

### Core Components
- **Sidebar** (`/components/Sidebar.tsx`) - Collapsible navigation with active states
- **Topbar** (`/components/Topbar.tsx`) - Header with search and theme toggle
- **Layout** (`/components/Layout.tsx`) - Main layout wrapper with theme management
- **Modal** (`/components/Modal.tsx`) - Reusable modal with sizes: sm, md, lg, xl
- **StatCard** (`/components/StatCard.tsx`) - KPI card with variants: default, accent, success, warning
- **CircularProgress** (`/components/CircularProgress.tsx`) - Animated GPA display (0-10 scale)
- **EmptyState** (`/components/EmptyState.tsx`) - Placeholder for empty data states

### Chart Components
- **GPALineChart** (`/components/GPALineChart.tsx`) - Dual-line chart for GPA/CGPA trends
- **GradeBarChart** (`/components/GradeBarChart.tsx`) - Grade distribution vertical bars
- **CreditPieChart** (`/components/CreditPieChart.tsx`) - Donut chart for credit breakdown

### Pages
- **Overview** (`/pages/Overview.tsx`) - Dashboard with stats, charts, and insights
- **Goals** (`/pages/Goals.tsx`) - Goal tracking and target GPA calculator
- **Semesters** (`/pages/Semesters.tsx`) - Semester cards with detail modal and PDF export
- **Calculator** (`/pages/Calculator.tsx`) - Interactive GPA calculator with circular progress

---

## 🔧 Technical Stack

### Core Libraries
- **React** 18+ with TypeScript
- **React Router** (data mode, `react-router` package)
- **Tailwind CSS** v4.0 (CSS variables)
- **Recharts** for data visualization
- **Motion** (motion/react) for animations
- **Lucide React** for icons

### Key Dependencies
```json
{
  "react-router": "^7.x",
  "recharts": "^2.x",
  "motion": "^11.x",
  "lucide-react": "^0.x"
}
```

---

## 🎬 Animations & Interactions

### Micro-interactions
1. **Sidebar Collapse**: 300ms width animation
2. **Theme Toggle**: 300ms icon rotation
3. **Modal**: Scale + fade entrance/exit
4. **Circular Progress**: 1s stroke animation with easing
5. **Card Hover**: Scale 1.02-1.05 on buttons
6. **Confetti**: Scale + rotate on target achievement

### Chart Interactions
- **Tooltips**: Fade in on hover with formatted data
- **Legend Toggles**: Click to show/hide series
- **Bar Hover**: Highlight with percentage display
- **Pie Hover**: Slice highlight with credit count

---

## 📱 Responsive Breakpoints

- **Desktop**: 1440px+ (primary design)
- **Tablet**: 768px - 1439px (2-column layouts collapse)
- **Mobile**: < 768px (single column, collapsed sidebar)

### Responsive Classes
```
md: 768px
lg: 1024px
xl: 1280px
```

---

## 🚀 Implementation Notes

### Theme Switching
Theme is stored in `localStorage` with key `"theme"`. On mount, the Layout component:
1. Reads saved theme from localStorage
2. Applies `data-theme` attribute to `<html>`
3. All CSS variables auto-update via `:root[data-theme="light"]`

### PDF Export (Mock)
Currently shows a 2-second loading modal, then alerts user. 

**Suggested Implementation:**
- Use `jsPDF` or `pdfmake` library
- Generate semester report with:
  - Header: Semester name, year, term
  - Stats: GPA, CGPA, total credits
  - Table: All subjects with grades
  - Footer: Generated timestamp

### LocalStorage Schema (Optional)
```typescript
// Store user data
localStorage.setItem('academicData', JSON.stringify({
  semesters: Semester[],
  goals: Goal[],
  theme: 'dark' | 'light',
  lastUpdated: timestamp,
}));
```

---

## 🔌 Suggested API Endpoints

### Semesters
- `GET /api/semesters` - List all semesters
- `POST /api/semesters` - Create new semester
- `PUT /api/semesters/:id` - Update semester
- `DELETE /api/semesters/:id` - Delete semester
- `POST /api/semesters/:id/export-pdf` - Generate PDF

### Goals
- `GET /api/goals` - List goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Import/Export
- `POST /api/import/csv` - Import semester data from CSV
- `GET /api/export/json` - Export all data as JSON
- `POST /api/import/json` - Import from JSON backup

---

## 📝 Sample Data

Sample data for 6 semesters with realistic subjects is provided in `/data/sampleData.ts`.
- **Total Credits**: ~130 across 6 semesters
- **CGPA Range**: 8.5 - 9.2
- **Subject Tags**: Core, PE (Professional Elective), CE (Core Elective), Lab, Other

---

## ✅ Testing Checklist

- [ ] Theme toggle works and persists across sessions
- [ ] Sidebar collapse/expand animates smoothly
- [ ] All charts render with proper data
- [ ] GPA calculator computes correctly
- [ ] Target GPA shows correct feasibility
- [ ] Modal keyboard navigation (ESC to close)
- [ ] Form validation for credits and grades
- [ ] Responsive layout on mobile/tablet
- [ ] Empty states display properly
- [ ] PDF export shows loading state

---

## 🎨 Figma Export Notes

### Assets to Export
- **Icons**: All Lucide icons are code-based (no export needed)
- **Charts**: Export as PNG at 2x for documentation
- **Color Swatches**: Document all CSS variable hex codes
- **Spacing Grid**: 4px base grid overlay
- **Component States**: Normal, hover, active, disabled

### Handoff Layers
- Use clear naming: `Button/Primary/Hover`
- Group related components
- Add developer notes as text layers
- Export icon components as SVG

---

## 🐛 Known Limitations

1. **PDF Export**: Currently a placeholder - requires PDF library integration
2. **Data Persistence**: Uses sample data - needs backend or localStorage implementation
3. **Add Semester Form**: Modal shows placeholder text - needs full form implementation
4. **Confetti Animation**: Simple scale/rotate - could use a dedicated confetti library for richer effects
5. **CSV Import**: Not implemented - would require file parsing logic

---

## 🎓 Grade Point Assumptions

This dashboard uses the **10-point GPA scale** common in Indian universities:
- O (Outstanding): 10
- A+ (Excellent): 9
- A (Very Good): 8
- B+ (Good): 7
- B (Average): 6
- C (Pass): 5

**Note:** Adjust `gradeMapping` in `/data/sampleData.ts` if your institution uses a different scale (e.g., 4.0 scale).

---

## 📧 Support

For questions about implementation or design decisions, refer to:
- Design tokens in `/styles/globals.css`
- Sample data structure in `/data/sampleData.ts`
- Component props in each component file (TypeScript interfaces)

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Built with**: React 18, TypeScript, Tailwind v4, Motion, Recharts

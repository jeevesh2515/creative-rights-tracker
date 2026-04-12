---
phase: 05-analytics-reporting-polish
status: research_complete
date_completed: 2026-04-13
---

# Phase 05 Research: Analytics Libraries, Export Tools

## Summary

Phase 05 requires three main technical components:
1. **Charting:** Recharts library for React dashboards
2. **CSV Export:** Built-in browser API (Blob) + fileSaver
3. **PDF Generation:** pdfkit-dist or jsPDF for client-side PDF

Research confirms all three are mature, npm-available, and well-tested in production.

---

## 1. Chart Library: Recharts

### Selection Rationale
- ✓ React-native (no DOM manipulation, works with Next.js)
- ✓ Lightweight (52KB minified)
- ✓ Dark theme compatible (custom color props)
- ✓ TypeScript definitions included
- ✓ Mobile responsive built-in
- ✓ No dependencies on D3.js
- Alternative considered: Chart.js (rejected - heavier, jQuery dependency)

### Standard Patterns in Codebase

**Install:**
```bash
npm install recharts
```

**Basic Chart Pattern:**
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { date: '2026-04-01', revenue: 2500 },
  { date: '2026-04-02', revenue: 3200 },
];

export const RevenueTrendChart = ({ data, height = 300 }) => (
  <LineChart data={data} width="100%" height={height} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
    <XAxis dataKey="date" stroke="#94a3b8" />
    <YAxis stroke="#94a3b8" />
    <Tooltip 
      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
      labelStyle={{ color: '#f1f5f9' }}
    />
    <Legend />
    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
  </LineChart>
);
```

### Dark Theme Integration
- Stripe colors: bg-slate-800, stroke: #334155/#475569 (borders)
- Text: #f1f5f9 (light), #94a3b8 (muted)
- Accent: #6366f1 (indigo), #a855f7 (purple)
- Tooltip: bg-slate-900, border-slate-700

### Responsive Behavior
- Recharts ResponsiveContainer auto-scales to parent width
- Mobile: Set maxWidth: 100% on container
- Charts stack vertically on mobile (<640px breakpoint)

### Data Requirements
Charts will use data from Supabase:
- **RevenueTrendChart:** SELECT date, SUM(amount) FROM distributions GROUP BY date
- **DistributionBreakdownChart:** SELECT recipient_id, SUM(amount) FROM distribution_recipients GROUP BY recipient_id

---

## 2. CSV Export

### Implementation Approach
- ✓ Generate CSV string manually (no dependencies)
- ✓ Create Blob from string
- ✓ Use `URL.createObjectURL()` + download link
- ✓ Works in all modern browsers

### Standard Pattern

```tsx
const exportToCSV = (data: any[], filename: string) => {
  const headers = ['Date', 'Recipient', 'Amount', 'Status'];
  const rows = data.map(row => [row.date, row.recipient, row.amount, row.status]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
```

### No Additional Dependencies
- Built into browser (Blob API, URL.createObjectURL)
- No npm packages needed
- Works offline

### File Size
- 1000 rows × 5 columns = ~20KB CSV file (negligible)
- Works great for downloads

---

## 3. PDF Generation: jsPDF vs pdfkit-dist

### Comparison

| Feature | jsPDF | pdfkit-dist |
|---------|-------|------------|
| Bundle Size | 100KB | 200KB |
| Browser Support | All modern | All modern |
| TypeScript | ✓ Good types | ✓ Has types @types/pdfkit |
| Styling | Simple text/lines | Better layout |
| Dependencies | Chart.js integration easy | Standalone |
| Client-side | ✓ Yes | ✓ Yes |

### Recommendation: jsPDF
- Smaller footprint (100KB vs 200KB)
- Simpler API for MVP use case
- Better for client-side generation (no Node.js needed)
- Can embed charts as images (Recharts → PNG → PDF)

### Implementation Pattern

```tsx
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
};
```

### Dependencies
```bash
npm install jspdf html2canvas
npm install -D @types/jspdf
```

### Rendering Strategy
- Render report component to div (hidden off-screen)
- Use html2canvas to convert DOM to image
- Insert image into PDF
- Preserves styling without CSS-to-PDF conversion

---

## 4. Loading Skeletons (Tailwind Pattern)

### Component Pattern
```tsx
const SkeletonChart = () => (
  <div className="h-80 bg-slate-800/40 rounded-lg animate-pulse" />
);

const SkeletonTable = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 bg-slate-800/40 rounded animate-pulse" />
    ))}
  </div>
);
```

### Tailwind Classes Used
- `bg-slate-800/40`: Dark background with transparency
- `animate-pulse`: Built-in Tailwind animation (reduces opacity)
- `h-80`, `h-12`: Height tokens
- `space-y-2`: Gap between skeleton rows

---

## 5. Mobile Responsive: Tailwind Breakpoints

### Current Implementation
Current codebase uses:
- `sm:` (640px) for mobile breakpoint
- `lg:` (1024px) for desktop
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

### Chart Mobile Strategy
```tsx
<div className="w-full lg:w-1/2 xl:w-2/3">
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>...</LineChart>
  </ResponsiveContainer>
</div>
```

**Behavior:**
- Mobile (<640px): Full width chart (100vw)
- Tablet (640-1024px): Half width (side-by-side)
- Desktop (>1024px): 2/3 width (with sidebar)

---

## 6. Animation (Tailwind CSS)

### Built-in Animations
Tailwind provides `animate-` utilities:
- `animate-pulse`: Fade in/out (for skeletons)
- `animate-spin`: Spinning loader
- `animate-bounce`: Up/down bounce
- `transition-all duration-300`: Smooth transitions

### Fade-in Pattern
```tsx
<div className="opacity-0 animate-fadeIn" style={{ animationDuration: '0.5s' }}>
  {/* Content */}
</div>
```

### Custom Animation (in tailwind.config.js)
```js
module.exports = {
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
};
```

---

## 7. Accessibility (WCAG AA)

### ARIA Labels for Charts
```tsx
<LineChart 
  data={data} 
  role="img"
  aria-label="Revenue trend over last 30 days, peak on April 10 at $5200"
>
  ...
</LineChart>
```

### Keyboard Navigation
- All buttons keyboard accessible (already in Tailwind)
- Tab order logical (export → download → back)
- Focus styles visible (ring-indigo-500)

### Color Contrast
- Text: #f1f5f9 (light) on #1e293b (dark) = 14:1 contrast ✓
- Line colors: #6366f1 (indigo), #a855f7 (purple) = 4.5:1+ ✓
- Chart borders: #334155, #475569 = readable ✓

---

## Dependencies to Install

```bash
npm install recharts jspdf html2canvas
npm install -D @types/jspdf
```

**Total added package weight:** ~350KB (which is acceptable for analytics feature)

---

## Implementation Sequence

1. **Plan 05-01:** Create Recharts components, integrate into admin dashboard
2. **Plan 05-02:** Add CSV export (5 min), add PDF export with html2canvas (1 hour)
3. **Plan 05-03:** Add skeleton screens, animations, mobile optimization

---

## Testing Checklist

- [ ] Charts render without errors (React DevTools)
- [ ] Charts responsive on mobile (DevTools device mode)
- [ ] CSV exports with correct data
- [ ] PDF exports and renders correctly
- [ ] Skeleton screens hide when data loaded
- [ ] Animations smooth (60fps in DevTools Performance)
- [ ] Accessibility pass (WAVE, axe DevTools)
- [ ] Build passes: `npm run build`

---

## Notes

- No breaking changes to existing code
- All libraries are ESM-compatible with Next.js 14
- Chart data fetching should use existing Supabase client
- Export buttons can be generic utility functions (reusable)
- Dark theme colors maintained throughout

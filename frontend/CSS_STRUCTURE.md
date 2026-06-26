# ResumeIQ – CSS Architecture

All styles have been converted from Tailwind CSS to **standard CSS** and organized in the `src/styles/` directory.

## Directory Structure

```
src/styles/
├── globals.css       (14.9 KB) - CSS variables, base styles, layout utilities
├── components.css    (4.2 KB)  - Reusable component classes (buttons, cards, forms, badges)
├── login.css         (7.8 KB)  - Login page styles (split-screen layout, forms, animations)
├── upload.css        (4.6 KB)  - Resume upload component (drag-drop, file preview)
├── analysis.css      (4.8 KB)  - Analysis result component (score ring, skill badges, gaps)
├── sidebar.css       (3.6 KB)  - Sidebar navigation (collapsed/expanded states)
├── topbar.css        (5.4 KB)  - Top navigation bar (notifications, user dropdown)
└── dashboard.css     (4.3 KB)  - Dashboard page layout and stats cards
```

**Total CSS: ~49 KB (organized and semantic)**

## CSS Variables

All colors are defined as CSS custom properties in `globals.css`:

```css
--sage-50 through --sage-900    /* Primary color palette */
--gray-50 through --gray-900    /* Neutral palette */
--red-*, --amber-*, --blue-*, --emerald-*  /* Semantic colors */
--shadow-*, --radius-*, --transition-*     /* Design tokens */
```

## Component Classes

### Base Components
- `.btn-primary` / `.btn-secondary` – Button styles
- `.card` – Card container with shadow
- `.input-field` – Form input styling
- `.label` – Form label styling
- `.badge` – Badge/tag component

### Page Layouts
- `.login-container` – Login page split-screen layout
- `.dashboard-container` – Dashboard page wrapper
- `.sidebar` – Sidebar navigation
- `.topbar` – Top navigation bar

### Utilities
- Flexbox: `.flex`, `.flex-col`, `.items-center`, `.justify-between`, etc.
- Grid: `.grid`, `.grid-cols-2`, `.grid-cols-4`, etc.
- Spacing: `.gap-*`, `.p-*`, `.m-*`, `.px-*`, etc.
- Typography: `.text-*`, `.font-*`, `.leading-*`, etc.
- Sizing: `.w-*`, `.h-*`, `.min-w-0`, `.flex-1`, etc.
- Display: `.absolute`, `.relative`, `.overflow-hidden`, etc.
- Responsive: `@media` queries with breakpoints

## Importing Styles

Each component imports its required CSS file:

```tsx
import '../styles/dashboard.css';
import '../styles/login.css';
// etc.
```

The main `src/index.css` imports all style files for easy management:

```css
@import './styles/globals.css';
@import './styles/components.css';
@import './styles/login.css';
@import './styles/upload.css';
@import './styles/analysis.css';
@import './styles/sidebar.css';
@import './styles/topbar.css';
@import './styles/dashboard.css';
```

## Design System

- **Colors**: Sage/teal primary palette with emerald, blue, amber, and red accents
- **Spacing**: 8px base grid system
- **Typography**: Inter font family, three weight system (500, 600, 700)
- **Radius**: 12px (lg), 16px (xl), 20px (2xl)
- **Shadows**: Card, hover, sidebar, topbar variants
- **Animations**: Smooth transitions (150ms, 300ms), spin, pulse, fade-in, slide-up

## Responsive Design

All components respond to these breakpoints:

- **Mobile**: < 640px
- **Tablet**: < 768px
- **Laptop**: < 1024px
- **Desktop**: ≥ 1024px

Media queries handle:
- Sidebar collapse/expand
- Grid layout adjustments
- Mobile navigation visibility
- Spacing adjustments

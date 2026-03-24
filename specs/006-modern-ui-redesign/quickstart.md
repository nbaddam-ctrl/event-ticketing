# Quickstart: Modern UI Redesign

**Feature**: 006-modern-ui-redesign  
**Branch**: `006-modern-ui-redesign`

---

## Prerequisites

- Node.js 18+ and npm
- The repository cloned and on the `006-modern-ui-redesign` branch

## Setup

```bash
# From repository root
git checkout 006-modern-ui-redesign

# Install dependencies (includes new framer-motion)
npm install

# Start frontend dev server
npm run dev --workspace frontend
```

The frontend dev server runs at `http://localhost:5173` by default.

## Backend (for full-stack testing)

```bash
# In a separate terminal
npm run dev --workspace backend
```

The backend runs at `http://localhost:3000` by default.

## Key Development Commands

```bash
# Frontend dev server with hot reload
npm run dev --workspace frontend

# TypeScript type check
cd frontend && npx tsc --noEmit

# Lint
npm run lint --workspace frontend

# Run frontend tests
npm run test --workspace frontend

# Build for production
npm run build --workspace frontend

# Check for circular dependencies (from repo root)
npm run lint:cycles
```

## Architecture Notes

### Design Token System
- All colors are HSL CSS custom properties in `frontend/src/styles.css` (`:root` and `.dark`)
- Tailwind config maps tokens in `frontend/tailwind.config.ts`
- Dark mode uses `darkMode: 'class'` strategy — `.dark` class on `<html>`

### New Dependencies
- `framer-motion` — React animation library for entrance animations and micro-interactions

### New Files
| File | Purpose |
|------|---------|
| `src/contexts/ThemeContext.tsx` | Dark/light mode context, toggle, localStorage persistence |
| `src/components/app/Footer.tsx` | Minimal site-wide footer |
| `src/components/app/HeroSection.tsx` | Event listing hero banner |

### Modified Files (all within `frontend/src/`)
- `styles.css` — Refined color tokens + dark mode `.dark` overrides
- `tailwind.config.ts` — `darkMode: 'class'`, extended shadow tokens
- `main.tsx` — Wrapped with `ThemeProvider`
- `index.html` — Inter font preload + FOUC-prevention inline script
- All 16 `components/ui/*.tsx` — Visual polish, dark mode support
- All 15+ `components/app/*.tsx` — Visual polish, animations
- All 5 feature components — Visual polish
- All 8 pages — Entrance animations, layout refinement

### Dark Mode Testing
1. Open the app in the browser
2. Click the theme toggle in the navigation bar
3. Verify all pages render correctly in both modes
4. Test system preference detection: close the app, change OS theme, reopen
5. Test persistence: toggle to dark, reload page — should remain dark

### Conventions
- Animations: use Framer Motion `<motion.div>` components, not CSS animation classes (except simple hover/focus transitions which remain CSS)
- Colors: always use Tailwind token classes (`bg-background`, `text-foreground`, `bg-primary`, etc.) — never hardcode HSL values
- Dark mode: no separate dark-mode CSS classes needed — everything inherits from CSS custom properties via Tailwind tokens
- Transitions: use `transition-colors`, `transition-all`, or `transition-shadow` Tailwind classes for hover/focus micro-interactions (150–300ms)

# Research: Modern UI Redesign

**Feature**: 006-modern-ui-redesign  
**Date**: 2026-03-23  
**Purpose**: Resolve all technical unknowns identified during planning

---

## R-001: Animation Library — Framer Motion

**Decision**: Use `framer-motion` v12 (latest: 12.38.0) for entrance animations and micro-interactions.

**Rationale**:
- Framer Motion is the de-facto React animation library with first-class TypeScript support and React 18 compatibility.
- The `motion` component wrapping pattern (`<motion.div>`) is declarative and composable with existing Tailwind-styled components.
- Tree-shakeable: importing only `motion` and `AnimatePresence` keeps the bundle lean (~30KB gzipped).
- Built-in `prefers-reduced-motion` support via the `useReducedMotion()` hook — animations can be conditionally disabled.
- `AnimatePresence` enables exit animations but has limitations with React Router 6's `createBrowserRouter` (see R-006).

**Alternatives considered**:
- CSS-only (`tailwindcss-animate`): Already in the project. Suitable for simple transitions (hover, focus) but lacks controlled entrance/exit sequences and layout animations.
- `auto-animate` (~2KB): Automatic mount/unmount transitions but no fine-grained control over animation curves or coordinated sequences.

**Install**: `npm install framer-motion --workspace frontend`

---

## R-002: Dark Mode — Tailwind `class` Strategy

**Decision**: Use Tailwind's `darkMode: 'class'` strategy with CSS custom property overrides in a `.dark` selector.

**Rationale**:
- The project already defines all color tokens as HSL CSS custom properties in `:root`. Adding a `.dark` block with alternate HSL values is the lowest-friction path.
- The `class` strategy gives programmatic control (vs. `media` which relies solely on OS preference) — needed for FR-010's manual toggle.
- FOUC prevention: Add an inline `<script>` block in `index.html` (before the React bundle) that reads localStorage and sets the `.dark` class on `<html>` synchronously before paint.

**Pattern**:
```css
:root { --background: 210 40% 98%; /* light values */ }
.dark { --background: 222 47% 11%; /* dark values */ }
```

**Tailwind config change**: Add `darkMode: 'class'` to `tailwind.config.ts`.

**Alternatives considered**:
- `darkMode: 'media'`: No manual toggle possible — rejected per FR-010.
- CSS `color-scheme` property: Limited browser support for custom tokens and no toggle control.

---

## R-003: Indigo-to-Violet Primary Palette

**Decision**: Shift primary from current blue (HSL 221.2 83.2% 53.3%) to an indigo-violet (HSL ~245 58% 52%) with coordinated light/dark surface tokens.

**Rationale**:
- Indigo-violet signals premium and creative positioning, ideal for an event/entertainment platform.
- HSL ~245 with moderate saturation (55-60%) maintains readability in both light and dark modes.
- Foreground on primary: white (0 0% 100%) in light mode; near-white (240 20% 98%) in dark mode for contrast compliance.

**Proposed light mode tokens** (key values):
| Token | HSL | Description |
|-------|-----|-------------|
| `--primary` | 245 58% 52% | Main action color |
| `--primary-foreground` | 0 0% 100% | Text on primary |
| `--background` | 240 20% 98% | Page background (subtle warm gray) |
| `--foreground` | 240 10% 4% | Primary text |
| `--card` | 0 0% 100% | Card surfaces |
| `--muted` | 240 5% 96% | Muted surfaces |
| `--accent` | 240 5% 96% | Accent surfaces |
| `--border` | 240 6% 90% | Borders |

**Proposed dark mode tokens** (key values):
| Token | HSL | Description |
|-------|-----|-------------|
| `--primary` | 245 58% 62% | Lightened for dark bg contrast |
| `--primary-foreground` | 240 20% 98% | Text on primary |
| `--background` | 240 10% 4% | Dark page background |
| `--foreground` | 240 20% 98% | Light text |
| `--card` | 240 10% 8% | Elevated dark surfaces |
| `--muted` | 240 6% 12% | Muted dark surfaces |
| `--accent` | 240 6% 15% | Accent dark surfaces |
| `--border` | 240 6% 18% | Dark borders |

**Alternatives considered**:
- Keep current blue (221.2 83.2% 53.3%): Too generic/SaaS-like for event platform branding.
- Teal/emerald primary: Less appropriate for premium entertainment positioning.

---

## R-004: Theme Context & Persistence

**Decision**: Create a `ThemeContext` React context with `useTheme()` hook. Detection priority: localStorage → `prefers-color-scheme` → default light.

**Rationale**:
- Follows the same pattern as the existing `AuthContext` — familiar to codebase contributors.
- The context manages three states: `'light'`, `'dark'`, `'system'` (follows OS).
- On mount, reads `localStorage.getItem('theme')`. If absent, queries `window.matchMedia('(prefers-color-scheme: dark)')`.
- On toggle, writes to localStorage and toggles `.dark` class on `document.documentElement`.
- A `MediaQueryList` listener keeps mode in sync if the user changes OS preference while in 'system' mode.

**FOUC prevention** (critical):
- An inline `<script>` in `index.html` — before the React bundle script tag — reads localStorage and applies `.dark` synchronously:
```html
<script>
  (function(){var t=localStorage.getItem('theme');
  if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))
  document.documentElement.classList.add('dark')})();
</script>
```

**Alternatives considered**:
- External library (next-themes, use-dark-mode): Unnecessary overhead for a simple toggle context with ~30 lines of code.

---

## R-005: Entrance Animation Pattern

**Decision**: Use a reusable `<MotionPage>` wrapper component that applies fade-in + slide-up animation to page content on mount, respecting `prefers-reduced-motion`.

**Rationale**:
- Wrapping each page's content in a `<motion.div>` with `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, and `transition={{ duration: 0.3 }}` gives a consistent page entrance feel.
- The `useReducedMotion()` hook from Framer Motion can conditionally set `initial` and `animate` to `{}` for users with reduced motion preference.
- This avoids AnimatePresence complexity with React Router (see R-006).

**Components to animate**:
- Page-level: wrap page content in `<MotionPage>` (or inline `<motion.div>`).
- Cards/list items: stagger children with `variants` and `staggerChildren: 0.05`.
- Hero section: separate entrance with scale and opacity.

---

## R-006: AnimatePresence & React Router 6 Limitations

**Decision**: Do NOT use `AnimatePresence` for route-level transitions. Use per-page entrance animations only.

**Rationale**:
- React Router 6's `createBrowserRouter` + `<Outlet>` pattern does not expose the outgoing route element to `AnimatePresence`. The old page unmounts before the new one mounts, making exit animations unreliable without significant workarounds (custom `useOutlet` cloning).
- Per-page entrance-only animations (fade-in on mount) provide 90% of the perceived polish with zero Router integration complexity.
- Exit animations can be added to individual components (dialogs, panels) where `AnimatePresence` works naturally with conditional rendering.

**Alternatives considered**:
- `AnimatePresence` + `useOutlet` clone pattern: Fragile, adds complexity, and causes layout flash between routes. Rejected.
- React Router's `startViewTransition`: Still experimental (View Transitions API) and not universally supported. Not suitable for production.

---

## R-007: Typography & Spacing Refinement

**Decision**: Refine the existing Inter font usage with adjusted font weights, letter-spacing, and a modular type scale via Tailwind config extension.

**Rationale**:
- Inter is already loaded and configured. No new font required.
- Current headings use `font-semibold` uniformly. Differentiation with `font-bold` for h1, `font-semibold` for h2, `font-medium` for h3+ improves hierarchy.
- Letter-spacing: tighten headings (`tracking-tight`) and slightly loosen small text for readability.
- Preload the Inter font via a `<link rel="preload">` tag in `index.html` for faster first-paint typography.

**Alternatives considered**:
- Switch to a different font (Outfit, Space Grotesk, etc.): Adds a new download and risks inconsistency with existing pages during incremental rollout. Inter is already modern and suitable.

---

## Summary

| ID | Decision | Rationale |
|----|----------|-----------|
| R-001 | Framer Motion v12 for animations | Declarative, React-native, tree-shakeable, built-in reduced-motion support |
| R-002 | Tailwind `darkMode: 'class'` | Programmatic toggle + CSS variable overrides match existing architecture |
| R-003 | Indigo-violet primary (~HSL 245 58% 52%) | Premium event positioning, good contrast in both modes |
| R-004 | ThemeContext + localStorage + prefers-color-scheme | Follows AuthContext pattern, FOUC prevention via inline script |
| R-005 | MotionPage wrapper for entrance animations | Consistent page enter feel, respects reduced-motion |
| R-006 | No AnimatePresence for routes | React Router 6 Outlet incompatibility; entrance-only gives 90% value |
| R-007 | Inter font refinement (weights, tracking) | Zero new dependencies, improves hierarchy without font change |

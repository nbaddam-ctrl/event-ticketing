# Quickstart — Comprehensive Professional UI/UX Refresh

## Prerequisites
- Node.js 22 LTS
- npm 10+
- Existing app running with current backend and frontend setup

## 1) Install frontend design-system dependencies

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
```

## 2) Initialize Tailwind and shadcn component foundation

```bash
cd frontend
npx tailwindcss init -p
npx shadcn@latest init
```

Expected setup outcomes:
- Tailwind configured for `src/**/*.{ts,tsx}`
- component alias support for shared UI primitives
- baseline design tokens/theme variables established

## 3) Build reusable UI primitives
Implement base primitives first in shared UI folders:
- Button, Input, Textarea, Select
- Card, Badge, Alert
- Dialog/Sheet
- Skeleton and EmptyState components

Goal: all page redesign work should consume these primitives and variants.

## 4) Migrate pages by user-story priority

### P1: Trust and discoverability
- Redesign attendee pages:
  - event list
  - event details
- Validate hierarchy, readability, and clear primary actions.

### P2: Booking confidence
- Redesign:
  - auth page
  - checkout page
- Validate form clarity, error recovery, and confirmation feedback.

### P3: Operational workflows
- Redesign:
  - organizer dashboard
  - admin organizer requests page
- Validate structured management UX and status/action clarity.

## 5) Validate accessibility and responsive behavior
For each migrated page:
- Keyboard-only navigation works for all interactive controls
- Focus state remains visible and unobscured
- Contrast meets AA expectations for text and controls
- Layout remains fully task-usable across mobile/tablet/desktop tiers

## 6) Run quality gates

```bash
# workspace root
npm run lint
npm run lint:cycles
npm test

# optional build verification
npm run build --workspace frontend
npm run build --workspace backend
```

Expected outcomes:
- No cycle violations
- No lint failures
- Existing functional tests remain green
- Frontend pages reflect consistent professional UI patterns

## 7) UX acceptance checklist
- [ ] Primary action identifiable in under 5 seconds on core pages
- [ ] Attendee browse-to-checkout first-attempt completion rate meets target
- [ ] Organizer/admin top task completion rates meet target
- [ ] Error states provide clear recovery guidance
- [ ] No page appears visually inconsistent or placeholder-like

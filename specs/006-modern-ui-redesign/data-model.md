# Data Model: Modern UI Redesign

**Feature**: 006-modern-ui-redesign  
**Date**: 2026-03-23  
**Purpose**: Define design token structure, component inventory, and state model

---

## 1. Design Token Model

This feature does not introduce database entities. The "data model" is the **design token system** — the structured set of CSS custom properties and Tailwind tokens that define the application's visual identity.

### 1.1 Color Tokens (CSS Custom Properties — HSL format)

All color tokens are defined as `H S% L%` values (no `hsl()` wrapper) in `:root` and `.dark`.

| Token | Light Mode HSL | Dark Mode HSL | Purpose |
|-------|---------------|---------------|---------|
| `--background` | 240 20% 98% | 240 10% 4% | Page background |
| `--foreground` | 240 10% 4% | 240 20% 98% | Primary text |
| `--card` | 0 0% 100% | 240 10% 8% | Card/elevated surfaces |
| `--card-foreground` | 240 10% 4% | 240 20% 98% | Text on cards |
| `--popover` | 0 0% 100% | 240 10% 8% | Popover surfaces |
| `--popover-foreground` | 240 10% 4% | 240 20% 98% | Text in popovers |
| `--primary` | 245 58% 52% | 245 58% 62% | Primary brand (indigo-violet) |
| `--primary-foreground` | 0 0% 100% | 240 20% 98% | Text on primary |
| `--secondary` | 240 5% 96% | 240 4% 16% | Secondary surfaces |
| `--secondary-foreground` | 240 6% 10% | 240 5% 96% | Text on secondary |
| `--muted` | 240 5% 96% | 240 6% 12% | Muted surfaces/text |
| `--muted-foreground` | 240 4% 46% | 240 5% 65% | Subdued text |
| `--accent` | 240 5% 96% | 240 6% 15% | Accent surfaces |
| `--accent-foreground` | 240 6% 10% | 240 5% 96% | Text on accent |
| `--destructive` | 0 84% 60% | 0 63% 31% | Error/danger actions |
| `--destructive-foreground` | 0 0% 98% | 0 86% 97% | Text on destructive |
| `--success` | 142 76% 36% | 142 70% 45% | Success indicators |
| `--success-foreground` | 0 0% 100% | 142 80% 95% | Text on success |
| `--warning` | 38 92% 50% | 48 96% 53% | Warning indicators |
| `--warning-foreground` | 0 0% 100% | 38 92% 10% | Text on warning |
| `--info` | 199 89% 48% | 199 89% 58% | Info indicators |
| `--info-foreground` | 0 0% 100% | 199 89% 95% | Text on info |
| `--border` | 240 6% 90% | 240 6% 18% | Borders |
| `--input` | 240 6% 90% | 240 6% 18% | Input borders |
| `--ring` | 245 58% 52% | 245 58% 62% | Focus ring |
| `--radius` | 0.625rem | 0.625rem | Base border radius |

### 1.2 Shadow Tokens (Tailwind config extension)

| Name | Light Mode Value | Dark Mode Value | Usage |
|------|-----------------|-----------------|-------|
| `sm` | `0 1px 2px rgb(0 0 0 / 0.05)` | `0 1px 2px rgb(0 0 0 / 0.3)` | Subtle elevation |
| `md` | `0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)` | CSS variable or adjusted opacity | Card default |
| `lg` | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)` | CSS variable or adjusted opacity | Card hover |
| `xl` | `0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)` | Adjusted opacity | Hero/modal |

### 1.3 Typography Tokens

| Element | Size Class | Weight | Tracking | Line Height |
|---------|-----------|--------|----------|-------------|
| Hero headline | `text-4xl` / `sm:text-5xl` | `font-bold` | `tracking-tight` | `leading-tight` |
| Page title (h1) | `text-2xl` / `sm:text-3xl` | `font-bold` | `tracking-tight` | `leading-tight` |
| Section title (h2) | `text-xl` | `font-semibold` | default | default |
| Card title (h3) | `text-lg` | `font-semibold` | default | `leading-tight` |
| Body text | `text-sm` / `text-base` | `font-normal` | default | `leading-relaxed` |
| Caption/label | `text-xs` / `text-sm` | `font-medium` | `tracking-wide` | default |
| Muted text | `text-sm` | `font-normal` | default | default |

### 1.4 Transition Tokens

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `transition-colors` | 150ms | ease | Button/link color shifts |
| `transition-all` | 200ms | ease | Card hover (shadow + border) |
| `transition-shadow` | 200ms | ease | Shadow elevation changes |
| Page entrance | 300ms | ease-out | Framer Motion fade+slide |
| Stagger children | 50ms per child | ease-out | List item cascade |

---

## 2. Component Inventory

### 2.1 UI Base Components (enhanced in place)

| Component | File | Changes |
|-----------|------|---------|
| `Button` | `ui/Button.tsx` | Indigo-violet primary, refined hover/focus, smooth transitions |
| `Card` | `ui/Card.tsx` | Enhanced shadow, hover elevation, dark mode surface |
| `Badge` | `ui/Badge.tsx` | Updated palette variants, dark mode contrast |
| `Input` | `ui/Input.tsx` | Branded focus ring, label styling, transition states |
| `Alert` | `ui/Alert.tsx` | Dark mode variants, refined spacing |
| `Dialog` | `ui/Dialog.tsx` | Backdrop blur, entrance animation |
| `Skeleton` | `ui/Skeleton.tsx` | Shimmer animation refinement for dark mode |
| `Select` | `ui/Select.tsx` | Focus ring, transition polish |
| `Tabs` | `ui/Tabs.tsx` | Active indicator, transition polish |
| `EmptyState` | `ui/EmptyState.tsx` | Enhanced icon treatment, spacing |
| `Separator` | `ui/Separator.tsx` | Dark mode border color |
| `Table` | `ui/Table.tsx` | Row hover, header styling, dark mode |
| `Textarea` | `ui/Textarea.tsx` | Focus ring, transition states |
| `Sheet` | `ui/Sheet.tsx` | Dark mode surface, animation |
| `Spinner` | `ui/Spinner.tsx` | Brand primary color |
| `Toast` | `ui/Toast.tsx` | Dark mode variants |

### 2.2 App Components (enhanced + new)

| Component | File | Status | Changes |
|-----------|------|--------|---------|
| `AppShell` | `app/AppShell.tsx` | Modified | Add Footer, animation wrapper |
| `Navigation` | `app/Navigation.tsx` | Modified | Dark mode toggle, polished active states, mobile transition |
| `Footer` | `app/Footer.tsx` | **NEW** | Minimal footer: brand, copyright, separator |
| `HeroSection` | `app/HeroSection.tsx` | **NEW** | Hero banner with headline, subtext, CTA |
| `EventCard` | `app/EventCard.tsx` | Modified | Gradient header, price badge, hover animation |
| `PageHeader` | `app/PageHeader.tsx` | Modified | Entrance animation wrapper |
| `EventSearchFilters` | `app/EventSearchFilters.tsx` | Modified | Visual grouping, active filter indicators |
| `EventDetailsSummary` | `app/EventDetailsSummary.tsx` | Modified | Layout polish |
| `OrderSummary` | `app/OrderSummary.tsx` | Modified | Enhanced styling |
| `StatusPanel` | `app/StatusPanel.tsx` | Modified | Dark mode styling |
| `DataTable` | `app/DataTable.tsx` | Modified | Row hover, header styling |
| `FormField` | `app/FormField.tsx` | Modified | Label + validation styling |
| `NotificationBell` | `app/NotificationBell.tsx` | Modified | Polish |
| `NotificationPanel` | `app/NotificationPanel.tsx` | Modified | Dark mode |
| `NotificationItem` | `app/NotificationItem.tsx` | Modified | Dark mode |
| `ConfirmationBanner` | `app/ConfirmationBanner.tsx` | Modified | Animation |
| `ActionConfirmDialog` | `app/ActionConfirmDialog.tsx` | Modified | Dark mode, animation |

### 2.3 Feature Components (enhanced)

| Component | File | Changes |
|-----------|------|---------|
| `DiscountCodeInput` | `DiscountCodeInput.tsx` | Input focus, validation styling |
| `WaitlistPanel` | `WaitlistPanel.tsx` | Dark mode, spacing |
| `OrganizerEventForm` | `OrganizerEventForm.tsx` | Form layout, label polish |
| `EventCancellationPanel` | `EventCancellationPanel.tsx` | Dark mode, spacing |
| `TierManagementPanel` | `TierManagementPanel.tsx` | Dark mode, card layout |

### 2.4 New Infrastructure

| Component | File | Purpose |
|-----------|------|---------|
| `ThemeContext` | `contexts/ThemeContext.tsx` | Dark/light mode state, toggle, persistence |

---

## 3. State Model: Color Mode

```
States: 'light' | 'dark' | 'system'

Transitions:
  First visit (no localStorage) → detect prefers-color-scheme → apply 'system'
  User toggles → write to localStorage → apply selected mode
  System mode + OS change → listen to matchMedia → update applied mode

Storage:
  localStorage key: 'theme'
  Values: 'light' | 'dark' | 'system'
  Absence: treated as 'system'

DOM effect:
  'dark' applied → document.documentElement.classList.add('dark')
  'light' applied → document.documentElement.classList.remove('dark')
```

---

## 4. Page Inventory (8 pages, all modified)

| Page | File | Key Visual Changes |
|------|------|--------------------|
| EventListPage | `pages/EventListPage.tsx` | Hero section, refined card grid, entrance animation |
| EventDetailsPage | `pages/EventDetailsPage.tsx` | Header layout, tier cards, availability indicators |
| CheckoutPage | `pages/CheckoutPage.tsx` | Order summary panel, form polish, confirmation |
| AuthPage | `pages/AuthPage.tsx` | Branded card header, form polish, tab styling |
| MyBookingsPage | `pages/MyBookingsPage.tsx` | Booking card layout, status badges, empty state |
| OrganizerDashboardPage | `pages/OrganizerDashboardPage.tsx` | Event card layout, metrics, action polish |
| RequestOrganizerPage | `pages/RequestOrganizerPage.tsx` | Form layout, confirmation polish |
| AdminOrganizerRequestsPage | `pages/AdminOrganizerRequestsPage.tsx` | Table styling, action buttons, status badges |

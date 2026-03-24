# event-ticketing-system Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-26

## Active Technologies
- TypeScript 5.x on Node.js 22 LTS (backend), TypeScript 5.x + React 18 (frontend) + Express 4.x, SQLite3, JWT (`jsonwebtoken`), schema validation (Zod), React Router, Vite (001-event-ticket-booking)
- SQLite (single primary relational database) (001-event-ticket-booking)
- TypeScript 5.x, React 18.x (frontend), Node.js 22 LTS runtime in workspace + Vite, React Router, Tailwind CSS, shadcn-style component scaffolding, class-variance-authority, tailwind-merge, clsx, lucide-react (001-uiux-professional-redesign)
- N/A for redesign scope (existing backend SQLite persists unchanged) (001-uiux-professional-redesign)
- TypeScript 5.x (strict mode) + React 18.x, React Router 6.x, Vite 6.x, Tailwind CSS 3.x, shadcn-style components (cva, clsx, tailwind-merge, lucide-react) (002-fix-nav-pricing)
- N/A (frontend-only changes; backend uses SQLite via better-sqlite3, unchanged) (002-fix-nav-pricing)
- TypeScript ^5.8.2 (backend ES2022/NodeNext, frontend ESNext/Bundler) + Express ^4.21.2, better-sqlite3 ^11.7.0, Zod ^3.24.2, jsonwebtoken ^9.0.2 (backend); React ^18.3.1, react-router-dom ^6.30.0, Vite ^6.2.1, Tailwind CSS ^3.4.19, lucide-react ^0.577.0 (frontend) (003-notifications)
- SQLite via better-sqlite3 (synchronous, single `db` instance, `withTransaction` helper) (003-notifications)
- SQLite via better-sqlite3 (synchronous, single `db` instance, `withTransaction<T>` helper) (004-core-ux-enhancements)
- TypeScript 5.8, Node.js (ES2022 target) + Express 4.x, better-sqlite3, Zod, React 18, React Router 6 (005-qa-test-scenarios)
- SQLite via better-sqlite3 (file-based, `DATABASE_URL` env var) (005-qa-test-scenarios)
- TypeScript 5.8, React 18 + React 18, React Router 6, Tailwind CSS, tailwindcss-animate, class-variance-authority, clsx, tailwind-merge, lucide-react, Framer Motion (new) (006-modern-ui-redesign)
- localStorage (dark mode preference persistence only) (006-modern-ui-redesign)

- TypeScript 5.x on Node.js 22 LTS + Fastify, Zod, Prisma ORM, OpenAPI tooling (master)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x on Node.js 22 LTS: Follow standard conventions

## Recent Changes
- 006-modern-ui-redesign: Added TypeScript 5.8, React 18 + React 18, React Router 6, Tailwind CSS, tailwindcss-animate, class-variance-authority, clsx, tailwind-merge, lucide-react, Framer Motion (new)
- 005-qa-test-scenarios: Added TypeScript 5.8, Node.js (ES2022 target) + Express 4.x, better-sqlite3, Zod, React 18, React Router 6
- 004-core-ux-enhancements: Added TypeScript ^5.8.2 (backend ES2022/NodeNext, frontend ESNext/Bundler) + Express ^4.21.2, better-sqlite3 ^11.7.0, Zod ^3.24.2, jsonwebtoken ^9.0.2 (backend); React ^18.3.1, react-router-dom ^6.30.0, Vite ^6.2.1, Tailwind CSS ^3.4.19, lucide-react ^0.577.0 (frontend)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

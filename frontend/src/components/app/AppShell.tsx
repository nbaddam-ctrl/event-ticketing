import { Outlet } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { ErrorBoundary } from './ErrorBoundary';

export function AppShell() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <ErrorBoundary>
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

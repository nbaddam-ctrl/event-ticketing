import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui';
import { Sparkles } from 'lucide-react';

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 px-6 py-16 text-primary-foreground sm:px-12 sm:py-20">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08)_0%,transparent_40%)]" />

      <motion.div
        className="relative z-10 mx-auto max-w-2xl text-center"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
        >
          <Sparkles className="h-4 w-4" />
          Discover amazing events
        </motion.div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight">
          Find Your Next
          <br />
          <span className="text-white/90">Unforgettable Experience</span>
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-white/80 sm:text-xl">
          Browse and book tickets for the best events happening near you.
          From concerts to conferences, we&apos;ve got you covered.
        </p>

        <motion.div
          className="mt-8"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
        >
          <Link to="#events">
            <Button
              size="lg"
              className="bg-white text-primary font-semibold shadow-lg hover:bg-white/90 hover:shadow-xl transition-all duration-200"
            >
              Browse Events
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

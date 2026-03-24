import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { listEvents, type EventListResult, type EventFilterParams } from '../services/attendeeApi';
import { EventSearchFilters, type EventFilterValues } from '../components/app/EventSearchFilters';
import { HeroSection } from '../components/app/HeroSection';
import { EventCard } from '../components/app/EventCard';
import { Alert, AlertDescription, EmptyState, Skeleton, Button } from '../components/ui';
import { CalendarPlus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

const emptyFilters: EventFilterValues = {
  search: '',
  dateFrom: '',
  dateTo: '',
  minPriceDollars: '',
  maxPriceDollars: '',
  includePast: false,
};

function EventListSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <Skeleton className="h-28 rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventListPage() {
  useDocumentTitle('Events');
  const [data, setData] = useState<EventListResult | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EventFilterValues>(emptyFilters);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const prefersReducedMotion = useReducedMotion();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Reset page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.dateFrom, filters.dateTo, filters.minPriceDollars, filters.maxPriceDollars, filters.includePast]);

  // Fetch events
  useEffect(() => {
    setLoading(true);
    setError('');

    const params: EventFilterParams = {
      page,
      pageSize: PAGE_SIZE,
      includePast: filters.includePast || undefined,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.dateFrom) params.dateFrom = new Date(filters.dateFrom).toISOString();
    if (filters.dateTo) {
      // Set to end of day
      const d = new Date(filters.dateTo);
      d.setHours(23, 59, 59, 999);
      params.dateTo = d.toISOString();
    }
    if (filters.minPriceDollars) params.minPrice = Number(filters.minPriceDollars) * 100;
    if (filters.maxPriceDollars) params.maxPrice = Number(filters.maxPriceDollars) * 100;

    listEvents(params)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters.dateFrom, filters.dateTo, filters.minPriceDollars, filters.maxPriceDollars, filters.includePast, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const hasActiveFilters = debouncedSearch || filters.dateFrom || filters.dateTo || filters.minPriceDollars || filters.maxPriceDollars || filters.includePast;

  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  };

  return (
    <div className="space-y-8">
      <HeroSection />

      <div id="events" className="space-y-6">
        <EventSearchFilters values={filters} onChange={setFilters} />

        {loading && <EventListSkeleton />}

        {!loading && error && (
          <Alert variant="error">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState
            icon={<CalendarPlus className="h-10 w-10" />}
            title={hasActiveFilters ? 'No events found' : 'No events yet'}
            description={
              hasActiveFilters
                ? 'No events match your current search and filters. Try adjusting your criteria.'
                : 'There are no published events at the moment. Check back soon!'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={() => setFilters(emptyFilters)}>
                  Clear all filters
                </Button>
              ) : (
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              )
            }
          />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {data.total} event{data.total !== 1 ? 's' : ''} found
              </span>
              <span>
                Page {page} of {totalPages}
              </span>
            </div>

            <motion.div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              variants={prefersReducedMotion ? {} : containerVariants}
              initial="hidden"
              animate="show"
            >
              {data.items.map((event) => (
                <motion.div key={event.id} variants={prefersReducedMotion ? {} : itemVariants}>
                  <EventCard
                    id={event.id}
                    title={event.title}
                    venueName={event.venueName}
                    startAt={event.startAt}
                  />
                </motion.div>
              ))}
            </motion.div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

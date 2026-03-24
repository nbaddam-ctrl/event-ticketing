import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { motion, useReducedMotion } from 'framer-motion';
import { getEventDetails, type EventDetailsResult } from '../services/attendeeApi';
import { WaitlistPanel } from '../components/WaitlistPanel';
import { PageHeader } from '../components/app/PageHeader';
import {
  Card,
  CardContent,
  Badge,
  Button,
  Separator,
  Skeleton,
  EmptyState,
  Alert,
  AlertDescription,
} from '../components/ui';
import { MapPin, DollarSign, Users, Ticket, ArrowLeft, Calendar } from 'lucide-react';
import { formatDateRange } from '../lib/formatDateRange';

function EventDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function EventDetailsPage() {
  const { eventId } = useParams();
  const [data, setData] = useState<EventDetailsResult | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  useDocumentTitle(data?.title ?? 'Event Details');

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError('');
    getEventDetails(eventId)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return <EventDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState title="Event not found" description="The event you're looking for doesn't exist." />
    );
  }

  const totalCapacity = data.tiers.reduce((sum, t) => sum + t.remainingQuantity, 0);
  const minPrice = data.tiers.length > 0 ? Math.min(...data.tiers.map((t) => t.priceMinor)) : 0;
  const hasAvailability = totalCapacity > 0;
  const isCancelled = data.status === 'cancelled';

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.title}
        subtitle={data.description || 'No description provided.'}
        breadcrumbs={[{ label: 'Events', to: '/' }, { label: data.title }]}
      />

      {/* Cancellation banner */}
      {isCancelled && (
        <Alert variant="error">
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">This event has been cancelled.</p>
              {data.cancellationReason && (
                <p className="text-sm">Reason: {data.cancellationReason}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Event summary card */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      >
        <Card>
          <div className="h-3 rounded-t-lg bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{data.venueName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0 text-primary" />
                  <span>{formatDateRange(data.startAt, data.endAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 shrink-0 text-primary" />
                  <span>From ${(minPrice / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0 text-primary" />
                  <span>{totalCapacity} tickets left</span>
                </div>
              </div>
              <Badge variant={hasAvailability ? 'success' : 'destructive'} className="self-start sm:self-center">
                {hasAvailability ? 'Available' : 'Sold Out'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ticket tiers */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Ticket Tiers
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data.tiers.map((tier, idx) => {
            const isSoldOut = tier.remainingQuantity === 0;

            return (
              <motion.div
                key={tier.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + idx * 0.05, ease: 'easeOut' }}
              >
                <Card className={`overflow-hidden ${isSoldOut && !isCancelled ? 'opacity-70' : ''}`}>
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold tracking-tight">{tier.name}</h3>
                          <p className="text-2xl font-bold text-primary">
                            ${(tier.priceMinor / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="shrink-0 pt-1">
                          {isCancelled ? (
                            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                          ) : tier.remainingQuantity > 0 ? (
                            <Link to={`/checkout/${data.id}/${tier.id}`}>
                              <Button size="sm">
                                <Ticket className="mr-1.5 h-4 w-4" />
                                Book Now
                              </Button>
                            </Link>
                          ) : (
                            <WaitlistPanel eventId={data.id} tierId={tier.id} />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isSoldOut ? 'Sold out' : `${tier.remainingQuantity} remaining`}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Back link */}
      <div>
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </div>
    </div>
  );
}

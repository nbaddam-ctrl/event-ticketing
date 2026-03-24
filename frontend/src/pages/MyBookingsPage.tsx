import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { motion, useReducedMotion } from 'framer-motion';
import { getMyBookings, cancelBooking, type BookingItem } from '../services/attendeeApi';
import { ActionConfirmDialog } from '../components/app/ActionConfirmDialog';
import { PageHeader } from '../components/app/PageHeader';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Skeleton,
  Separator,
} from '../components/ui';
import { CalendarDays, MapPin, Ticket, RefreshCw, Clock, XCircle } from 'lucide-react';

function BookingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusVariant(status: string): 'default' | 'success' | 'destructive' | 'warning' {
  switch (status) {
    case 'confirmed': return 'success';
    case 'cancelled': return 'destructive';
    case 'refunded': return 'warning';
    default: return 'default';
  }
}

export function MyBookingsPage() {
  useDocumentTitle('My Bookings');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState('');
  const prefersReducedMotion = useReducedMotion();

  function fetchBookings() {
    setLoading(true);
    setError('');
    getMyBookings()
      .then((data) => setBookings(data.items))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await cancelBooking(cancelTarget.id);
      setCancelSuccess(
        `Booking cancelled. A refund of $${(result.refundAmountMinor / 100).toFixed(2)} has been initiated.`
      );
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      setError((err as Error).message);
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bookings"
        subtitle="View all your ticket purchases and booking history."
        actions={
          <Button variant="outline" size="sm" onClick={fetchBookings} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {loading && <BookingSkeleton />}

      {cancelSuccess && (
        <Alert variant="success" dismissible onDismiss={() => setCancelSuccess('')}>
          <AlertDescription>{cancelSuccess}</AlertDescription>
        </Alert>
      )}

      {!loading && error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && bookings.length === 0 && (
        <EmptyState
          icon={<Ticket className="h-12 w-12" />}
          title="No bookings yet"
          description="You haven't purchased any tickets yet. Browse events to get started!"
          action={
            <Link to="/">
              <Button variant="outline">
                <CalendarDays className="mr-2 h-4 w-4" />
                Browse Events
              </Button>
            </Link>
          }
        />
      )}

      {!loading && !error && bookings.length > 0 && (
        <motion.div
          className="space-y-4"
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={prefersReducedMotion ? {} : { opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/events/${booking.eventId}`} className="hover:underline">
                        <h3 className="font-semibold text-foreground truncate">
                          {booking.eventTitle}
                        </h3>
                      </Link>
                      <Badge variant={statusVariant(booking.status)} className="text-xs capitalize">
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Ticket className="h-3.5 w-3.5" />
                        {booking.tierName} &times; {booking.quantity}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {booking.venueName}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(booking.eventStartAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Booked {formatDate(booking.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-lg font-bold text-foreground">
                      ${(booking.totalPaidMinor / 100).toFixed(2)}
                    </span>
                    {booking.discountAmountMinor > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground line-through">
                          ${(booking.subtotalMinor / 100).toFixed(2)}
                        </span>
                        <Badge variant="success" className="text-xs">
                          Saved ${(booking.discountAmountMinor / 100).toFixed(2)}
                        </Badge>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setCancelTarget(booking)}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Separator />
          <p className="text-center text-sm text-muted-foreground">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} total
          </p>
        </motion.div>
      )}

      <ActionConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Booking"
        description={
          cancelTarget
            ? `Are you sure you want to cancel your booking for "${cancelTarget.eventTitle}" (${cancelTarget.tierName}, ${cancelTarget.quantity} ticket(s))? This action is irreversible and a refund of $${(cancelTarget.totalPaidMinor / 100).toFixed(2)} will be initiated.`
            : ''
        }
        confirmLabel="Cancel Booking"
        variant="destructive"
        loading={cancelling}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { requestOrganizerRole, listOrganizerEvents, type OrganizerEventItem } from '../services/organizerApi';
import { OrganizerEventForm } from '../components/OrganizerEventForm';
import { EventCancellationPanel } from '../components/EventCancellationPanel';
import { TierManagementPanel } from '../components/TierManagementPanel';
import { PageHeader } from '../components/app/PageHeader';
import { ConfirmationBanner } from '../components/app/ConfirmationBanner';
import { Button, Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription, Separator, Badge, EmptyState, Skeleton } from '../components/ui';
import { UserCheck, PlusCircle, XCircle, CalendarDays, MapPin, Ticket, ListOrdered, Layers } from 'lucide-react';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusVariant(status: string): 'default' | 'success' | 'destructive' {
  switch (status) {
    case 'published': return 'success';
    case 'cancelled': return 'destructive';
    default: return 'default';
  }
}

export function OrganizerDashboardPage() {
  useDocumentTitle('Organizer Dashboard');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<OrganizerEventItem[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [eventsPage, setEventsPage] = useState(1);

  function fetchEvents(pg = eventsPage) {
    setEventsLoading(true);
    setEventsError('');
    listOrganizerEvents(pg, 10)
      .then((data) => {
        setEvents(data.items);
        setEventsTotal(data.total);
      })
      .catch((err: Error) => setEventsError(err.message))
      .finally(() => setEventsLoading(false));
  }

  useEffect(() => {
    fetchEvents();
  }, [eventsPage]);

  const prefersReducedMotion = useReducedMotion();

  async function requestRole() {
    if (loading) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await requestOrganizerRole();
      setMessage(`Organizer request ${result.requestId}: ${result.status}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizer Dashboard"
        subtitle="Request organizer access, publish events, and manage cancellations."
        actions={
          <Button onClick={requestRole} loading={loading}>
            <UserCheck className="mr-2 h-4 w-4" />
            Request Organizer Role
          </Button>
        }
      />

      {message && (
        <ConfirmationBanner type="success" title="Request Submitted" message={message} />
      )}

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.div
        className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Create Event */}
        <Card className="order-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PlusCircle className="h-5 w-5 text-primary" />
              Create Event
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <OrganizerEventForm />
          </CardContent>
        </Card>

        {/* Cancel Event */}
        <Card className="order-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <XCircle className="h-5 w-5 text-destructive" />
              Cancel Event
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <EventCancellationPanel />
          </CardContent>
        </Card>
      </motion.div>

      {/* Manage Ticket Tiers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5 text-primary" />
            Manage Ticket Tiers
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <TierManagementPanel />
        </CardContent>
      </Card>

      {/* My Events List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListOrdered className="h-5 w-5 text-primary" />
            My Events
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          {eventsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}

          {!eventsLoading && eventsError && (
            <Alert variant="error">
              <AlertDescription>{eventsError}</AlertDescription>
            </Alert>
          )}

          {!eventsLoading && !eventsError && events.length === 0 && (
            <EmptyState
              icon={<CalendarDays className="h-10 w-10" />}
              title="No events yet"
              description="You haven't created any events yet. Use the form above to publish your first event!"
            />
          )}

          {!eventsLoading && !eventsError && events.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {eventsTotal} event{eventsTotal !== 1 ? 's' : ''} total
              </div>
              <div className="divide-y divide-border rounded-md border">
                {events.map((event) => (
                  <div key={event.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground truncate">{event.title}</span>
                        <Badge variant={statusVariant(event.status)} className="text-xs capitalize">
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(event.startAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venueName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Ticket className="h-3 w-3" />
                          {event.totalSold} / {event.totalCapacity} sold
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {eventsTotal > 10 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={eventsPage <= 1}
                    onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {eventsPage} of {Math.ceil(eventsTotal / 10)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={eventsPage >= Math.ceil(eventsTotal / 10)}
                    onClick={() => setEventsPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

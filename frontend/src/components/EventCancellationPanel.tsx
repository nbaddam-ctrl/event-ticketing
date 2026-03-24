import { useState, useEffect, type FormEvent } from 'react';
import { cancelOrganizerEvent } from '../services/organizerApi';
import { listEvents } from '../services/attendeeApi';
import { Input, Button, Alert, AlertDescription } from '../components/ui';
import { ConfirmationBanner } from '../components/app/ConfirmationBanner';
import { ActionConfirmDialog } from '../components/app/ActionConfirmDialog';
import { Search, CalendarDays, MapPin } from 'lucide-react';

interface EventOption {
  id: string;
  title: string;
  venueName: string;
  startAt: string;
}

export function EventCancellationPanel() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    listEvents()
      .then((data) => setEvents(data.items))
      .catch(() => { /* ignore – list just won't populate */ })
      .finally(() => setEventsLoading(false));
  }, []);

  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(search.toLowerCase()) ||
    ev.venueName.toLowerCase().includes(search.toLowerCase())
  );

  function selectEvent(ev: EventOption) {
    setSelectedEvent(ev);
    setSearch('');
  }

  function openConfirm(e: FormEvent) {
    e.preventDefault();
    if (!selectedEvent) return;
    setConfirmOpen(true);
  }

  async function confirmCancel() {
    if (loading || !selectedEvent) return;
    setLoading(true);
    setError('');
    setMessage('');
    setConfirmOpen(false);

    try {
      const result = await cancelOrganizerEvent(selectedEvent.id, reason || undefined);
      setMessage(`"${selectedEvent.title}" cancelled. ${result.refundCount} refund(s) initiated.`);
      setSelectedEvent(null);
      setReason('');
      // Refresh the event list
      listEvents().then((data) => setEvents(data.items)).catch(() => {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <ConfirmationBanner type="success" title="Event Cancelled" message={message} />
      )}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Event selector */}
      {selectedEvent ? (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{selectedEvent.title}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedEvent.venueName}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(selectedEvent.startAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEvent(null)}
            >
              Change
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by name or venue..."
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-md border">
            {eventsLoading && (
              <p className="p-3 text-sm text-muted-foreground">Loading events...</p>
            )}
            {!eventsLoading && filteredEvents.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                {search ? 'No events match your search.' : 'No events found.'}
              </p>
            )}
            {filteredEvents.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => selectEvent(ev)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground border-b last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{ev.title}</p>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ev.venueName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(ev.startAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={openConfirm} className="space-y-4">
        <Input
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Cancellation reason (optional)"
        />
        <Button
          type="submit"
          variant="destructive"
          loading={loading}
          className="w-full"
          disabled={!selectedEvent}
        >
          Cancel Event
        </Button>
      </form>

      <ActionConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmCancel}
        title="Cancel Event"
        description={`This will cancel "${selectedEvent?.title ?? ''}" and initiate refunds for all bookings. This action cannot be undone.`}
        confirmLabel="Yes, Cancel Event"
        variant="destructive"
        loading={loading}
      />
    </div>
  );
}

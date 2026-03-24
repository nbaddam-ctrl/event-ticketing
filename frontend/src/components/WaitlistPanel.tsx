import { useState } from 'react';
import { joinWaitlist } from '../services/checkoutApi';
import { Button, Badge, Alert, AlertDescription } from '../components/ui';
import { Bell } from 'lucide-react';

interface Props {
  eventId: string;
  tierId: string;
}

export function WaitlistPanel({ eventId, tierId }: Props) {
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function join() {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const result = await joinWaitlist({ eventId, ticketTierId: tierId, requestedQuantity: 1 });
      setPosition(result.position);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (position !== null) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-info/10 px-3 py-2">
        <Bell className="h-4 w-4 text-info" />
        <span className="text-sm">Waitlisted at position</span>
        <Badge variant="info">{position}</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" size="sm" onClick={join} loading={loading}>
        <Bell className="mr-1.5 h-4 w-4" />
        Join Waitlist
      </Button>
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

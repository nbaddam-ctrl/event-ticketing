import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { requestOrganizerRole } from '../services/organizerApi';
import { PageHeader } from '../components/app/PageHeader';
import { ConfirmationBanner } from '../components/app/ConfirmationBanner';
import { Card, CardContent, Button, Alert, AlertDescription } from '../components/ui';
import { UserCheck, Clock, ArrowRight } from 'lucide-react';

export function RequestOrganizerPage() {
  useDocumentTitle('Become an Organizer');
  const [status, setStatus] = useState<'idle' | 'pending' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  async function handleRequest() {
    if (loading) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await requestOrganizerRole();
      setStatus('pending');
      setMessage(
        result.status === 'pending'
          ? 'Your organizer request has been submitted and is awaiting admin approval.'
          : `Request status: ${result.status}`
      );
    } catch (err) {
      const msg = (err as Error).message;
      // If there's already a pending request, show that as info rather than error
      if (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('already')) {
        setStatus('pending');
        setMessage('You already have a pending organizer request. An admin will review it shortly.');
      } else {
        setStatus('error');
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Become an Organizer"
        subtitle="Request organizer access to create and manage events on EventTix."
      />

      {message && (
        <ConfirmationBanner
          type="success"
          title="Request Submitted"
          message={message}
        />
      )}

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mx-auto max-w-lg">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
        <Card>
          <CardContent className="py-8 space-y-6 text-center">
            {status === 'idle' && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <UserCheck className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Want to host events?</h3>
                  <p className="text-sm text-muted-foreground">
                    As an organizer you can create events, set ticket tiers and pricing,
                    and manage your event listings. Submit a request and an admin will
                    review it.
                  </p>
                </div>
                <Button onClick={handleRequest} loading={loading} size="lg" className="gap-2">
                  Request Organizer Role
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {status === 'pending' && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
                  <Clock className="h-8 w-8 text-warning" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Request Pending</h3>
                  <p className="text-sm text-muted-foreground">
                    Your request is being reviewed by an admin. You&apos;ll gain organizer
                    access once it&apos;s approved. Check back soon!
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}

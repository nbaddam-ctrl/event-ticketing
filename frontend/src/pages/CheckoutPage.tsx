import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { motion, useReducedMotion } from 'framer-motion';
import { createBooking, getEventDetails } from '../services/attendeeApi';
import { DiscountCodeInput } from '../components/DiscountCodeInput';
import { PageHeader } from '../components/app/PageHeader';
import { OrderSummary } from '../components/app/OrderSummary';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Button,
  Alert,
  AlertDescription,
} from '../components/ui';
import { ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';

export function CheckoutPage() {
  const { eventId, tierId } = useParams();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  useDocumentTitle('Checkout');
  const [quantity, setQuantity] = useState(1);
  const [discountCode, setDiscountCode] = useState<string | undefined>(undefined);
  const [discountAmountMinor, setDiscountAmountMinor] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tier pricing state
  const [tierName, setTierName] = useState('');
  const [unitPriceMinor, setUnitPriceMinor] = useState(0);
  const [tierLoading, setTierLoading] = useState(true);
  const [tierError, setTierError] = useState('');

  useEffect(() => {
    if (!eventId || !tierId) {
      setTierLoading(false);
      setTierError('Invalid checkout route');
      return;
    }

    let cancelled = false;

    async function fetchTier() {
      try {
        const event = await getEventDetails(eventId!);
        if (cancelled) return;
        const tier = event.tiers.find((t) => t.id === tierId);
        if (!tier) {
          setTierError('Ticket tier not found');
          return;
        }
        setTierName(tier.name);
        setUnitPriceMinor(tier.priceMinor);
      } catch (err) {
        if (!cancelled) {
          setTierError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setTierLoading(false);
        }
      }
    }

    fetchTier();
    return () => { cancelled = true; };
  }, [eventId, tierId]);

  const clampedQuantity = Math.max(1, quantity);
  const subtotalMinor = unitPriceMinor * clampedQuantity;
  const totalMinor = Math.max(0, subtotalMinor - discountAmountMinor);

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!eventId || !tierId) {
      setError('Invalid checkout route');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createBooking({ eventId, ticketTierId: tierId, quantity: clampedQuantity, discountCode });
      navigate('/my-bookings', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (tierLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tierError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Checkout" subtitle="Something went wrong." />
        <Alert variant="error">
          <AlertDescription>{tierError}</AlertDescription>
        </Alert>
        <Link to={eventId ? `/events/${eventId}` : '/'}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout"
        subtitle="Confirm your ticket details and complete your purchase."
        breadcrumbs={[
          { label: 'Events', to: '/' },
          ...(eventId ? [{ label: 'Event Details', to: `/events/${eventId}` }] : []),
          { label: 'Checkout' },
        ]}
      />

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.div
        className="grid gap-6 lg:grid-cols-5"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Form section */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5" />
                {tierName || 'Ticket Details'}
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleCheckout}>
              <CardContent className="space-y-4">
                <Input
                  label="Quantity"
                  type="number"
                  min={1}
                  value={clampedQuantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  helperText={`$${(unitPriceMinor / 100).toFixed(2)} per ticket`}
                />

                {eventId && tierId && (
                  <div className="pt-2">
                    <DiscountCodeInput
                      eventId={eventId}
                      tierId={tierId}
                      quantity={quantity}
                      onApplied={(code, amountMinor) => {
                        setDiscountCode(code);
                        setDiscountAmountMinor(amountMinor);
                      }}
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" loading={loading}>
                  Complete Purchase
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-2">
          <OrderSummary
            items={[{ label: tierName || 'Tickets', quantity: clampedQuantity, unitPrice: unitPriceMinor, total: subtotalMinor }]}
            discountLabel={discountCode}
            discountAmount={discountAmountMinor}
            total={totalMinor}
          />
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Prices shown in USD.
          </p>
        </div>
      </motion.div>

      <div>
        <Link to={eventId ? `/events/${eventId}` : '/'}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
    </div>
  );
}

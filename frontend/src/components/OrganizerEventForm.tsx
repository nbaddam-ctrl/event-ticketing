import { useState, type FormEvent } from 'react';
import { createOrganizerEvent } from '../services/organizerApi';
import { Input, Button, Alert, AlertDescription, Select } from '../components/ui';
import { ConfirmationBanner } from '../components/app/ConfirmationBanner';
import { Plus, Trash2 } from 'lucide-react';

function toISOUtc(datetimeLocal: string): string {
  if (!datetimeLocal) return '';
  return new Date(datetimeLocal).toISOString();
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
];

interface TierFormData {
  key: number;
  name: string;
  price: string;
  currency: string;
  capacity: string;
}

let tierKeyCounter = 1;

function createEmptyTier(defaults?: Partial<TierFormData>): TierFormData {
  return {
    key: tierKeyCounter++,
    name: defaults?.name ?? '',
    price: defaults?.price ?? '50.00',
    currency: defaults?.currency ?? 'USD',
    capacity: defaults?.capacity ?? '100',
  };
}

export function OrganizerEventForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venueName, setVenueName] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [tiers, setTiers] = useState<TierFormData[]>([
    createEmptyTier({ name: 'General Admission' }),
  ]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateTier(key: number, field: keyof Omit<TierFormData, 'key'>, value: string) {
    setTiers((prev) => prev.map((t) => (t.key === key ? { ...t, [field]: value } : t)));
  }

  function addTier() {
    setTiers((prev) => [...prev, createEmptyTier()]);
  }

  function removeTier(key: number) {
    setTiers((prev) => (prev.length <= 1 ? prev : prev.filter((t) => t.key !== key)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
      setError('End date must be after start date');
      return;
    }

    // Validate all tiers
    const parsedTiers = [];
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (!tier.name.trim()) {
        setError(`Tier ${i + 1}: Name is required`);
        return;
      }
      const priceNum = parseFloat(tier.price);
      if (isNaN(priceNum) || priceNum < 0) {
        setError(`Tier ${i + 1} (${tier.name}): Price must be a non-negative number`);
        return;
      }
      const capacityNum = parseInt(tier.capacity, 10);
      if (isNaN(capacityNum) || capacityNum < 1) {
        setError(`Tier ${i + 1} (${tier.name}): Capacity must be at least 1`);
        return;
      }
      parsedTiers.push({
        name: tier.name.trim(),
        priceMinor: Math.round(priceNum * 100),
        currency: tier.currency,
        capacityLimit: capacityNum,
      });
    }

    // Check for duplicate tier names
    const names = parsedTiers.map((t) => t.name.toLowerCase());
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length > 0) {
      setError(`Duplicate tier name: "${dupes[0]}". Each tier must have a unique name.`);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await createOrganizerEvent({
        title,
        description: description || undefined,
        venueName,
        startAt: toISOUtc(startAt),
        endAt: toISOUtc(endAt),
        timezone: 'UTC',
        tiers: parsedTiers,
      });
      setMessage(`Event created successfully with ${parsedTiers.length} tier(s) (ID: ${response.id})`);
      setTitle('');
      setDescription('');
      setVenueName('');
      setStartAt('');
      setEndAt('');
      setTiers([createEmptyTier({ name: 'General Admission' })]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <ConfirmationBanner type="success" title="Event Created" message={message} />
      )}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          required
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief event description (optional)"
        />
        <Input
          label="Venue"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          placeholder="Venue name"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start Date & Time"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
          />
          <Input
            label="End Date & Time"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            min={startAt || undefined}
            required
          />
        </div>

        {/* Ticket Tiers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Ticket Tiers ({tiers.length})
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addTier}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Tier
            </Button>
          </div>

          {tiers.map((tier, index) => (
            <div key={tier.key} className="rounded-lg border p-4 space-y-3 relative">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Tier {index + 1}
                </p>
                {tiers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => removeTier(tier.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <Input
                label="Tier Name"
                value={tier.name}
                onChange={(e) => updateTier(tier.key, 'name', e.target.value)}
                placeholder="e.g. General Admission, VIP, Early Bird"
                required
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Ticket Price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={tier.price}
                  onChange={(e) => updateTier(tier.key, 'price', e.target.value)}
                  placeholder="50.00"
                  required
                />
                <Select
                  label="Currency"
                  value={tier.currency}
                  onChange={(e) => updateTier(tier.key, 'currency', e.target.value)}
                  options={CURRENCY_OPTIONS}
                />
                <Input
                  label="Capacity"
                  type="number"
                  min="1"
                  step="1"
                  value={tier.capacity}
                  onChange={(e) => updateTier(tier.key, 'capacity', e.target.value)}
                  placeholder="100"
                  required
                />
              </div>
            </div>
          ))}

          {tiers.length < 10 && (
            <button
              type="button"
              onClick={addTier}
              className="w-full rounded-lg border-2 border-dashed border-muted-foreground/25 p-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Plus className="mr-1.5 h-4 w-4 inline" />
              Add another ticket tier
            </button>
          )}
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Create Event
        </Button>
      </form>
    </div>
  );
}

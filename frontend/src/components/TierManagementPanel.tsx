import { useState, type FormEvent } from 'react';
import {
  getOrganizerEventDetails,
  updateEventTiers,
  type TierDetails,
  type CreateTierPayload,
} from '../services/organizerApi';
import {
  Input, Button, Alert, AlertDescription, Select, Badge, Separator,
} from '../components/ui';
import { ConfirmationBanner } from '../components/app/ConfirmationBanner';
import { Plus, Trash2, Save } from 'lucide-react';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
];

interface TierEditRow {
  key: number;
  existingId?: string;
  name: string;
  price: string;
  currency: string;
  capacity: string;
  soldQuantity: number;
  reservedQuantity: number;
  isNew: boolean;
}

let rowKeyCounter = 1;

function tierToEditRow(tier: TierDetails): TierEditRow {
  return {
    key: rowKeyCounter++,
    existingId: tier.id,
    name: tier.name,
    price: (tier.priceMinor / 100).toFixed(2),
    currency: tier.currency,
    capacity: String(tier.capacityLimit),
    soldQuantity: tier.soldQuantity,
    reservedQuantity: tier.reservedQuantity,
    isNew: false,
  };
}

export function TierManagementPanel() {
  const [eventId, setEventId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [tiers, setTiers] = useState<TierEditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loaded, setLoaded] = useState(false);

  async function loadEvent() {
    if (!eventId.trim()) { setError('Enter an Event ID'); return; }
    setLoading(true); setError(''); setMessage(''); setLoaded(false);
    try {
      const event = await getOrganizerEventDetails(eventId.trim());
      setEventTitle(event.title);
      setTiers(event.tiers.map(tierToEditRow));
      setLoaded(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function updateTierField(key: number, field: keyof Omit<TierEditRow, 'key' | 'existingId' | 'isNew' | 'soldQuantity' | 'reservedQuantity'>, value: string) {
    setTiers((prev) => prev.map((t) => (t.key === key ? { ...t, [field]: value } : t)));
  }

  function addNewTier() {
    setTiers((prev) => [
      ...prev,
      {
        key: rowKeyCounter++,
        name: '',
        price: '50.00',
        currency: 'USD',
        capacity: '100',
        soldQuantity: 0,
        reservedQuantity: 0,
        isNew: true,
      },
    ]);
  }

  function removeTier(key: number) {
    setTiers((prev) => {
      if (prev.length <= 1) return prev;
      const tier = prev.find((t) => t.key === key);
      if (tier && !tier.isNew && (tier.soldQuantity > 0 || tier.reservedQuantity > 0)) return prev;
      return prev.filter((t) => t.key !== key);
    });
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (saving) return;

    const parsedTiers: CreateTierPayload[] = [];
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (!tier.name.trim()) { setError(`Tier ${i + 1}: Name is required`); return; }
      const priceNum = parseFloat(tier.price);
      if (isNaN(priceNum) || priceNum < 0) { setError(`Tier ${i + 1}: Price must be non-negative`); return; }
      const capacityNum = parseInt(tier.capacity, 10);
      if (isNaN(capacityNum) || capacityNum < 1) { setError(`Tier ${i + 1}: Capacity must be at least 1`); return; }
      if (capacityNum < tier.soldQuantity + tier.reservedQuantity) {
        setError(`Tier ${i + 1} (${tier.name}): Capacity cannot be below ${tier.soldQuantity + tier.reservedQuantity} (already sold/reserved)`);
        return;
      }
      parsedTiers.push({
        name: tier.name.trim(),
        priceMinor: Math.round(priceNum * 100),
        currency: tier.currency,
        capacityLimit: capacityNum,
      });
    }

    const names = parsedTiers.map((t) => t.name.toLowerCase());
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length > 0) { setError(`Duplicate tier name: "${dupes[0]}"`); return; }

    setSaving(true); setError(''); setMessage('');
    try {
      const result = await updateEventTiers(eventId.trim(), parsedTiers);
      setTiers(result.tiers.map(tierToEditRow));
      setMessage(`Updated ${result.tiers.length} tier(s) successfully`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {message && <ConfirmationBanner type="success" title="Tiers Updated" message={message} />}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            label="Event ID"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Paste the event ID to manage its tiers"
          />
        </div>
        <div className="self-end">
          <Button onClick={loadEvent} loading={loading} variant="outline">
            Load
          </Button>
        </div>
      </div>

      {loaded && (
        <>
          <div className="text-sm text-muted-foreground">
            Managing tiers for: <span className="font-medium text-foreground">{eventTitle}</span>
          </div>
          <Separator />
          <form onSubmit={handleSave} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Ticket Tiers ({tiers.length})
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addNewTier}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Tier
              </Button>
            </div>

            {tiers.map((tier, index) => (
              <div key={tier.key} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">Tier {index + 1}</p>
                    {tier.isNew && <Badge variant="default" className="text-xs">New</Badge>}
                    {!tier.isNew && tier.soldQuantity > 0 && (
                      <Badge variant="success" className="text-xs">{tier.soldQuantity} sold</Badge>
                    )}
                  </div>
                  {tiers.length > 1 && (tier.isNew || (tier.soldQuantity === 0 && tier.reservedQuantity === 0)) && (
                    <Button
                      type="button" variant="ghost" size="sm"
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
                  onChange={(e) => updateTierField(tier.key, 'name', e.target.value)}
                  placeholder="e.g. General Admission, VIP, Early Bird"
                  required
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Price" type="number" step="0.01" min="0"
                    value={tier.price}
                    onChange={(e) => updateTierField(tier.key, 'price', e.target.value)}
                    required
                  />
                  <Select
                    label="Currency"
                    value={tier.currency}
                    onChange={(e) => updateTierField(tier.key, 'currency', e.target.value)}
                    options={CURRENCY_OPTIONS}
                  />
                  <Input
                    label="Capacity" type="number" min="1" step="1"
                    value={tier.capacity}
                    onChange={(e) => updateTierField(tier.key, 'capacity', e.target.value)}
                    helperText={!tier.isNew ? `${tier.soldQuantity} sold, ${tier.reservedQuantity} reserved` : undefined}
                    required
                  />
                </div>
              </div>
            ))}

            <Button type="submit" loading={saving} className="w-full">
              <Save className="mr-1.5 h-4 w-4" />
              Save All Tiers
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

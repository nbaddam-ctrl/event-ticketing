import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  getOrganizerEventDetails,
  updateEventTiers,
  listOrganizerEvents,
  type TierDetails,
  type CreateTierPayload,
  type OrganizerEventItem,
} from '../services/organizerApi';
import {
  Input, Button, Alert, AlertDescription, Select, Badge, Separator,
} from '../components/ui';
import { ConfirmationBanner } from '../components/app/ConfirmationBanner';
import { Plus, Trash2, Save, Search, X, Loader2 } from 'lucide-react';

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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<OrganizerEventItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch results when debounced value changes
  useEffect(() => {
    if (!showDropdown) return;
    let cancelled = false;
    async function fetchResults() {
      setSearchLoading(true);
      try {
        const result = await listOrganizerEvents(1, 5, debouncedSearch || undefined);
        if (!cancelled) {
          setSearchResults(result.items);
        }
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }
    fetchResults();
    return () => { cancelled = true; };
  }, [debouncedSearch, showDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function selectEvent(item: OrganizerEventItem) {
    setShowDropdown(false);
    setSearchQuery(item.title);
    setEventId(item.id);
    setEventTitle(item.title);
    setLoading(true);
    setError('');
    setMessage('');
    setLoaded(false);
    try {
      const event = await getOrganizerEventDetails(item.id);
      setTiers(event.tiers.map(tierToEditRow));
      setLoaded(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function clearSelection() {
    setEventId('');
    setEventTitle('');
    setSearchQuery('');
    setDebouncedSearch('');
    setTiers([]);
    setLoaded(false);
    setError('');
    setMessage('');
  }

  function statusBadgeVariant(status: string) {
    switch (status) {
      case 'published': return 'success' as const;
      case 'cancelled': return 'destructive' as const;
      case 'draft': return 'secondary' as const;
      default: return 'outline' as const;
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

      <div ref={dropdownRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (loaded) clearSelection();
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search events by name..."
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          />
          {(searchQuery || loaded) && (
            <button
              type="button"
              onClick={clearSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showDropdown && !loaded && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
            {searchLoading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No events match your search.' : 'No events yet. Create an event first.'}
              </div>
            ) : (
              <ul className="max-h-60 overflow-auto py-1">
                {searchResults.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectEvent(item)}
                      className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{item.title}</span>
                        <Badge variant={statusBadgeVariant(item.status)} className="text-[10px] shrink-0">
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(item.startAt).toLocaleDateString()} · {item.venueName}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tiers…
        </div>
      )}

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

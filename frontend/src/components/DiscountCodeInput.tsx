import { useState, useEffect } from 'react';
import { validateDiscount, listAvailableDiscounts, type AvailableDiscount } from '../services/checkoutApi';
import { Input, Button, Badge } from '../components/ui';
import { Tag, Sparkles } from 'lucide-react';

interface Props {
  eventId: string;
  tierId: string;
  quantity: number;
  onApplied: (code: string, amountMinor: number) => void;
}

export function DiscountCodeInput({ eventId, tierId, quantity, onApplied }: Props) {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(false);
  const [appliedCode, setAppliedCode] = useState('');
  const [discountDisplay, setDiscountDisplay] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<AvailableDiscount[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSuggestionsLoading(true);
    listAvailableDiscounts(eventId)
      .then((result) => {
        if (!cancelled) setSuggestions(result.discounts);
      })
      .catch(() => {
        /* silently ignore */
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId]);

  async function applyCode() {
    if (loading || !code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await validateDiscount({ code, eventId, ticketTierId: tierId, quantity });
      if (!result.valid) {
        setError(result.reason ?? 'Invalid discount code');
        return;
      }

      onApplied(code, result.discountAmountMinor);
      setApplied(true);
      setAppliedCode(code);
      setDiscountDisplay(`$${(result.discountAmountMinor / 100).toFixed(2)}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function selectSuggestion(suggestionCode: string) {
    setCode(suggestionCode);
    setError('');
  }

  if (applied) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-success" />
          <span className="text-sm font-medium">Discount applied</span>
          <Badge variant="success">{appliedCode}</Badge>
          <span className="text-sm text-muted-foreground">saves {discountDisplay}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Discount Code</p>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter discount code"
            error={error}
          />
        </div>
        <Button type="button" variant="outline" size="default" loading={loading} className="shrink-0" onClick={applyCode}>
          Apply
        </Button>
      </div>

      {/* Available discount suggestions */}
      {!suggestionsLoading && suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Available discounts
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => selectSuggestion(s.code)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${
                  code === s.code
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <Tag className="h-3 w-3" />
                {s.code}
                <span className="text-[10px] opacity-70">({s.description})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
